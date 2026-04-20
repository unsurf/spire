import type { AccountCategory, BillCycle, BillCategory, BillSubcategory, PayCycle, SplitType } from "@/generated/prisma/client";

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

export type DashboardTrade = {
  id: string;
  type: "BUY" | "SELL";
  quantity: string;
  price: string;
  tradedAt: string;
  note: string | null;
};

export type DashboardAccount = {
  id: string;
  name: string;
  category: AccountCategory;
  oracleEnabled: boolean;
  annualGrowthRate: number | null;
  coinId: string | null;
  coinSymbol: string | null;
  coinQuantity: string | null;
  balanceEntries: DashboardBalanceEntry[];
  splits: DashboardSplit[];
  trades: DashboardTrade[];
};

export type DashboardBill = {
  id: string;
  name: string;
  amount: string | null;
  cycle: BillCycle;
  category: BillCategory | null;
  subcategory: BillSubcategory | null;
};

export type DashboardGoal = {
  id: string;
  name: string;
  targetAmount: string;
  accountId: string | null;
  deadline: string | null;
  createdAt: string;
};

export type DashboardClientProps = {
  accounts: DashboardAccount[];
  bills: DashboardBill[];
  goals: DashboardGoal[];
  userName: string;
  currency: string;
  initialSelectedId: string | null;
};

export type DashboardAccountGroupKey = "accounts" | "savings" | "investments" | "liabilities" | "loan";

export type DashboardAccountGroup = {
  key: DashboardAccountGroupKey;
  label: "Accounts" | "Savings" | "Investments" | "Liabilities" | "Loan";
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
  isLive?: boolean;
};

export type NetWorthChartPoint = {
  idx: number;
  date: string;
  value?: number;
  actual?: number;
  projected?: number;
};
