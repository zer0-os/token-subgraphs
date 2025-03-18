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
