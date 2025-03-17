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
`;

export const accountInfoQuery = `
  query($first: Int, $skip: Int) {
    accounts(
      first: $first,
      skip: $skip
    ) {
      id
    }
  }
`;

export const depositsQuery = `
  query($first: Int) {
    deposits(first: $first) {
      id
      by {
        id
      }
    }
  }
`;
