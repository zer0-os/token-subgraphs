// import { getLogger, getMongoAdapter, TLogger } from "@zero-tech/zdc";

import { MongoClient, ServerApiVersion } from "mongodb"



// export const getZModulesLogger = ({
//   logLevel = process.env.LOG_LEVEL || "debug",
//   makeLogFile = process.env.MAKE_LOG_FILE === "true",
//   silence = process.env.SILENT_LOGGER === "true",
// } : {
//   logLevel ?: string;
//   makeLogFile ?: boolean;
//   silence ?: boolean;
// } = {}) => getLogger({
//   logLevel,
//   makeLogFile,
//   silence,
// });

/**
 * 
 *{
  contractsVersion,
  logger,
  dbUri = process.env.MONGO_DB_URI,
  dbName = process.env.MONGO_DB_NAME,
  dbVersion = process.env.MONGO_DB_VERSION,
  archiveDb = process.env.ARCHIVE_PREVIOUS_DB_VERSION === "true",
  clientOpts,
} : {
  contractsVersion ?: string;
  logger ?: TLogger;
  dbUri ?: string;
  dbName ?: string;
  dbVersion ?: string;
  archiveDb ?: boolean;
  clientOpts ?: Record<string, unknown>;
} = {}
 */

interface MongoAdapterArgs {
  dbUri ?: string,
  dbName ?: string,
  dbVersion ?: string,
  archiveDb ?: boolean,
}


export const getMongoAdapter = async (
  dbUri : string | undefined = process.env.MONGO_DB_URI,
  dbName : string | undefined = process.env.MONGO_DB_NAME
) => {

  if (!dbUri) {
    throw Error("No connection URI found");
  }

  const client = new MongoClient(dbUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  return await client.connect();
};

// const stakersColl = await client.db("staking-migration").collection("stakers").insertOne({
//   staker: "0x123",
//   amount: "10000000000000000000000"
// });

// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://<db_username>:<db_password>@zns-deployment-developm.nwwnjwg.mongodb.net/?retryWrites=true&w=majority&appName=zns-deployment-development";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);


// const main = async () => {
//   const client = await getMongoAdapter();
// }


// main().then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });