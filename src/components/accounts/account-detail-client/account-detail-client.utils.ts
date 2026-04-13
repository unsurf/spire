import type {
  AccountDelta,
  AccountDetailAccount,
  ChartDataPoint,
} from "./account-detail-client.types";

export function getAccountDelta(account: AccountDetailAccount): AccountDelta {
  const entries = account.balanceEntries;
  const currentBalance =
    entries.length > 0 ? Number(entries[entries.length - 1].balance) : 0;
  const previousBalance =
    entries.length > 1 ? Number(entries[entries.length - 2].balance) : null;
  const delta =
    previousBalance !== null ? currentBalance - previousBalance : null;

  return { currentBalance, previousBalance, delta };
}

export function buildHistoryData(
  account: AccountDetailAccount
): ChartDataPoint[] {
  return account.balanceEntries.map((entry, idx) => ({
    idx,
    date: new Date(entry.recordedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    }),
    value: Number(entry.balance),
  }));
}
