import type { OracleHorizon } from "@/lib/oracle";
import type {
  DashboardAccount,
  DashboardBill,
  DashboardGoal,
  NetWorthDataPoint,
  NetWorthChartPoint,
} from "../dashboard-client/dashboard-client.types";

export type OverviewViewProps = {
  accounts: DashboardAccount[];
  bills: DashboardBill[];
  goals: DashboardGoal[];
  currency: string;
  oracleOn: boolean;
  horizon: OracleHorizon;
  onHorizonChange: (h: OracleHorizon) => void;
  netWorth: number;
  netWorthData: NetWorthDataPoint[];
  netWorthDelta: number;
  netWorthChartData: NetWorthChartPoint[];
  showOracle: boolean;
  onAddGoal: () => void;
  onDeleteGoal: (id: string) => void;
};
