import type { BillItem } from "./bills-client.types";
import type { BillCycle } from "@/db/schema";

export type BillOccurrence = { bill: BillItem; day: number };

function advanceByCycle(date: Date, cycle: BillCycle): Date {
  const d = new Date(date);
  switch (cycle) {
    case "DAILY":       d.setDate(d.getDate() + 1);         break;
    case "WEEKLY":      d.setDate(d.getDate() + 7);         break;
    case "FORTNIGHTLY": d.setDate(d.getDate() + 14);        break;
    case "MONTHLY":     d.setMonth(d.getMonth() + 1);       break;
    case "QUARTERLY":   d.setMonth(d.getMonth() + 3);       break;
    case "ANNUALLY":    d.setFullYear(d.getFullYear() + 1); break;
    case "ONE_TIME":    break;
  }
  return d;
}

export function getBillDaysInMonth(bill: BillItem, year: number, month: number): number[] {
  const start = new Date(bill.startDate);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  if (start > monthEnd) return [];

  if (bill.cycle === "ONE_TIME") {
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (startDay >= monthStart && startDay <= monthEnd) return [start.getDate()];
    return [];
  }

  const days: number[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  // Advance cursor until it reaches or passes the month start
  while (cursor < monthStart) {
    const next = advanceByCycle(cursor, bill.cycle);
    if (next.getTime() === cursor.getTime()) break; // safety: ONE_TIME never advances
    cursor = next;
  }

  while (cursor <= monthEnd) {
    if (cursor >= monthStart) days.push(cursor.getDate());
    const next = advanceByCycle(cursor, bill.cycle);
    if (next.getTime() === cursor.getTime()) break;
    cursor = next;
  }

  return days;
}

export function getBillOccurrencesInMonth(
  bills: BillItem[],
  year: number,
  month: number,
): BillOccurrence[] {
  const result: BillOccurrence[] = [];
  for (const bill of bills) {
    for (const day of getBillDaysInMonth(bill, year, month)) {
      result.push({ bill, day });
    }
  }
  return result.sort((a, b) => a.day - b.day || a.bill.name.localeCompare(b.bill.name));
}

export function getTotalForMonth(bills: BillItem[], year: number, month: number): number {
  let total = 0;
  for (const bill of bills) {
    if (!bill.amount) continue;
    total += getBillDaysInMonth(bill, year, month).length * parseFloat(bill.amount);
  }
  return total;
}

/** Returns an array of (number | null) cells for a month calendar grid (Sun-start). */
export function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
