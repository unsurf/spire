import type { GroupHistorySeries } from "./group-history-chart.types";

export const GROUP_HISTORY_SERIES: GroupHistorySeries[] = [
  {
    key: "accounts",
    label: "Accounts",
    color: "var(--accent)",
    gradientId: "groupHistGradAccounts",
  },
  {
    key: "savings",
    label: "Savings",
    color: "var(--accent-strong)",
    gradientId: "groupHistGradSavings",
  },
  {
    key: "investments",
    label: "Investments",
    color: "var(--positive)",
    gradientId: "groupHistGradInvestments",
  },
  {
    key: "liabilities",
    label: "Emergency",
    color: "var(--muted)",
    gradientId: "groupHistGradLiabilities",
  },
  {
    key: "loan",
    label: "Loans",
    color: "var(--error)",
    gradientId: "groupHistGradLoan",
  },
];
