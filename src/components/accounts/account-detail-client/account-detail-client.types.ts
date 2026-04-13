import type { OracleHorizon } from "@/lib/oracle";
import type {
  AccountCategory,
  PayCycle,
  SplitType,
} from "@/generated/prisma/client";

export type AccountDetailBalanceEntry = {
  id: string;
  balance: string;
  note: string | null;
  recordedAt: string;
};

export type AccountDetailSplit = {
  id: string;
  type: SplitType;
  value: string;
  income: { id: string; name: string; amount: string; cycle: PayCycle };
};

export type AccountDetailAccount = {
  id: string;
  name: string;
  category: AccountCategory;
  oracleEnabled: boolean;
  annualGrowthRate: number | null;
  balanceEntries: AccountDetailBalanceEntry[];
  splits: AccountDetailSplit[];
};

export type AccountDetailClientProps = {
  account: AccountDetailAccount;
  currency: string;
};

export type ChartDataPoint = { idx: number; date: string; value: number };

export type AccountDelta = {
  currentBalance: number;
  previousBalance: number | null;
  delta: number | null;
};

export type HorizonOption = OracleHorizon;
