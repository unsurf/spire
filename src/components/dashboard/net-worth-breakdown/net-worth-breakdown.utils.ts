import type {
  DashboardAccount,
  DashboardAccountGroupKey,
} from "../dashboard-client/dashboard-client.types";
import { getCurrentBalance } from "../dashboard-client/dashboard-client.utils";
import { BREAKDOWN_LABELS } from "./net-worth-breakdown.constants";
import type { BreakdownSegment } from "./net-worth-breakdown.types";

function categoriseAccount(account: DashboardAccount): DashboardAccountGroupKey {
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

export function buildBreakdownSegments(accounts: DashboardAccount[]): BreakdownSegment[] {
  const totals: Record<DashboardAccountGroupKey, number> = {
    accounts: 0,
    savings: 0,
    investments: 0,
    liabilities: 0,
    loan: 0,
  };

  for (const account of accounts) {
    totals[categoriseAccount(account)] += getCurrentBalance(account);
  }

  const total = (Object.values(totals) as number[]).reduce((sum, v) => sum + Math.abs(v), 0);
  if (total === 0) return [];

  return (Object.entries(totals) as [DashboardAccountGroupKey, number][])
    .filter(([, value]) => Math.abs(value) > 0)
    .map(([key, value]) => ({
      key,
      label: BREAKDOWN_LABELS[key],
      value: Math.abs(value),
      percentage: (Math.abs(value) / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export function isBreakdownSegment(val: unknown): val is BreakdownSegment {
  return (
    typeof val === "object" &&
    val !== null &&
    "key" in val &&
    "label" in val &&
    "value" in val &&
    "percentage" in val
  );
}
