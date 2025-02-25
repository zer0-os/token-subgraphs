import { accountInfoQuery, depositsQuery } from "./helpers/queries";
import { createClient, sendQuery } from "./subgraph";
import { BaseArgs } from "./subgraph/types";

import { MockCorePool, MockCorePool__factory } from "../typechain";

import * as hre from "hardhat";

require("dotenv").config();

type Account = {
  id: string
}

type AccountAmount = {
  account: string,
  amount: bigint
}

type AccountAmounts = Array<AccountAmount>;

const getAmount = async (pool: MockCorePool, account: string) => {
  const depositsLength = await pool.getDepositsLength(account);
  
  let amount = 0n;
  for (let i = 0; i < depositsLength; i++) {
    const deposit = await pool.getDeposit(account, i);
    amount += deposit.tokenAmount;
  }

  return amount;
}

const getStakesInPool = async (
  accounts: Array<Account>,
  wildPool: MockCorePool,
  lpPool: MockCorePool,
): Promise<[Array<AccountAmount>, Array<AccountAmount>]> => {
  const wildAmounts = new Array<AccountAmount>();
  const lpAmounts = new Array<AccountAmount>();

  // For rate limits we storage last account ID used
  let lastId = hre.ethers.ZeroAddress;
  try {
    for (let account of accounts) {
      let amount = await getAmount(wildPool, account.id);
      if (amount > 0n) wildAmounts.push({ account: account.id, amount });
      
      amount = await getAmount(lpPool, account.id);
      if (amount > 0n) lpAmounts.push({ account: account.id, amount });

      lastId = account.id;
    }
  } catch (e) {
    console.log("lastId", lastId);
  }

  return [wildAmounts, lpAmounts];
}

export const getStakers = async () => {
  const uri = process.env.ZFI_GRAPH_URI;

  if (!uri) {
    throw new Error('Subgraph URI is required');
  }

  // If we need manual updating
  const lastId = hre.ethers.ZeroAddress;

  const client = createClient(uri);

  // Get batch of staked accounts
  let response = await sendQuery<BaseArgs>(
    client,
    accountInfoQuery,
    { 
      first: 1000,
      lastId: lastId
    }
  )

  const lpPoolAddress = "0x9E87a268D42B0Aba399C121428fcE2c626Ea01FF";
  const wildPoolAddress = "0x3aC551725ac98C5DCdeA197cEaaE7cDb8a71a2B4";

  // Address > amount staked
  const wildStakes: Array<AccountAmount> = [];
  const lpStakes: Array<AccountAmount> = [];

  // Signer is to be used READ ONLY
  const [signer] = await hre.ethers.getSigners();
  const wildPool = new MockCorePool__factory(signer).attach(wildPoolAddress) as MockCorePool;
  const lpPool = new MockCorePool__factory(signer).attach(lpPoolAddress) as MockCorePool;

  while (response.data.accounts.length > 0) {
    const [wildAmounts, lpAmounts] = await getStakesInPool(response.data.accounts, wildPool, lpPool);

    wildStakes.push(...wildAmounts);
    lpStakes.push(...lpAmounts);

    // Refresh the client each batch to avoid timeout
    const client = createClient(uri);

    response = await sendQuery<BaseArgs>(
      client,
      accountInfoQuery,
      { 
        first: 1000,
        lastId: lastId // update as needed, if needed
      }
    )
  }

  console.log('WILD STAKES', wildStakes);
  console.log('LP STAKES', lpStakes);
}

getStakers();