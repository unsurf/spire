import type {
  DashboardAccount,
  DashboardAccountGroupKey,
} from "../dashboard-client/dashboard-client.types";

export type NetWorthBreakdownProps = {
  accounts: DashboardAccount[];
  currency: string;
};

export type BreakdownSegment = {
  key: DashboardAccountGroupKey;
  label: string;
  value: number;
  percentage: number;
};
