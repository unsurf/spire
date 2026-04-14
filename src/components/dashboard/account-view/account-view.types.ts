import type { OracleHorizon } from "@/lib/oracle";
import type { CryptoTimeRange } from "@/lib/constants/crypto.constants";
import type { DashboardAccount, ChartDataPoint } from "../dashboard-client/dashboard-client.types";

export type AccountViewProps = {
  selectedAccount: DashboardAccount;
  currency: string;
  oracleOn: boolean;
  accOracleActive: boolean;
  horizon: OracleHorizon;
  onHorizonChange: (h: OracleHorizon) => void;
  chartData: ChartDataPoint[];
  transactionsOpen: boolean;
  onTransactionsToggle: () => void;
  onDeselect: () => void;
  liveValue?: number;
  isCrypto?: boolean;
  cryptoTimeRange?: CryptoTimeRange;
  onCryptoTimeRangeChange?: (range: CryptoTimeRange) => void;
  cryptoChartLoading?: boolean;
};
