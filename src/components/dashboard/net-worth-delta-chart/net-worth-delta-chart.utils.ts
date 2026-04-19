import type { NetWorthDataPoint } from "../dashboard-client/dashboard-client.types";
import type { MonthlyDeltaPoint } from "./net-worth-delta-chart.types";

function getMonthKey(date: string): string {
  // date format: "Jan 1, 25" → key "Jan '25"
  const parts = date.split(" ");
  return `${parts[0]} '${parts[parts.length - 1]}`;
}

export function buildMonthlyDeltas(data: NetWorthDataPoint[]): MonthlyDeltaPoint[] {
  if (data.length < 2) return [];

  // Keep last value per month
  const byMonth = new Map<string, number>();
  for (const point of data) {
    byMonth.set(getMonthKey(point.date), point.value);
  }

  const entries = [...byMonth.entries()];
  const deltas: MonthlyDeltaPoint[] = [];
  for (let i = 1; i < entries.length; i++) {
    deltas.push({
      month: entries[i][0],
      delta: entries[i][1] - entries[i - 1][1],
    });
  }

  // Cap at last 12 months to avoid clutter
  return deltas.slice(-12);
}

export function isMonthlyDeltaPoint(val: unknown): val is MonthlyDeltaPoint {
  return (
    typeof val === "object" &&
    val !== null &&
    "month" in val &&
    "delta" in val
  );
}
