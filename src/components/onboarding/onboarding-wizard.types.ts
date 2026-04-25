import type { PayCycle, AccountCategory, SplitType } from "@/db/schema";

export type IncomeInput = {
  name: string;
  amount: string;
  cycle: PayCycle;
  payDay: string;
  payDay2: string;
};

export type AccountInput = {
  _id: string;
  name: string;
  category: AccountCategory;
};

export type SplitInput = {
  accountIndex: number;
  type: SplitType;
  value: string;
};

export type IncomeWithSplits = IncomeInput & { _id: string; splits: SplitInput[] };

export type OnboardingState = {
  country: string;
  currency: string;
  incomes: IncomeWithSplits[];
  accounts: AccountInput[];
};
