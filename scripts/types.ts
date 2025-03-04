export interface AccountAmount {
  user : string;
  amountStaked : string;
  pendingYieldRewards : string;
}

export interface UserStake {
  amount : bigint;
  yieldAmount : bigint;
}

export interface ResultAmounts {
  wildAmountsArr : Array<AccountAmount>;
  lpAmountsArr : Array<AccountAmount>;
  totalWildStaked : bigint;
  totalWildYield : bigint;
  totalWildPendingRewards : bigint;
  totalLPStaked : bigint;
  totalWildLPYield : bigint;
  totalLPPendingRewards : bigint;
}