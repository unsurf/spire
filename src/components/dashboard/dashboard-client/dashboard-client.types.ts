import type {
  AccountCategory,
  PayCycle,
  SplitType,
} from "@/generated/prisma/client";

export type DashboardBalanceEntry = {
  id: string;
  balance: string;
  recordedAt: string;
  note: string | null;
};

export type DashboardSplit = {
  id: string;
  type: SplitType;
  value: string;
  income: {
    id: string;
    amount: string;
    cycle: PayCycle;
  };
};

export type DashboardAccount = {
  id: string;
  name: string;
  category: AccountCategory;
  oracleEnabled: boolean;
  annualGrowthRate: number | null;
  balanceEntries: DashboardBalanceEntry[];
  splits: DashboardSplit[];
};

export type DashboardClientProps = {
  accounts: DashboardAccount[];
  userName: string;
  currency: string;
  initialSelectedId: string | null;
};

export type DashboardAccountGroupKey =
  | "accounts"
  | "investments"
  | "liabilities"
  | "loan";

export type DashboardAccountGroup = {
  key: DashboardAccountGroupKey;
  label: "Accounts" | "Investments" | "Liabilities" | "Loan";
  accounts: DashboardAccount[];
  total: number;
};

export type NetWorthDataPoint = {
  idx: number;
  date: string;
  value: number;
};

export type ChartDataPoint = {
  idx: number;
  date: string;
  value?: number;
  proj?: number;
};
