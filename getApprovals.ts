import { ApolloClient, InMemoryCache, gql} from '@apollo/client'
import { approvalsQuery } from './queries'

import { knownVulnerableContracts } from './constants'

import * as graphy from "./.graphclient"

export const API_URL = process.env.GRAPH_URL;

const main = async () => {
  const client = new ApolloClient({
    uri: API_URL,
    cache: new InMemoryCache(),
  })

  let total = 0;
  let first = 1000;
  let lastId = "0xffffcdb89b107a6fe77892ea813559237ad8f10409e2912f3b9ef03cb330e1473f020000";

  // Using apollo client
  let response = await client.query({
    query: gql(approvalsQuery),
    variables: {
      first: first,
      lastId: lastId,
    }
  })

  // Mapping of user => contract => value to track how much a user has approved a contract for
  type ContractToValuesMap = Map<string, BigInt>;
  let usersToCVMap = new Map<string, ContractToValuesMap>();

  try {
    while(response.data.approvals.length > 0) {
      // Avoid rate limits
      setTimeout(() => {}, 15000);
  
      for (let i = 0; i < response.data.approvals.length; i++) {
        const appr = response.data.approvals[i];
  
        knownVulnerableContracts.forEach((contract) => {
          if (contract.toLowerCase() === appr.spender.toLowerCase()) {
            console.log(`Owner:\t\t${appr.owner}`);
            console.log(`Spender:\t${appr.spender}`);
            console.log(`Value:\t\t${appr.value}\n`);
  
            let contractToValues: ContractToValuesMap;
  
            if (usersToCVMap.has(appr.owner)) {
              contractToValues = usersToCVMap.get(appr.owner.toLowerCase())!;
            } else {
              contractToValues = new Map<string, BigInt>();
              usersToCVMap.set(appr.owner.toLowerCase(), contractToValues);
            }
  
            contractToValues.set(appr.spender.toLowerCase(), appr.value);
          }
        });
  
        // Update `lastId` for next batch
        if (i + 1 === response.data.approvals.length) {
          console.log(`Last ID: ${appr.id}`);
          lastId = appr.id;
        }
      }
  
      total += first;
  
      if (total % 10000 == 0) {
        console.log(`${total} records read. Fetching next batch...`)
      }
  
      response = await client.query({
        query: gql(approvalsQuery),
        variables: {
          first: first,
          lastId: lastId
        }
      });
    }
    // if we DONT error, hit this
    console.log(`\nTotal users that have approved one or more compromised contracts: ${usersToCVMap.size}`);
  } catch (e: any) {
    // try iterating over a single user and approvals they have made to simplify this
    // because multiple approvals to the same address may be overridden?
    // for( of usersToCVMap)
    console.log(`\nTotal users that have approved one or more compromised contracts: ${usersToCVMap.size}`);

    process.exit(1);
  }

  

}

main();