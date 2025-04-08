export interface AccountAmount {
  user : string;
  amountStakedWILD : string;
  amountStakedWILDYield : string;
  amountStakedLP : string;
  pendingYieldRewardsWILD : string;
  pendingYieldRewardsLP : string;
}

export interface UserStake {
  amount : bigint;
  yieldAmount : bigint;
}

export interface Totals {
  totalWildStaked : bigint;
  totalWildYield : bigint;
  totalWildPendingRewards : bigint;
  totalLPStaked : bigint;
  totalLPYield : bigint;
  totalLPPendingRewards : bigint;
}

export type MerkleData = [string, string, string];
