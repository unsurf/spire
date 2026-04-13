import type { OracleHorizon } from "@/lib/oracle";
import type {
  AccountCategory,
  PayCycle,
  SplitType,
} from "@/generated/prisma/client";

export type AccountCardBalanceEntry = {
  id: string;
  balance: string;
  recordedAt: string;
};

export type AccountCardSplit = {
  id: string;
  type: SplitType;
  value: string;
  income: {
    id: string;
    amount: string;
    cycle: PayCycle;
  };
};

export type AccountCardAccount = {
  id: string;
  name: string;
  category: AccountCategory;
  oracleEnabled: boolean;
  annualGrowthRate: number | null;
  balanceEntries: AccountCardBalanceEntry[];
  splits: AccountCardSplit[];
};

export type AccountCardProps = {
  account: AccountCardAccount;
  currency: string;
  oracleOn: boolean;
  horizon: OracleHorizon;
};
