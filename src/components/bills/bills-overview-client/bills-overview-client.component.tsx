"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import { AddBillModal } from "../add-bill-modal";
import { MONTH_LABELS } from "../bills-client/bills-client.constants";
import {
  BILL_CATEGORY_LABELS,
  BILL_SUBCATEGORY_LABELS,
} from "@/lib/constants/bills.constants";
import { buildOverviewData } from "./bills-overview-client.utils";
import type { BillsOverviewClientProps } from "./bills-overview-client.types";
import type { BillItem } from "../bills-client/bills-client.types";

export default function BillsOverviewClientComponent({
  bills: initial,
  accounts,
  currency,
}: BillsOverviewClientProps) {
  const today = new Date();
  const [bills, setBills] = useState(initial);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<BillItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["LIVING_EXPENSES", "SUBSCRIPTIONS", "uncategorised"]));

  const overview = useMemo(() => buildOverviewData(bills, year, month), [bills, year, month]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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

  const hasContent = overview.categories.length > 0 || overview.uncategorised.length > 0;

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Bills</h1>
          <p className="text-muted mt-0.5">Monthly spending overview</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-strong text-on-accent transition-colors"
        >
          <Plus size={15} />
          Add bill
        </button>
      </div>

      {/* Month navigation + total */}
      <div className="flex items-center justify-between mb-6">
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

        {overview.total > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted">Total this month</p>
            <p className="text-xl font-bold text-error tabular-nums">
              {formatCurrency(overview.total, currency)}
            </p>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {hasContent ? (
        <div className="space-y-3">
          {overview.categories.map(({ category, total, subcategories, uncategorised: catUncategorised }) => {
            const key = category ?? "uncategorised";
            const expanded = expandedCategories.has(key);
            const allBillsInCat = [
              ...subcategories.flatMap((s) => s.bills),
              ...catUncategorised,
            ];

            return (
              <div key={key} className="bg-surface-raised border border-edge rounded-xl overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(key)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expanded ? (
                      <ChevronDown size={15} className="text-muted shrink-0" />
                    ) : (
                      <ChevronRightIcon size={15} className="text-muted shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-on-surface">
                      {BILL_CATEGORY_LABELS[category!]}
                    </span>
                    <span className="text-xs text-muted">
                      {allBillsInCat.length} bill{allBillsInCat.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {total > 0 && (
                    <span className="text-sm font-semibold text-error tabular-nums">
                      {formatCurrency(total, currency)}
                    </span>
                  )}
                </button>

                {expanded && (
                  <div className="border-t border-edge">
                    {/* Subcategory groups */}
                    {subcategories.map(({ subcategory, total: subTotal, bills: subBills }) => (
                      <div key={subcategory} className="border-b border-edge last:border-b-0">
                        <div className="flex items-center justify-between px-5 py-2.5 bg-surface/30">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                            {BILL_SUBCATEGORY_LABELS[subcategory]}
                          </span>
                          {subTotal > 0 && (
                            <span className="text-xs font-semibold text-muted tabular-nums">
                              {formatCurrency(subTotal, currency)}
                            </span>
                          )}
                        </div>
                        <div className="divide-y divide-edge">
                          {subBills.map((bill) => (
                            <BillRow key={bill.id} bill={bill} currency={currency} onEdit={openEdit} />
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Bills in category without subcategory */}
                    {catUncategorised.length > 0 && (
                      <div className="divide-y divide-edge">
                        {catUncategorised.map((bill) => (
                          <BillRow key={bill.id} bill={bill} currency={currency} onEdit={openEdit} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorised bills */}
          {overview.uncategorised.length > 0 && (
            <div className="bg-surface-raised border border-edge rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory("uncategorised")}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has("uncategorised") ? (
                    <ChevronDown size={15} className="text-muted shrink-0" />
                  ) : (
                    <ChevronRightIcon size={15} className="text-muted shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-on-surface">Uncategorised</span>
                  <span className="text-xs text-muted">
                    {overview.uncategorised.length} bill{overview.uncategorised.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </button>

              {expandedCategories.has("uncategorised") && (
                <div className="border-t border-edge divide-y divide-edge">
                  {overview.uncategorised.map((bill) => (
                    <BillRow key={bill.id} bill={bill} currency={currency} onEdit={openEdit} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-subtle bg-surface-raised border border-edge rounded-xl">
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

function BillRow({
  bill,
  currency,
  onEdit,
}: {
  bill: BillItem;
  currency: string;
  onEdit: (bill: BillItem) => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 group">
      <div className="min-w-0">
        <p className="text-sm font-medium text-on-surface truncate">{bill.name}</p>
        {bill.accountName && (
          <p className="text-xs text-subtle truncate">{bill.accountName}</p>
        )}
      </div>
      <div className="flex items-center gap-4 ml-4 shrink-0">
        {bill.amount ? (
          <span className="text-sm font-semibold text-error tabular-nums">
            {formatCurrency(parseFloat(bill.amount), currency)}
          </span>
        ) : (
          <span className="text-xs text-subtle">—</span>
        )}
        <button
          onClick={() => onEdit(bill)}
          className="text-subtle hover:text-on-surface transition-colors p-1 opacity-0 group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
      </div>
    </div>
  );
}
