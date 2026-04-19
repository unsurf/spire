import type { DashboardAccount, DashboardAccountGroupKey } from "../dashboard-client/dashboard-client.types";

export type AccountBalancesChartProps = {
  accounts: DashboardAccount[];
  currency: string;
};

export type AccountBalanceBar = {
  id: string;
  name: string;
  value: number;
  groupKey: DashboardAccountGroupKey;
};
