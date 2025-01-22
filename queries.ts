import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

export const approvalsQuery = `
  query($first: Int, $lastId: String) {
    approvals(
      first: $first,
      where: {
        id_gt: $lastId
      }
    ) {
      id
      owner
      spender
      value
    }
  }
`