import type {
  DashboardAccount,
  DashboardAccountGroup,
  NetWorthDataPoint,
} from "./dashboard-client.types";

export function getCurrentBalance(account: DashboardAccount): number {
  if (account.balanceEntries.length === 0) return 0;
  return Number(account.balanceEntries[account.balanceEntries.length - 1].balance);
}

export function getGrowthPercent(account: DashboardAccount): number | null {
  const entries = account.balanceEntries;
  if (entries.length < 2) return null;
  const current = Number(entries[entries.length - 1].balance);
  const previous = Number(entries[entries.length - 2].balance);
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function getSparklineData(account: DashboardAccount): number[] {
  return account.balanceEntries.map((e) => Number(e.balance));
}

export function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getAccountGroups(accounts: DashboardAccount[]): DashboardAccountGroup[] {
  const groups: DashboardAccountGroup[] = [
    { key: "accounts", label: "Accounts", accounts: [], total: 0 },
    { key: "investments", label: "Investments", accounts: [], total: 0 },
    { key: "liabilities", label: "Liabilities", accounts: [], total: 0 },
    { key: "loan", label: "Loan", accounts: [], total: 0 },
  ];

  for (const account of accounts) {
    const balance = getCurrentBalance(account);
    const groupKey =
      account.category === "CHEQUE" || account.category === "SAVINGS"
        ? "accounts"
        : account.category === "INVESTMENT" ||
            account.category === "CRYPTO" ||
            account.category === "ASSET" ||
            account.category === "HIGH_GROWTH"
          ? "investments"
          : account.category === "EMERGENCY"
            ? "liabilities"
            : "loan";

    const target = groups.find((group) => group.key === groupKey);
    if (!target) continue;
    target.accounts.push(account);
    target.total += balance;
  }

  return groups;
}

export function buildNetWorthData(accounts: DashboardAccount[]): NetWorthDataPoint[] {
  type FlatEntry = { recordedAt: string; accountId: string; balance: number };
  const flat: FlatEntry[] = [];

  for (const account of accounts) {
    for (const entry of account.balanceEntries) {
      flat.push({
        recordedAt: entry.recordedAt,
        accountId: account.id,
        balance: Number(entry.balance),
      });
    }
  }

  if (flat.length === 0) return [];

  flat.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const runningTotals = new Map<string, number>();
  const points: NetWorthDataPoint[] = [];

  for (const entry of flat) {
    runningTotals.set(entry.accountId, entry.balance);
    const total = [...runningTotals.values()].reduce((sum, v) => sum + v, 0);
    points.push({
      idx: points.length,
      date: new Date(entry.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      }),
      value: total,
    });
  }

  return points;
}
