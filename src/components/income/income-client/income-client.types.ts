import type {
  AccountCategory,
  PayCycle,
  SplitType,
} from "@/db/schema";

export type IncomeSplit = {
  id: string;
  type: SplitType;
  value: string;
  account: { id: string; name: string; category: AccountCategory };
};

export type IncomeItem = {
  id: string;
  name: string;
  amount: string;
  cycle: PayCycle;
  lastPaidAt: string | null;
  splits: IncomeSplit[];
};

export type IncomeAccount = {
  id: string;
  name: string;
  category: AccountCategory;
};

export type IncomeClientProps = {
  incomes: IncomeItem[];
  accounts: IncomeAccount[];
  currency: string;
};
