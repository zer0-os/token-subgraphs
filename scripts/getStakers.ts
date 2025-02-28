import { accountInfoQuery, depositsQuery } from "./helpers/queries";
import { createClient, sendQuery } from "./subgraph";
import { BaseArgs } from "./subgraph/types";
import { MockCorePool, MockCorePool__factory, MockOwnableERC20__factory, MockOwnableERC20 } from "../typechain";
import { Contract } from "ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import * as artifact from "./helpers/uniswap_v2_token_abi.json"
import { AccountAmount } from "./types";

require("dotenv").config();

interface StakesUser {
  amount: bigint,
  yieldAmount: bigint
}

const getStakesUser = async (
  pool: MockCorePool, account: string
): Promise<StakesUser> => {
  const depositsLength = await pool.getDepositsLength(account);

  let amount = 0n;
  let yieldAmount = 0n;

  for (let i = 0; i < depositsLength; i++) {
    const deposit = await pool.getDeposit(account, i);
    if (deposit.isYield) {
      yieldAmount += deposit.tokenAmount;
    } else {
      amount += deposit.tokenAmount;
    }
  }

  return { amount, yieldAmount };
}

const getStakesInPool = async (
  accounts: Array<string>,
  wildPool: MockCorePool,
  lpPool: MockCorePool,
): Promise<ResultAmounts> => {
  const wildAmountsArr = new Array<AccountAmount>();
  const lpAmountsArr = new Array<AccountAmount>();

  let totalWildStaked = 0n;
  let totalWildYield = 0n;

  let totalLPStaked = 0n;
  let totalWildLPYield = 0n;

  let totalWildPendingRewards = 0n;
  let totalLPPendingRewards = 0n;

  let lastId = "";

  try {
    for (let i = 0; i< accounts.length; i++) {
      const account = accounts[i];
      lastId = account;

      const promises = [
        wildPool.pendingYieldRewards(account),
        lpPool.pendingYieldRewards(account),
        getStakesUser(wildPool, account),
        getStakesUser(lpPool, account)
      ]

      const [
        pendingYieldRewardsWild,
        pendingYieldRewardsLP,
        wildAmounts,
        lpAmounts
      ] = await Promise.all(promises) as unknown as [bigint, bigint, StakesUser, StakesUser];

      if (wildAmounts.amount > 0n) {
          wildAmountsArr.push(
          { 
            user: account,
            amountStaked: wildAmounts.amount.toString(),
            pendingYieldRewards: pendingYieldRewardsWild.toString()
          }
        );

        totalWildStaked += wildAmounts.amount;
        totalWildYield += wildAmounts.yieldAmount;
        totalWildPendingRewards += pendingYieldRewardsWild;
      }

      if (lpAmounts.amount > 0n) {
        lpAmountsArr.push(
          { 
            user: account,
            amountStaked: lpAmounts.amount.toString(),
            pendingYieldRewards: pendingYieldRewardsLP.toString()
          }
        );

        totalLPStaked += lpAmounts.amount;
        totalWildLPYield += lpAmounts.yieldAmount;
        totalLPPendingRewards += pendingYieldRewardsLP;
      }

      console.log("Processed: ", i);
    }
  } catch (e) {
    // We can start the index from `lastId`
    console.log("lastID: ", lastId);
    // Return partial if we hit an error
    return {
      wildAmountsArr,
      lpAmountsArr,
      totalWildStaked,
      totalWildYield,
      totalWildPendingRewards,
      totalLPStaked,
      totalWildLPYield,
      totalLPPendingRewards
    };
  }

  return {
    wildAmountsArr,
    lpAmountsArr,
    totalWildStaked,
    totalWildYield,
    totalWildPendingRewards,
    totalLPStaked,
    totalWildLPYield,
    totalLPPendingRewards
  };
}

interface ResultAmounts {
  wildAmountsArr: Array<AccountAmount>,
  lpAmountsArr: Array<AccountAmount>,
  totalWildStaked: bigint,
  totalWildYield: bigint,
  totalWildPendingRewards: bigint,
  totalLPStaked: bigint,
  totalWildLPYield: bigint,
  totalLPPendingRewards: bigint
}

const getStakers = async () => {
  const uri = process.env.ZFI_GRAPH_URI;

  if (!uri) {
    throw new Error('Subgraph URI is required');
  }

  const client = createClient(uri);

  let skip = 0;

  // Get batch of staked accounts
  let response = await sendQuery<BaseArgs>(
    client,
    accountInfoQuery,
    { 
      first: 1000,
      skip: skip,
    }
  )

  const stakers: Array<string> = [];

  while(response.data.accounts.length > 0 ) {
    for(const account of response.data.accounts) {
      stakers.push(account.id);
    }

    skip += 1000;
    response = await sendQuery<BaseArgs>(
      client,
      accountInfoQuery,
      { 
        first: 1000,
        skip: skip,
      }
    )
  }

  return stakers;
}

const main = async () => {
  const [signer] = await hre.ethers.getSigners();

  const wildTokenAddress = "0x2a3bFF78B79A009976EeA096a51A948a3dC00e34";
  const lpTokenAddress = "0xcaA004418eB42cdf00cB057b7C9E28f0FfD840a5";
  const lpPoolAddress = "0x9E87a268D42B0Aba399C121428fcE2c626Ea01FF";
  const wildPoolAddress = "0x3aC551725ac98C5DCdeA197cEaaE7cDb8a71a2B4";

  const wildToken = new MockOwnableERC20__factory(signer).attach(wildTokenAddress) as MockOwnableERC20;

  // Read modified ABI from UniswapV2ERC20 token to get correct `balanceOf`
  const lpToken = new Contract(lpTokenAddress, artifact.abi, signer) as unknown as MockOwnableERC20;
  const wildPool = new MockCorePool__factory(signer).attach(wildPoolAddress) as MockCorePool;
  const lpPool = new MockCorePool__factory(signer).attach(lpPoolAddress) as MockCorePool;

  let stakers = Array<string>();

  // When we decide on a snapshot timestamp, get this list again to be sure we have latest
  if (!fs.existsSync('output/stakers.json')) {
    stakers = await getStakers();
    fs.writeFileSync('output/stakers.json', JSON.stringify(stakers, undefined, 2));
    console.log("Total # of stakers: ", stakers.length);
  } else {
    stakers = JSON.parse(fs.readFileSync('output/stakers.json').toString());
  }

  let results: ResultAmounts;

  console.log("Total # of stakers: ", stakers.length);
  console.log("Starting...");
  try {
    results = await getStakesInPool(
      stakers,
      wildPool,
      lpPool
    );
  
    // Validate the aggregate values against the contracts
    const balanceOfWildPool = await wildToken.balanceOf(await wildPool.getAddress());
    const balanceOfLpPool = await lpToken.balanceOf(await lpPool.getAddress());
  
    console.log("Total Wild Staked: ", results.totalWildStaked.toString());
    console.log("Total Wild Yield: ", results.totalWildYield.toString());
    console.log("Total Wild Pending Rewards: ", results.totalWildPendingRewards.toString());
    console.log("Balance of Wild Pool: ", balanceOfWildPool.toString());
  
    console.log("Total LP Staked: ", results.totalLPStaked.toString());
    console.log("Total LP Yield: ", results.totalWildLPYield.toString());
    console.log("Total LP Rewards: ", results.totalLPPendingRewards.toString());
    console.log("Balance of LP Pool: ", balanceOfLpPool.toString());
  
    fs.writeFileSync('output/wildStakes.json', JSON.stringify(results.wildAmountsArr, undefined, 2));
    fs.writeFileSync('output/lpStakes.json', JSON.stringify(results.lpAmountsArr, undefined, 2));
  } catch (e) {
    console.log("Error: ", e);
    fs.writeFileSync('output/wildStakes.json', JSON.stringify(results.wildAmountsArr, undefined, 2));
    fs.writeFileSync('output/lpStakes.json', JSON.stringify(results.lpAmountsArr, undefined, 2));
  }
}

main();