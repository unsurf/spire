import type { BillCategory, BillSubcategory } from "@/generated/prisma/client";

export const BILL_CATEGORY_LABELS: Record<BillCategory, string> = {
  LIVING_EXPENSES: "Living Expenses",
  SUBSCRIPTIONS: "Subscriptions",
};

export const BILL_SUBCATEGORY_LABELS: Record<BillSubcategory, string> = {
  RENT: "Rent",
  ELECTRICITY: "Electricity",
  WATER: "Water",
  GAS: "Gas",
  INTERNET: "Internet",
  GROCERIES: "Groceries",
  HOME_INSURANCE: "Home Insurance",
  PHONE: "Phone",
  COUNCIL_RATES: "Council Rates",
  SOCIAL: "Social Media",
  STREAMING: "Streaming",
  DATA_STORAGE: "Data Storage",
  TOOLS: "Tools",
  AI: "AI",
  SHOPPING_DELIVERY: "Shopping & Delivery",
  OTHER: "Other",
};

export const SUBCATEGORIES_BY_CATEGORY: Record<BillCategory, BillSubcategory[]> = {
  LIVING_EXPENSES: [
    "RENT",
    "ELECTRICITY",
    "WATER",
    "GAS",
    "INTERNET",
    "GROCERIES",
    "HOME_INSURANCE",
    "PHONE",
    "COUNCIL_RATES",
    "OTHER",
  ],
  SUBSCRIPTIONS: ["SOCIAL", "STREAMING", "DATA_STORAGE", "TOOLS", "AI", "SHOPPING_DELIVERY", "OTHER"],
};

export const BILL_CATEGORY_VALUES = ["LIVING_EXPENSES", "SUBSCRIPTIONS"] as const satisfies readonly BillCategory[];

export const BILL_SUBCATEGORY_VALUES = [
  "RENT",
  "ELECTRICITY",
  "WATER",
  "GAS",
  "INTERNET",
  "GROCERIES",
  "HOME_INSURANCE",
  "PHONE",
  "COUNCIL_RATES",
  "SOCIAL",
  "STREAMING",
  "DATA_STORAGE",
  "TOOLS",
  "AI",
  "SHOPPING_DELIVERY",
  "OTHER",
] as const satisfies readonly BillSubcategory[];
