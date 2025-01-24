import { ApolloClient, InMemoryCache, NormalizedCacheObject, gql} from '@apollo/client'
import { ApprovalsQueryArgs } from './types';

export const API_URL = process.env.GRAPH_URL;

export const createClient = (apiUrl?: string) => {
  const url = apiUrl ?? process.env.GRAPH_URL

  if (!url) {
    throw new Error('API URL is required for subgraph');
  }

  const client = new ApolloClient({
    uri: url,
    cache: new InMemoryCache(),
  })

  return client;
}

export const sendQuery = async (
  client: ApolloClient<NormalizedCacheObject>,
  query: string,
  args: ApprovalsQueryArgs
) => {
  const response = await client.query({
    query: gql(query),
    variables: args
  })

  return response;
}