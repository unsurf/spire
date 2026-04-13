import type { PayCycle } from "@/generated/prisma/client";

export type PayDayConfig = {
  cycle: PayCycle;
  payDay?: number | null;
  payDay2?: number | null;
  lastPaidAt?: string | Date | null;
};

export const DAY_OF_WEEK_LABELS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

// Returns the next pay date from last paid date + frequency.
export function getNextPayDate(cfg: PayDayConfig): Date | null {
  if (!cfg.lastPaidAt) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const lastPaid = new Date(cfg.lastPaidAt);
  if (Number.isNaN(lastPaid.getTime())) return null;
  lastPaid.setHours(0, 0, 0, 0);

  let next = new Date(lastPaid);

  switch (cfg.cycle) {
    case "WEEKLY":
      while (next < now) next = addDays(next, 7);
      return next;
    case "FORTNIGHTLY":
      while (next < now) next = addDays(next, 14);
      return next;
    case "TWICE_MONTHLY":
      while (next < now) next = addDays(next, 15);
      return next;
    case "MONTHLY":
      while (next < now) next = addMonths(next, 1);
      return next;
    case "QUARTERLY":
      while (next < now) next = addMonths(next, 3);
      return next;
    case "ANNUALLY":
      while (next < now) next = addMonths(next, 12);
      return next;
  }
}

export function formatNextPayDate(cfg: PayDayConfig): string {
  const date = getNextPayDate(cfg);
  if (!date) return "—";

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - now.getTime()) / 86400000);

  const label = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (diffDays === 0) return `Today (${label})`;
  if (diffDays === 1) return `Tomorrow (${label})`;
  if (diffDays <= 7) return `In ${diffDays} days (${label})`;
  return label;
}

export function splitAmount(
  incomeAmount: number,
  splitType: "PERCENTAGE" | "FIXED",
  splitValue: number
): number {
  if (splitType === "PERCENTAGE") return (incomeAmount * splitValue) / 100;
  return splitValue;
}
