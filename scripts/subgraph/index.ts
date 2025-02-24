import { ApolloClient, InMemoryCache, NormalizedCacheObject, gql} from '@apollo/client'
import { ApprovalsQueryArgs, BaseArgs } from './types';

export const createClient = (apiUrl: string) => {
  if (!apiUrl) {
    throw new Error('API URL is required for subgraph');
  }

  const client = new ApolloClient({
    uri: apiUrl,
    cache: new InMemoryCache(),
  })

  return client;
}



export const sendQuery = async <T extends Object>(
  client: ApolloClient<NormalizedCacheObject>,
  query: string,
  args: T
) => {
  const response = await client.query({
    query: gql(query),
    variables: args
  })

  return response;
}