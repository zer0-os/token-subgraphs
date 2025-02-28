export interface ApprovalsQueryArgs extends BaseArgs {
  lastId: string;
}

export interface BaseArgs {
  first: number;
  skip: number;
}