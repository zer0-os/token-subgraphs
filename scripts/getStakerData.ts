import { accountInfoQuery } from "./helpers/queries";
import { createClient, sendQuery } from "./subgraph";
import { BaseArgs } from "./subgraph/types";
import {
  MockCorePool,
  MockCorePool__factory,
  MockOwnableERC20__factory,
  MockOwnableERC20,
} from "../typechain";
import { Contract } from "ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import * as artifact from "./helpers/uniswap_v2_token_abi.json";
import { AccountAmount, Totals, UserStake } from "./types";
import { expect } from "chai";
import { LP_POOL_ADDRESS, LP_TOKEN_ADDRESS, WILD_POOL_ADDRESS, WILD_TOKEN_ADDRESS } from "./helpers/constants";


const getStakesByUser = async (
  pool : MockCorePool, account : string,
) : Promise<UserStake> => {
  const depositsLength = await pool.getDepositsLength(account);

  let amount = 0n;
  let yieldAmount = 0n;

  // Parse all deposits created by staking. These deposits are updated
  // when unstaking, so total sum of deposits always represents amount currently staked
  for (let i = 0; i < depositsLength; i++) {
    const deposit = await pool.getDeposit(account, i);
    if (deposit.isYield) {
      // Yield deposits are deposits from actions that call `processRewards` and so aren't
      // actually represented by ERC20 tokens in the contract. Just a record of the yield, like an I.O.U.
      yieldAmount += deposit.tokenAmount;
    } else {
      amount += deposit.tokenAmount;
    }
  }

  const tokenAmount = (await pool.users(account)).tokenAmount;

  // `tokenAmount` should always equal the sum of `amount` and `yieldAmount`
  expect(tokenAmount).to.eq(amount + yieldAmount);

  return { amount, yieldAmount };
};

const getStakesInPool = async (
  accounts : Array<string>,
  wildPool : MockCorePool,
  lpPool : MockCorePool,
) : Promise<[Totals, Map<string, AccountAmount>]> => {

  const stakers = new Map<string, AccountAmount>();

  let totalWildStaked = 0n;
  let totalWildYield = 0n;

  let totalLPStaked = 0n;
  let totalWildLPYield = 0n;

  let totalWildPendingRewards = 0n;
  let totalLPPendingRewards = 0n;

  const stakersThatExited = new Array<string>();
  const stakersThatExitedLP = new Array<string>();

  for (let i = 0; i< accounts.length; i++) {
    const account = accounts[i];

    const promises = [
      wildPool.pendingYieldRewards(account),
      lpPool.pendingYieldRewards(account),
      getStakesByUser(wildPool, account),
      getStakesByUser(lpPool, account),
    ];

    /* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion */
    const [
      pendingYieldRewardsWild,
      pendingYieldRewardsLP,
      wildAmounts,
      lpAmounts,
    ] = await Promise.all(promises) as unknown as [bigint, bigint, UserStake, UserStake];

    if (!stakers.has(account)) {
      stakers.set(account, {
        user: account,
        amountStakedWILD: wildAmounts.amount.toString(),
        amountStakedWILDYield: wildAmounts.yieldAmount.toString(),
        amountStakedLP: lpAmounts.amount.toString(),
        pendingYieldRewardsWILD: pendingYieldRewardsWild.toString(),
        pendingYieldRewardsLP: pendingYieldRewardsLP.toString(),
      });
    } else {
      // Should never get here
      console.log(`Duplicate account found: ${account}`);
    }

    totalWildStaked += wildAmounts.amount;
    totalWildYield += wildAmounts.yieldAmount;
    totalWildPendingRewards += pendingYieldRewardsWild;

    totalLPStaked += lpAmounts.amount;
    totalWildLPYield += lpAmounts.yieldAmount;
    totalLPPendingRewards += pendingYieldRewardsLP;

    console.log("Processed: ", i);
  }

  // verify this on chain
  console.log("# Stakers that exited Wild Pool: ", stakersThatExited.length);
  console.log("# Stakers that exited LP Pool: ", stakersThatExitedLP.length);
  fs.writeFileSync("output/stakersThatExited.json", JSON.stringify(stakersThatExited, undefined, 2));
  fs.writeFileSync("output/stakersThatExitedLP.json", JSON.stringify(stakersThatExitedLP, undefined, 2));

  return [
    {
      totalWildStaked,
      totalWildYield,
      totalWildPendingRewards,
      totalLPStaked,
      totalWildLPYield,
      totalLPPendingRewards,
    } as Totals,
    stakers,
  ]
};

const getStakers = async () => {
  const uri = process.env.ZFI_GRAPH_URI;

  if (!uri) {
    throw new Error("Subgraph URI is required");
  }

  const client = createClient(uri);

  let skip = 0;

  // Get batch of staked accounts
  let response = await sendQuery<BaseArgs>(
    client,
    accountInfoQuery,
    {
      first: 1000,
      skip,
    },
  );

  const stakers : Array<string> = [];

  while(response.data.accounts.length > 0) {
    for(const account of response.data.accounts) {
      stakers.push(account.id);
    }

    skip += 1000;
    response = await sendQuery<BaseArgs>(
      client,
      accountInfoQuery,
      {
        first: 1000,
        skip,
      },
    );
  }

  return stakers;
};

const main = async () => {
  const [signer] = await hre.ethers.getSigners();

  const wildToken = new MockOwnableERC20__factory(signer).attach(WILD_TOKEN_ADDRESS) as MockOwnableERC20;

  // Read modified ABI from UniswapV2ERC20 token to get correct `balanceOf`
  const lpToken = new Contract(LP_TOKEN_ADDRESS, artifact.abi, signer) as unknown as MockOwnableERC20;
  const wildPool = new MockCorePool__factory(signer).attach(WILD_POOL_ADDRESS) as MockCorePool;
  const lpPool = new MockCorePool__factory(signer).attach(LP_POOL_ADDRESS) as MockCorePool;

  let stakers = Array<string>();

  // When we decide on a snapshot timestamp, get this list again to be sure we have latest
  if (fs.existsSync("output/stakers.json")) {
    stakers = await getStakers();
    fs.writeFileSync("output/stakers.json", JSON.stringify(stakers, undefined, 2));
    console.log("Total # of stakers: ", stakers.length);
  } else {
    stakers = JSON.parse(fs.readFileSync("output/stakers.json").toString());
  }

  console.log("Total # of stakers: ", stakers.length);
  console.log("Starting...");

  const [ results, stakersMap ] = await getStakesInPool(
    stakers,
    // stakers.slice(0,5),
    wildPool,
    lpPool,
  );

  // user address, wild amount, LP amount
  type MerkleData = [string, string, string];
  const merkleData: Array<MerkleData> = [];

  // Turn into merkle data format needed
  for (const entry of stakersMap.entries()) {
    const account = entry[1];

    const wildAmountOwed = BigInt(account.amountStakedWILD) + BigInt(account.amountStakedWILDYield) + BigInt(account.pendingYieldRewardsWILD);
    const lpAmountOwed = BigInt(account.amountStakedLP);

    if (wildAmountOwed > 0n || lpAmountOwed > 0n) {
      merkleData.push([account.user, wildAmountOwed.toString(), lpAmountOwed.toString()]);
    }
  }

  const balanceOfWildPool = await wildToken.balanceOf(await wildPool.getAddress());
  const balanceOfLpPool = await lpToken.balanceOf(await lpPool.getAddress());

  // Validate the aggregate values against the contract balances
  expect(balanceOfWildPool).to.eq(results.totalWildStaked);
  expect(balanceOfLpPool).to.eq(results.totalLPStaked);

  console.log("Total Wild Staked: ", results.totalWildStaked.toString());
  console.log("Total Wild Yield: ", results.totalWildYield.toString());
  console.log("Total Wild Pending Rewards: ", results.totalWildPendingRewards.toString());
  console.log("Balance of Wild Pool: ", balanceOfWildPool.toString());

  console.log("Total LP Staked: ", results.totalLPStaked.toString());
  console.log("Total LP Yield: ", results.totalWildLPYield.toString());
  console.log("Total LP Rewards: ", results.totalLPPendingRewards.toString());
  console.log("Balance of LP Pool: ", balanceOfLpPool.toString());

  const output = {
    totalWildStaked: results.totalWildStaked.toString(),
    totalWildYield: results.totalWildYield.toString(),
    totalWildPendingRewards: results.totalWildPendingRewards.toString(),
    balanceOfWildPool: balanceOfWildPool.toString(),
    totalLPStaked: results.totalLPStaked.toString(),
    totalWildLPYield: results.totalWildLPYield.toString(),
    totalLPPendingRewards: results.totalLPPendingRewards.toString(),
    balanceOfLpPool: balanceOfLpPool.toString(),
  };

  // Output merkle data as well as totals for verification
  fs.writeFileSync("output/merkle_data.json", JSON.stringify(merkleData, undefined, 2));
  fs.writeFileSync("output/totals.json", JSON.stringify(output, undefined, 2));
  fs.writeFileSync("output/allStakers.json", JSON.stringify(Array.from(stakersMap), undefined, 2));
};

main().then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });