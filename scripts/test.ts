import { getMongoAdapter } from "../src/mongo/mongo";

const main = async () => {
  const client = await getMongoAdapter();

  await client.db("staking-migration").collection("stakers").insertOne({
    staker: "0x456",
    amount: "10000000000000000000000",
  });
};

main().then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });