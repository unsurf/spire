import type { BillItem } from "../bills-client/bills-client.types";
import type { BillCategory, BillSubcategory } from "@/generated/prisma/client";
import { getBillDaysInMonth } from "../bills-client/bills-client.utils";

export type CategorySummary = {
  category: BillCategory | null;
  total: number;
  subcategories: SubcategorySummary[];
  uncategorised: BillItem[];
};

export type SubcategorySummary = {
  subcategory: BillSubcategory;
  total: number;
  bills: BillItem[];
};

export type OverviewMonthData = {
  total: number;
  categories: CategorySummary[];
  uncategorised: BillItem[];
};

export function buildOverviewData(
  bills: BillItem[],
  year: number,
  month: number,
): OverviewMonthData {
  // Only include bills that occur this month
  const active = bills.filter((b) => getBillDaysInMonth(b, year, month).length > 0);

  function billMonthTotal(bill: BillItem): number {
    if (!bill.amount) return 0;
    return getBillDaysInMonth(bill, year, month).length * parseFloat(bill.amount);
  }

  const categorised = active.filter((b) => b.category !== null);
  const uncategorised = active.filter((b) => b.category === null);

  // Group by category
  const categoryMap = new Map<BillCategory, BillItem[]>();
  for (const bill of categorised) {
    const cat = bill.category!;
    const list = categoryMap.get(cat) ?? [];
    list.push(bill);
    categoryMap.set(cat, list);
  }

  const categories: CategorySummary[] = Array.from(categoryMap.entries()).map(
    ([category, catBills]) => {
      // Group by subcategory within category
      const subMap = new Map<BillSubcategory, BillItem[]>();
      const catUncategorised: BillItem[] = [];

      for (const bill of catBills) {
        if (bill.subcategory) {
          const sub = bill.subcategory;
          const list = subMap.get(sub) ?? [];
          list.push(bill);
          subMap.set(sub, list);
        } else {
          catUncategorised.push(bill);
        }
      }

      const subcategories: SubcategorySummary[] = Array.from(subMap.entries()).map(
        ([subcategory, subBills]) => ({
          subcategory,
          total: subBills.reduce((sum, b) => sum + billMonthTotal(b), 0),
          bills: subBills,
        }),
      );

      return {
        category,
        total: catBills.reduce((sum, b) => sum + billMonthTotal(b), 0),
        subcategories,
        uncategorised: catUncategorised,
      };
    },
  );

  const total = active.reduce((sum, b) => sum + billMonthTotal(b), 0);

  return { total, categories, uncategorised };
}
