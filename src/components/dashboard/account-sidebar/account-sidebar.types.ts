import type { DashboardAccount, DashboardAccountGroup, DashboardAccountGroupKey } from "../dashboard-client/dashboard-client.types";

export type AccountSidebarProps = {
  visibleGroups: DashboardAccountGroup[];
  sidebarFilter: "all" | "assets" | "debts";
  onFilterChange: (filter: "all" | "assets" | "debts") => void;
  expandedGroups: Record<DashboardAccountGroupKey, boolean>;
  onToggleGroup: (key: DashboardAccountGroupKey) => void;
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
  onAddAccount: () => void;
  currency: string;
  accounts: DashboardAccount[];
  liveCryptoPrices: Map<string, number>;
};
