import { accountInfoQuery, depositsQuery } from "./helpers/queries";
import { createClient, sendQuery } from "./subgraph";
import { BaseArgs } from "./subgraph/types";

import { MockCorePool, MockCorePool__factory } from "../typechain";

import * as hre from "hardhat";

require("dotenv").config();

export const getStakers = async () => {
  const uri = process.env.ZFI_GRAPH_URI;

  if (!uri) {
    throw new Error('Subgraph URI is required');
  }

  const client = createClient(uri);

  const response = await sendQuery<BaseArgs>(
    client,
    accountInfoQuery,
    { 
      first: 1,
    }
  )

  const lpPoolAddress = "0x9E87a268D42B0Aba399C121428fcE2c626Ea01FF";
  const wildPoolAddress = "0x3aC551725ac98C5DCdeA197cEaaE7cDb8a71a2B4";

  // Address > amount staked
  const wildValues = new Map<string, bigint>();
  const lpValues = new Map<string, bigint>();

  // Signer is to be used READ ONLY
  const [signer] = await hre.ethers.getSigners();
  const wildPool = new MockCorePool__factory(signer).attach(wildPoolAddress) as MockCorePool;
  const lpPool = new MockCorePool__factory(signer).attach(lpPoolAddress) as MockCorePool;

  for (let account of response.data.accounts) {
    const user = await wildPool.users(account.id);
    console.log(account.id);
    console.log("staked-etherscan:\t", user[0]);
    console.log("staked-subgraph:\t", account.totalStakedWild);
    // validate the `amount staked` matches what is on chain
    // add "user => amount staked" for both mappings
  }

  // console.log()
}

getStakers();