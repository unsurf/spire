import type { DashboardAccount, DashboardGoal } from "../dashboard-client/dashboard-client.types";

export function getGoalCurrentValue(
  goal: DashboardGoal,
  accounts: DashboardAccount[],
  netWorth: number,
): number {
  if (goal.accountId) {
    const account = accounts.find((a) => a.id === goal.accountId);
    if (!account || account.balanceEntries.length === 0) return 0;
    return Number(account.balanceEntries[account.balanceEntries.length - 1].balance);
  }
  return netWorth;
}

export function getGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
