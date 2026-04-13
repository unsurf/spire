import type { PayCycle, SplitType } from "@/generated/prisma/client";

export type OracleHorizon = "6m" | "1y" | "2y" | "3y";

export const HORIZON_MONTHS: Record<OracleHorizon, number> = {
  "6m": 6,
  "1y": 12,
  "2y": 24,
  "3y": 36,
};

function payEventsPerMonth(cycle: PayCycle): number {
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
    default:
      return 1;
  }
}

export type SplitInput = {
  type: SplitType;
  value: number;
  income: {
    amount: number;
    cycle: PayCycle;
  };
};

export type OracleDataPoint = {
  date: string; // ISO month string e.g. "2025-07"
  balance: number;
};

export function projectBalance(
  currentBalance: number,
  annualGrowthRate: number | null,
  splits: SplitInput[],
  months: number
): OracleDataPoint[] {
  const monthlyGrowthRate =
    annualGrowthRate != null
      ? Math.pow(1 + annualGrowthRate / 100, 1 / 12) - 1
      : 0;

  // Monthly contribution from all splits
  const monthlyContribution = splits.reduce((total, split) => {
    const eventsPerMonth = payEventsPerMonth(split.income.cycle);
    const perEvent =
      split.type === "PERCENTAGE"
        ? split.income.amount * (split.value / 100)
        : split.value;
    return total + perEvent * eventsPerMonth;
  }, 0);

  const points: OracleDataPoint[] = [];
  let balance = currentBalance;
  const now = new Date();

  for (let i = 1; i <= months; i++) {
    balance = balance * (1 + monthlyGrowthRate) + monthlyContribution;
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    points.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      balance: Math.round(balance * 100) / 100,
    });
  }

  return points;
}
