import type { AccountCategory, PayCycle, SplitType } from "@/db/schema";
import type { OracleHorizon } from "@/lib/oracle";

export type OraclePanelBalanceEntry = {
  balance: string;
  recordedAt: string;
};

export type OraclePanelSplit = {
  type: SplitType;
  value: string;
  income: { amount: string; cycle: PayCycle };
};

export type OraclePanelAccount = {
  id: string;
  name: string;
  category: AccountCategory;
  oracleEnabled: boolean;
  annualGrowthRate: number | null;
  balanceEntries: OraclePanelBalanceEntry[];
  splits: OraclePanelSplit[];
};

export type OraclePanelProps = {
  accounts: OraclePanelAccount[];
  horizon: OracleHorizon;
  onHorizonChange: (h: OracleHorizon) => void;
  currency: string;
};
