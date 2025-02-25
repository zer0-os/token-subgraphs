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

export const accountInfoQuery = `
  query($first: Int, $lastId: String) {
    accounts(
      first: $first,
      where: {id_gt: $lastId},
      orderBy: id,
      orderDirection: asc
    ) {
      id
    }
  }
`

export const depositsQuery = `
  query($first: Int) {
    deposits(first: $first) {
      id
      by {
        id
      }
    }
  }
`
