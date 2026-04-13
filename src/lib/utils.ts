import type { AccountCategory, PayCycle } from "@/generated/prisma/client";

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  CHEQUE: "Cheque",
  SAVINGS: "Savings",
  HIGH_GROWTH: "High Growth",
  EMERGENCY: "Emergency Fund",
  INVESTMENT: "Investment",
  CRYPTO: "Crypto",
  ASSET: "Asset",
  OTHER: "Other",
};

export const ACCOUNT_CATEGORY_ENTRIES: [AccountCategory, string][] = Object.entries(ACCOUNT_CATEGORY_LABELS) as [AccountCategory, string][];

export const ASSET_CATEGORIES: AccountCategory[] = [
  "INVESTMENT",
  "CRYPTO",
  "ASSET",
];

export function isAssetCategory(category: AccountCategory): boolean {
  return ASSET_CATEGORIES.includes(category);
}

export const PAY_CYCLE_LABELS: Record<PayCycle, string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  TWICE_MONTHLY: "Twice Monthly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
};

// Object.entries widens keys to string[]; this cast is safe because PAY_CYCLE_LABELS
// is typed Record<PayCycle, string> — define it once here so callers stay cast-free.
export const PAY_CYCLE_ENTRIES: [PayCycle, string][] = Object.entries(PAY_CYCLE_LABELS) as [PayCycle, string][];

// Derive valid-value sets from the labels maps — no Prisma runtime import needed.
const ACCOUNT_CATEGORIES = new Set<string>(Object.keys(ACCOUNT_CATEGORY_LABELS));
const PAY_CYCLES_SET = new Set<string>(Object.keys(PAY_CYCLE_LABELS));

export function isAccountCategory(value: string): value is AccountCategory {
  return ACCOUNT_CATEGORIES.has(value);
}

export function isPayCycle(value: string): value is PayCycle {
  return PAY_CYCLES_SET.has(value);
}

export const CATEGORY_COLORS: Record<AccountCategory, string> = {
  CHEQUE: "bg-blue-900/30 text-blue-300",
  SAVINGS: "bg-accent-soft text-accent",
  HIGH_GROWTH: "bg-accent-soft text-accent",
  EMERGENCY: "bg-amber-900/30 text-amber-300",
  INVESTMENT: "bg-indigo-900/30 text-indigo-300",
  CRYPTO: "bg-orange-900/30 text-orange-300",
  ASSET: "bg-rose-900/30 text-rose-300",
  OTHER: "bg-neutral-800 text-neutral-400",
};
