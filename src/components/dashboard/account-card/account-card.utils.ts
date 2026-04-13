import { HORIZON_MONTHS, projectBalance } from "@/lib/oracle";
import type { SplitInput } from "@/lib/oracle";
import type {
  AccountCardAccount,
  AccountCardBalanceEntry,
} from "./account-card.types";

export function getCurrentAndPrevious(entries: AccountCardBalanceEntry[]) {
  const current = entries.length > 0 ? Number(entries[entries.length - 1].balance) : 0;
  const previous =
    entries.length > 1 ? Number(entries[entries.length - 2].balance) : null;
  return { current, previous };
}

export function getProjectedBalance(
  account: AccountCardAccount,
  current: number,
  horizon: keyof typeof HORIZON_MONTHS,
  oracleOn: boolean
): number | null {
  if (!oracleOn || !account.oracleEnabled) return null;

  const splits: SplitInput[] = account.splits.map((split) => ({
    type: split.type,
    value: Number(split.value),
    income: {
      amount: Number(split.income.amount),
      cycle: split.income.cycle,
    },
  }));

  const projection = projectBalance(
    current,
    account.annualGrowthRate,
    splits,
    HORIZON_MONTHS[horizon]
  );

  return projection[projection.length - 1]?.balance ?? null;
}
