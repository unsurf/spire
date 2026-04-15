"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import { AddBillModal } from "../add-bill-modal";
import {
  WEEKDAY_LABELS,
  MONTH_LABELS,
  BILL_CYCLE_LABELS,
} from "./bills-client.constants";
import {
  buildCalendarGrid,
  getBillOccurrencesInMonth,
  getTotalForMonth,
} from "./bills-client.utils";
import type { BillsClientProps, BillItem } from "./bills-client.types";

export default function BillsClientComponent({
  bills: initial,
  accounts,
  currency,
}: BillsClientProps) {
  const today = new Date();
  const [bills, setBills] = useState(initial);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<BillItem | null>(null);

  const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const occurrences = useMemo(
    () => getBillOccurrencesInMonth(bills, year, month),
    [bills, year, month],
  );
  const monthTotal = useMemo(
    () => getTotalForMonth(bills, year, month),
    [bills, year, month],
  );

  // Group occurrences by day for O(1) lookup in the grid
  const byDay = useMemo(() => {
    const map = new Map<number, typeof occurrences>();
    for (const occ of occurrences) {
      const list = map.get(occ.day) ?? [];
      list.push(occ);
      map.set(occ.day, list);
    }
    return map;
  }, [occurrences]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const openAdd = useCallback(() => { setEditingBill(null); setShowModal(true); }, []);
  const openEdit = useCallback((bill: BillItem) => { setEditingBill(bill); setShowModal(true); }, []);
  const closeModal = useCallback(() => { setShowModal(false); setEditingBill(null); }, []);

  const handleSaved = useCallback((saved: BillItem) => {
    setBills((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    closeModal();
  }, [closeModal]);

  const handleDeleted = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    closeModal();
  }, [closeModal]);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Bills Calendar</h1>
          <p className="text-muted mt-0.5">Track recurring bills and upcoming payments</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-strong text-on-accent transition-colors"
        >
          <Plus size={15} />
          Add bill
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md text-muted hover:text-on-surface hover:bg-surface-raised transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-on-surface w-44 text-center">
            {MONTH_LABELS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md text-muted hover:text-on-surface hover:bg-surface-raised transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {monthTotal > 0 && (
          <p className="text-sm text-muted">
            Total this month:{" "}
            <span className="font-semibold text-error">{formatCurrency(monthTotal, currency)}</span>
          </p>
        )}
      </div>

      {/* Calendar grid */}
      <div className="bg-surface-raised border border-edge rounded-xl overflow-hidden mb-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-edge">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-2.5 text-center text-xs font-semibold text-muted uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            const cellOccs = day !== null ? (byDay.get(day) ?? []) : [];
            const todayCell = day !== null && isToday(day);

            return (
              <div
                key={i}
                className={`min-h-[80px] p-2 border-b border-r border-edge last:border-r-0 ${
                  i % 7 === 6 ? "border-r-0" : ""
                } ${day === null ? "bg-surface/40" : ""}`}
              >
                {day !== null && (
                  <>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${
                        todayCell
                          ? "bg-accent text-on-accent"
                          : "text-muted"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {cellOccs.map(({ bill }) => (
                        <button
                          key={bill.id + "-" + day}
                          onClick={() => openEdit(bill)}
                          className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium bg-error-soft text-error hover:bg-error-border transition-colors truncate flex items-center gap-1 group"
                          title={bill.name}
                        >
                          <span className="truncate flex-1">{bill.name}</span>
                          <Pencil size={9} className="opacity-0 group-hover:opacity-60 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bill list for the month */}
      {occurrences.length > 0 ? (
        <div className="bg-surface-raised border border-edge rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-edge">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">
              {MONTH_LABELS[month]} · {occurrences.length} payment{occurrences.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="divide-y divide-edge">
            {occurrences.map(({ bill, day }, i) => (
              <div
                key={`${bill.id}-${day}-${i}`}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-sm font-semibold text-muted w-8 shrink-0 tabular-nums">
                    {String(day).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{bill.name}</p>
                    {bill.accountName && (
                      <p className="text-xs text-subtle truncate">{bill.accountName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4 shrink-0">
                  <span className="text-xs text-muted">{BILL_CYCLE_LABELS[bill.cycle]}</span>
                  {bill.amount ? (
                    <span className="text-sm font-semibold text-error tabular-nums">
                      {formatCurrency(parseFloat(bill.amount), currency)}
                    </span>
                  ) : (
                    <span className="text-xs text-subtle">—</span>
                  )}
                  <button
                    onClick={() => openEdit(bill)}
                    className="text-subtle hover:text-on-surface transition-colors p-1"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-subtle bg-surface-raised border border-edge rounded-xl">
          <p className="font-medium">No bills in {MONTH_LABELS[month]}</p>
          <p className="text-sm mt-1">Add a bill to track recurring payments</p>
        </div>
      )}

      {showModal && (
        <AddBillModal
          accounts={accounts}
          currency={currency}
          bill={editingBill}
          onClose={closeModal}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
