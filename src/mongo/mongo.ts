import { MongoClient, ServerApiVersion } from "mongodb"


export const getMongoAdapter = async (
  dbUri : string | undefined = process.env.MONGO_DB_URI,
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
