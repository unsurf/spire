import type { OracleHorizon } from "@/lib/oracle";
import type {
  AccountCategory,
  PayCycle,
  SplitType,
} from "@/db/schema";

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

export type AccountDetailTrade = {
  id: string;
  type: "BUY" | "SELL";
  quantity: string;
  price: string;
  tradedAt: string;
  note: string | null;
};

export type AccountDetailAccount = {
  id: string;
  name: string;
  category: AccountCategory;
  oracleEnabled: boolean;
  annualGrowthRate: number | null;
  coinId: string | null;
  coinSymbol: string | null;
  coinQuantity: string | null;
  balanceEntries: AccountDetailBalanceEntry[];
  splits: AccountDetailSplit[];
  trades: AccountDetailTrade[];
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
