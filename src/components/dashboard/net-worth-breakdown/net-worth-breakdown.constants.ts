import type { DashboardAccountGroupKey } from "../dashboard-client/dashboard-client.types";

export const BREAKDOWN_COLORS: Record<DashboardAccountGroupKey, string> = {
  accounts: "var(--accent)",
  savings: "var(--accent-strong)",
  investments: "var(--positive)",
  liabilities: "var(--muted)",
  loan: "var(--error)",
};

export const BREAKDOWN_LABELS: Record<DashboardAccountGroupKey, string> = {
  accounts: "Accounts",
  savings: "Savings",
  investments: "Investments",
  liabilities: "Emergency",
  loan: "Loans",
};
