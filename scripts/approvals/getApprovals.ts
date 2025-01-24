import * as hre from 'hardhat'
import { ApolloClient, InMemoryCache, gql} from '@apollo/client'
import { approvalsQuery } from '../helpers/queries'
import { knownVulnerableContracts, allContracts, compromisedWallets, WILD_TOKEN_ADDRESS } from '../helpers/constants'
import { createClient, sendQuery } from '../subgraph';

import { MockOwnableERC20__factory } from '../../typechain';

export const createApprovalsList = async () => {

  let total = 0;
  let lastId = "0xffffcdb89b107a6fe77892ea813559237ad8f10409e2912f3b9ef03cb330e1473f020000";
  const first = 1000;

  const client = createClient();

  let response = await sendQuery(
    client,
    approvalsQuery,
    {
      first: first,
      lastId: lastId
    }
  )

  // Mapping of user => contract => value to track how much a user has approved a contract for
  type ContractToValuesMap = Map<string, BigInt>;
  let usersToCVMap = new Map<string, ContractToValuesMap>();

  const [userA] = await hre.ethers.getSigners();

  const wildContract = MockOwnableERC20__factory.connect(WILD_TOKEN_ADDRESS, userA);
  const waitTime = 10000;

  // get every single approval to write to JSON because thatll be faster downstream
  console.log("[");
  try {
    while(response.data.approvals.length > 0 && total < 39000) {
      for (let i = 0; i < response.data.approvals.length; i++) {
        const appr = response.data.approvals[i];

        const writeObj = {
          owner: appr.owner,
          spender: appr.spender,
          value: appr.value
        }

        knownVulnerableContracts.forEach((contract) => {
          if(contract.toLowerCase() === appr.spender.toLowerCase()) {
            console.log(JSON.stringify(writeObj))
            // console.log("  {");
            // console.log(`    "owner": "${appr.owner}",`)
            // console.log(`    "spender": "${appr.spender}",`);
            // console.log(`    "value": "${appr.value}"`);
            // console.log("  },")
          }
        })


        // Update `lastId` for next batch
        if (i + 1 === response.data.approvals.length) {
          console.log(`Last ID: ${appr.id}`);
          lastId = appr.id;
        }
      }
  
      total += first;
  
      if (total % 10000 == 0) {
        // console.log(`${total} records read. Fetching next batch...`)
      }
      
      // await setTimeout(async () => {
        response = await client.query({
          query: gql(approvalsQuery),
          variables: {
            first: first,
            lastId: lastId
          }
        });
      // }, waitTime)
    }

    console.log("]");

    // if we DONT error, make sure we still log the total
    // console.log(`\nTotal users that have approved one or more compromised contracts: ${usersToCVMap.size}`);
  } catch (e: any) {
    // try iterating over a single user and approvals they have made to simplify this
    // because multiple approvals to the same address may be overridden?
    // for( of usersToCVMap)
    console.log(e)
  }
}

createApprovalsList();