import type { PayCycle, AccountCategory, SplitType } from "@/generated/prisma/client";

export type IncomeInput = {
  name: string;
  amount: string;
  cycle: PayCycle;
  payDay: string;
  payDay2: string;
};

export type AccountInput = {
  name: string;
  category: AccountCategory;
};

export type SplitInput = {
  accountIndex: number;
  type: SplitType;
  value: string;
};

export type IncomeWithSplits = IncomeInput & { splits: SplitInput[] };

export type OnboardingState = {
  country: string;
  currency: string;
  incomes: IncomeWithSplits[];
  accounts: AccountInput[];
};
