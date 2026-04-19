import type { NetWorthDataPoint } from "../dashboard-client/dashboard-client.types";

export type NetWorthDeltaChartProps = {
  netWorthData: NetWorthDataPoint[];
  currency: string;
};

export type MonthlyDeltaPoint = {
  month: string;
  delta: number;
};
