import type { BillCycle, PayCycle } from "@/db/schema";
import type { DashboardAccount, DashboardBill } from "@/components/dashboard/dashboard-client/dashboard-client.types";

/** Normalise a bill cycle to a monthly multiplier. */
export function billCycleToMonthly(cycle: BillCycle): number {
  switch (cycle) {
    case "DAILY":
      return 365 / 12;
    case "WEEKLY":
      return 52 / 12;
    case "FORTNIGHTLY":
      return 26 / 12;
    case "MONTHLY":
      return 1;
    case "QUARTERLY":
      return 4 / 12;
    case "ANNUALLY":
      return 1 / 12;
    case "ONE_TIME":
      return 0; // excluded from recurring total
  }
}

/** Normalise a pay cycle to a monthly multiplier (reuses oracle.ts logic). */
export function payCycleToMonthly(cycle: PayCycle): number {
  switch (cycle) {
    case "WEEKLY":
      return 52 / 12;
    case "FORTNIGHTLY":
      return 26 / 12;
    case "TWICE_MONTHLY":
      return 2;
    case "MONTHLY":
      return 1;
    case "QUARTERLY":
      return 4 / 12;
    case "ANNUALLY":
      return 1 / 12;
  }
}

export type MonthlyBillsSummary = {
  total: number;
  variableCount: number;
};

/**
 * Normalise each bill to a monthly equivalent and sum.
 * Bills with null amounts are counted as variable and excluded from the total.
 */
export function calcMonthlyBills(bills: DashboardBill[]): MonthlyBillsSummary {
  let total = 0;
  let variableCount = 0;

  for (const bill of bills) {
    if (bill.amount == null) {
      variableCount++;
      continue;
    }
    const multiplier = billCycleToMonthly(bill.cycle);
    total += parseFloat(bill.amount) * multiplier;
  }

  return { total, variableCount };
}

export type MonthlySavingsSummary = {
  monthlyIncome: number;
  savingsRate: number | null;
};

/**
 * Derive monthly income from account splits (deduplicating by income ID),
 * then compute savings rate as (income - bills) / income.
 * Returns null savingsRate if there is no income data.
 */
export function calcMonthlySavings(
  accounts: DashboardAccount[],
  monthlyBills: number,
): MonthlySavingsSummary {
  const seen = new Map<string, { amount: number; cycle: PayCycle }>();

  for (const account of accounts) {
    for (const split of account.splits) {
      if (!seen.has(split.income.id)) {
        seen.set(split.income.id, {
          amount: parseFloat(split.income.amount),
          cycle: split.income.cycle,
        });
      }
    }
  }

  if (seen.size === 0) return { monthlyIncome: 0, savingsRate: null };

  let monthlyIncome = 0;
  for (const { amount, cycle } of seen.values()) {
    monthlyIncome += amount * payCycleToMonthly(cycle);
  }

  const savingsRate =
    monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyBills) / monthlyIncome) * 100) : null;

  return { monthlyIncome, savingsRate };
}
