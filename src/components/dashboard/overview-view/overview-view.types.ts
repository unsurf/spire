import type { OracleHorizon } from "@/lib/oracle";
import type {
  DashboardAccount,
  NetWorthDataPoint,
  NetWorthChartPoint,
} from "../dashboard-client/dashboard-client.types";

export type OverviewViewProps = {
  accounts: DashboardAccount[];
  currency: string;
  oracleOn: boolean;
  horizon: OracleHorizon;
  onHorizonChange: (h: OracleHorizon) => void;
  netWorth: number;
  netWorthData: NetWorthDataPoint[];
  netWorthDelta: number;
  netWorthChartData: NetWorthChartPoint[];
  showOracle: boolean;
};
