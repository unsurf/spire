import type { DashboardAccount, DashboardBill } from "../dashboard-client/dashboard-client.types";

export type MonthlySnapshotProps = {
  accounts: DashboardAccount[];
  bills: DashboardBill[];
  currency: string;
};
