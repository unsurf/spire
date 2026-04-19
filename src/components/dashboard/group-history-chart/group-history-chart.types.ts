import type { DashboardAccount } from "../dashboard-client/dashboard-client.types";

export type GroupHistoryChartProps = {
  accounts: DashboardAccount[];
  currency: string;
};

export type GroupHistoryPoint = {
  idx: number;
  date: string;
  accounts?: number;
  savings?: number;
  investments?: number;
  liabilities?: number;
  loan?: number;
};

export type GroupHistorySeries = {
  key: keyof Omit<GroupHistoryPoint, "idx" | "date">;
  label: string;
  color: string;
  gradientId: string;
};
