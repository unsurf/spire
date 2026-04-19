import type { DashboardAccount, DashboardAccountGroupKey } from "../dashboard-client/dashboard-client.types";
import { getCurrentBalance } from "../dashboard-client/dashboard-client.utils";
import type { AccountBalanceBar } from "./account-balances-chart.types";

function getGroupKey(account: DashboardAccount): DashboardAccountGroupKey {
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

export function buildAccountBalanceBars(accounts: DashboardAccount[]): AccountBalanceBar[] {
  return accounts
    .map((account) => ({
      id: account.id,
      name: account.name,
      value: Math.abs(getCurrentBalance(account)),
      groupKey: getGroupKey(account),
    }))
    .filter((bar) => bar.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export function isAccountBalanceBar(val: unknown): val is AccountBalanceBar {
  return (
    typeof val === "object" &&
    val !== null &&
    "id" in val &&
    "name" in val &&
    "value" in val &&
    "groupKey" in val
  );
}
