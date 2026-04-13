import type { IncomeSplit } from "./income-client.types";

export function parseNumericInput(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateRemainingAllocation(
  incomeAmount: number,
  splits: IncomeSplit[]
): number {
  const allocatedPct = splits
    .filter((split) => split.type === "PERCENTAGE")
    .reduce((sum, split) => sum + Number(split.value), 0);
  const allocatedFixed = splits
    .filter((split) => split.type === "FIXED")
    .reduce((sum, split) => sum + Number(split.value), 0);

  return incomeAmount - allocatedFixed - (incomeAmount * allocatedPct) / 100;
}
