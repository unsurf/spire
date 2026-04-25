import type { BillCycle } from "@/db/schema";

export const BILL_CYCLE_VALUES = [
  "DAILY",
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY",
  "ONE_TIME",
] as const satisfies readonly BillCycle[];

export const BILL_CYCLE_LABELS: Record<BillCycle, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
  ONE_TIME: "One-time",
};

export const BILL_CYCLE_ENTRIES: [BillCycle, string][] = Object.entries(
  BILL_CYCLE_LABELS,
) as [BillCycle, string][];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
