import * as fs from "fs";
import { AccountAmount } from "./types";

interface UserAmount {
  [key: string]: string;
}

const transform = (path: string) => {
  const data: Array<AccountAmount> = JSON.parse(fs.readFileSync(path, "utf8"));

  // Amount staked
  const amounts: Array<UserAmount> = [];

  // Pending yield rewards
  const rewards: Array<UserAmount> = [];

  // shoudl be arrays of { useraddress: amount } objects
  const amountObj : UserAmount = {};
  const rewardObj : UserAmount = {};

  let i = 0;
  for (const user in data) {

    amountObj[data[user].user] = data[user].amountStaked;
    // amounts.push(amountObj)

    rewardObj[data[user].user] = data[user].pendingYieldRewards;
    // rewards.push(rewardObj);

    // // temp while debugging
    // i++;
    // if (i > 3) {
    //   break;
    // }
  }

  return [ amountObj, rewardObj ];
}

const main = async () => {

  const [ wildAmounts, wildRewards ] = transform("output/wildStakes.json");
  const [ lpAmounts, lpRewards ] = transform("output/lpStakes.json");

  fs.writeFileSync("output/wildStakesTransformed.json", JSON.stringify(wildAmounts, undefined, 2));
  fs.writeFileSync("output/wildRewardsTransformed.json", JSON.stringify(wildRewards, undefined, 2));

  fs.writeFileSync("output/lpStakesTransformed.json", JSON.stringify(lpAmounts, undefined, 2));
  fs.writeFileSync("output/lpRewardsTransformed.json", JSON.stringify(lpRewards, undefined, 2));
}

main().then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});