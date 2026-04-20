import type { DashboardAccountGroupKey } from "../dashboard-client/dashboard-client.types";

export const ACCOUNT_BAR_COLORS: Record<DashboardAccountGroupKey, string> = {
  accounts:    "var(--data-1)", // sky
  savings:     "var(--data-3)", // teal
  investments: "var(--data-2)", // amber
  liabilities: "var(--data-5)", // indigo
  loan:        "var(--data-4)", // pink
};
