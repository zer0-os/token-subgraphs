import * as fs from "fs";
import { AccountAmount } from "./types";

const dedupe = (pathA: string, pathB: string) => {
  const dataA: Array<AccountAmount> = JSON.parse(fs.readFileSync(pathA, "utf8"));
  const dataB: Array<AccountAmount> = JSON.parse(fs.readFileSync(pathB, "utf8"));

  // Amount staked
  // Pending yield rewards
  const duplicateStakers: Array<string> = [];

  console.log("Comparing", dataA.length, "wild stakers to", dataB.length, "lp stakers");

  for (let i = 0; i < dataA.length; i++) {
    for (let j = 0; j < dataB.length; j++) {
      if (dataA[i].user === dataB[j].user) {
        duplicateStakers.push(dataA[i].user);
      }
    }
  }

  return duplicateStakers;
}

const main = async () => {
  const duplicates = dedupe("output/wildStakes.json", "output/lpStakes.json");

  console.log(duplicates.length, "duplicates found");
  // fs.writeFileSync("output/duplicates.json", JSON.stringify(duplicates, undefined, 2));
}

main().then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});