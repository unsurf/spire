import type { DashboardAccountGroupKey } from "../dashboard-client/dashboard-client.types";

export const ACCOUNT_BAR_COLORS: Record<DashboardAccountGroupKey, string> = {
  accounts: "var(--accent)",
  savings: "var(--accent-strong)",
  investments: "var(--positive)",
  liabilities: "var(--muted)",
  loan: "var(--error)",
};
