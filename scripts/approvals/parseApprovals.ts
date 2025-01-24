import * as hre from 'hardhat'
import { ApolloClient, InMemoryCache, gql} from '@apollo/client'
import { approvalsQuery } from '../helpers/queries'
import { knownVulnerableContracts, allContracts, compromisedWallets, WILD_TOKEN_ADDRESS } from '../helpers/constants'

import { allZeroContractApprovals } from '../helpers/allZeroContractApprovals';

import { MockOwnableERC20__factory } from '../../typechain';

export const parseApprovals = async () => {
    // Mapping of user => contract => value to track how much a user has approved a contract for
    interface UserValue {
      user: string;
      value: bigint;
    }

    type UserValues = Array<UserValue>;

    // Map for contract => (user, value)
    const contractsToUV = new Map<string, UserValues>();

  const [userA] = await hre.ethers.getSigners();

  const wildContract = MockOwnableERC20__factory.connect(WILD_TOKEN_ADDRESS, userA);
  const waitTime = 100000;

  let total = 0;

  try {
    // for every approval, we check if `spender` is one of the compromised contracts
    for (const appr of allZeroContractApprovals) {
      for (const contract of knownVulnerableContracts) {
        if (contract.toLowerCase() === appr.spender.toLowerCase()) {
          let allowance: bigint = 0n;
  
          // setTimeout(async () => {
            allowance = await wildContract.allowance(appr.owner, appr.spender);
          // }, waitTime);
  
          if (allowance > 0n) {
            // Get user => value
            const uvArray = contractsToUV.get(appr.spender);
  
            const userValue = {
              user: appr.owner,
              value: allowance
            }
  
            if (uvArray) {
              const userRecords = uvArray.filter((userValue) => {
                userValue.user.toLowerCase() === appr.owner.toLowerCase()
              })
              
              // Array already exists, just append to it
              if (userRecords.length === 0) {
                // user does not exist in mapping
                contractsToUV.get(appr.spender)!.push(userValue);
                console.log("user DOES NOT exist")
              } else {
                console.log("user exists already")
              }
            } else {
              // Create array mapping with first value included
              contractsToUV.set(appr.spender, [userValue]);
            }
          }
        }
        if (total % 500 == 0) {
          console.log(total)
        }
        total++;
      }
    }
    
    interface ReportOutput {
      [contract: string]: UserValues
    }

    console.log("{\n")
    for (const [contract, uvPair] of contractsToUV.entries()) {
      console.log(`"${contract}": [` )
      for (const pair of uvPair) {
        console.log("{")
        process.stdout.write(`"owner": "${pair.user}",\n`)
        process.stdout.write(`"value": "${pair.value}"\n`)
        console.log("},")
      }
      console.log(`\n],` )
    }
    console.log("\n}")

    // console.log(contractsToUV);
  } catch (e: any) {
    process.exit(1);
  }
}

parseApprovals();