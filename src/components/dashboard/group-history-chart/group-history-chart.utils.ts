import type { DashboardAccount } from "../dashboard-client/dashboard-client.types";
import type { GroupHistoryPoint } from "./group-history-chart.types";

type GroupKey = "accounts" | "savings" | "investments" | "liabilities" | "loan";

function getGroupKey(account: DashboardAccount): GroupKey {
  if (account.category === "CHEQUE") return "accounts";
  if (account.category === "SAVINGS" || account.category === "HIGH_GROWTH") return "savings";
  if (
    account.category === "INVESTMENT" ||
    account.category === "CRYPTO" ||
    account.category === "ASSET"
  )
    return "investments";
  if (account.category === "EMERGENCY") return "liabilities";
  return "loan";
}

export function buildGroupHistoryData(accounts: DashboardAccount[]): GroupHistoryPoint[] {
  type FlatEntry = { recordedAt: string; accountId: string; balance: number; group: GroupKey };
  const flat: FlatEntry[] = [];

  for (const account of accounts) {
    const group = getGroupKey(account);
    for (const entry of account.balanceEntries) {
      flat.push({
        recordedAt: entry.recordedAt,
        accountId: account.id,
        balance: Number(entry.balance),
        group,
      });
    }
  }

  if (flat.length === 0) return [];

  flat.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const runningByAccount = new Map<string, { balance: number; group: GroupKey }>();
  const points: GroupHistoryPoint[] = [];

  for (const entry of flat) {
    runningByAccount.set(entry.accountId, { balance: entry.balance, group: entry.group });

    const groupTotals: Record<GroupKey, number> = {
      accounts: 0,
      savings: 0,
      investments: 0,
      liabilities: 0,
      loan: 0,
    };
    for (const { balance, group } of runningByAccount.values()) {
      groupTotals[group] += balance;
    }

    const round = (v: number) => Math.round(v * 100) / 100;
    points.push({
      idx: points.length,
      date: new Date(entry.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      }),
      accounts: groupTotals.accounts > 0 ? round(groupTotals.accounts) : undefined,
      savings: groupTotals.savings > 0 ? round(groupTotals.savings) : undefined,
      investments: groupTotals.investments > 0 ? round(groupTotals.investments) : undefined,
      liabilities: groupTotals.liabilities > 0 ? round(groupTotals.liabilities) : undefined,
      loan: groupTotals.loan > 0 ? round(groupTotals.loan) : undefined,
    });
  }

  return points;
}

export function getActiveGroupKeys(
  data: GroupHistoryPoint[],
): Array<keyof Omit<GroupHistoryPoint, "idx" | "date">> {
  const keys: Array<keyof Omit<GroupHistoryPoint, "idx" | "date">> = [
    "accounts",
    "savings",
    "investments",
    "liabilities",
    "loan",
  ];
  return keys.filter((key) => data.some((pt) => pt[key] != null));
}

export function isGroupHistoryPoint(val: unknown): val is GroupHistoryPoint {
  return (
    typeof val === "object" &&
    val !== null &&
    "idx" in val &&
    "date" in val
  );
}
