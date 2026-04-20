import type { GroupHistorySeries } from "./group-history-chart.types";

export const GROUP_HISTORY_SERIES: GroupHistorySeries[] = [
  {
    key: "accounts",
    label: "Accounts",
    color: "var(--data-1)",
    gradientId: "groupHistGradAccounts",
  },
  {
    key: "savings",
    label: "Savings",
    color: "var(--data-3)",
    gradientId: "groupHistGradSavings",
  },
  {
    key: "investments",
    label: "Investments",
    color: "var(--data-2)",
    gradientId: "groupHistGradInvestments",
  },
  {
    key: "liabilities",
    label: "Emergency",
    color: "var(--data-5)",
    gradientId: "groupHistGradLiabilities",
  },
  {
    key: "loan",
    label: "Loans",
    color: "var(--data-4)",
    gradientId: "groupHistGradLoan",
  },
];
