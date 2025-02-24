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
  query($first: Int) {
    accounts(
    first: $first,
    where: {totalWildDeposits_gt: 1}
    ) {
      id
      totalStakedWild
      totalWildDeposits
      deposits {
        id
        tokenAmount
        pool {
          id
        }
      }
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
