"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarClock,
} from "lucide-react";
import { PAY_CYCLE_LABELS, PAY_CYCLE_ENTRIES, ACCOUNT_CATEGORY_LABELS, isPayCycle } from "@/lib/utils";
import { formatCurrency } from "@/lib/currencies";
import { formatNextPayDate, splitAmount } from "@/lib/payday";
import { SplitEditor } from "../split-editor";
import type { PayCycle } from "@/generated/prisma/client";
import { incomeItemResponseSchema } from "@/lib/schemas/income-response.schema";
import type {
  IncomeClientProps,
  IncomeSplit,
} from "./income-client.types";
import {
  calculateRemainingAllocation,
  parseNumericInput,
} from "./income-client.utils";

const PAY_CYCLES = PAY_CYCLE_ENTRIES;

export default function IncomeClientComponent({
  incomes: initial,
  accounts,
  currency,
}: IncomeClientProps) {
  const [incomes, setIncomes] = useState(initial);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<PayCycle>("MONTHLY");
  const [lastPaidDate, setLastPaidDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);

    const parsedAmount = parseNumericInput(amount);
    if (parsedAmount === null) {
      setAdding(false);
      setAddError("Amount is required");
      return;
    }

    const res = await fetch("/api/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount: parsedAmount,
        cycle,
        lastPaidAt: lastPaidDate || null,
      }),
    });

    const raw = await res.text();
    let rawData: unknown = null;
    if (raw) {
      try {
        rawData = JSON.parse(raw);
      } catch {
        rawData = null;
      }
    }
    setAdding(false);

    if (!res.ok) {
      const errSchema = z.object({ error: z.string() });
      const errResult = errSchema.safeParse(rawData);
      setAddError(errResult.success ? errResult.data.error : "Failed to add income");
      return;
    }

    const parsed = incomeItemResponseSchema.safeParse(rawData);
    if (!parsed.success) {
      setAddError("Unexpected response from server");
      return;
    }

    setIncomes((prev) => [...prev, parsed.data]);
    setName("");
    setAmount("");
    setCycle("MONTHLY");
    setLastPaidDate("");
    setShowAddForm(false);
    setExpandedId(parsed.data.id);
  }

  const handleDeleteIncome = useCallback(async (id: string) => {
    const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
    if (res.ok) setIncomes((prev) => prev.filter((income) => income.id !== id));
  }, []);

  const handleSplitsUpdated = useCallback((incomeId: string, splits: IncomeSplit[]) => {
    setIncomes((prev) =>
      prev.map((income) => (income.id === incomeId ? { ...income, splits } : income))
    );
  }, []);

  const inputClassName =
    "w-full border border-edge-strong rounded-lg px-3.5 py-2.5 bg-input-bg text-input-text placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm";

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Income</h1>
          <p className="text-muted mt-0.5">
            Manage income sources and account splits
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-strong text-on-accent transition-colors"
        >
          <Plus size={15} />
          Add income
        </button>
      </div>

      {showAddForm && (
        <div className="bg-surface-raised border border-edge rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-muted mb-4">
            New income source
          </h2>
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Salary"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Pay cycle
                </label>
                <select
                  value={cycle}
                  onChange={(e) => { if (isPayCycle(e.target.value)) setCycle(e.target.value); }}
                  className={inputClassName}
                >
                  {PAY_CYCLES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Last paid date
                </label>
                <input
                  type="date"
                  value={lastPaidDate}
                  onChange={(e) => setLastPaidDate(e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            {addError && <p className="text-error text-sm">{addError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="border border-edge-strong text-muted rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {adding ? "Adding..." : "Add income"}
              </button>
            </div>
          </form>
        </div>
      )}

      {incomes.length === 0 ? (
        <div className="text-center py-16 text-subtle bg-surface-raised border border-edge rounded-xl">
          <p className="font-medium">No income sources yet</p>
          <p className="text-sm mt-1">Add your first income source above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incomes.map((income) => {
            const incomeAmount = Number(income.amount);
            const nextPay = formatNextPayDate({
              cycle: income.cycle,
              lastPaidAt: income.lastPaidAt,
            });

            return (
              <div
                key={income.id}
                className="bg-surface-raised border border-edge rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface">{income.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-sm text-muted">
                        {formatCurrency(incomeAmount, currency)} ·{" "}
                        {PAY_CYCLE_LABELS[income.cycle]}
                      </span>
                      {income.lastPaidAt && (
                        <span className="flex items-center gap-1 text-xs text-accent font-medium">
                          <CalendarClock size={11} />
                          {nextPay}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => handleDeleteIncome(income.id)}
                      className="text-subtle hover:text-error transition-colors p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === income.id ? null : income.id)
                      }
                      className="text-subtle hover:text-on-surface transition-colors p-1"
                    >
                      {expandedId === income.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {expandedId !== income.id && income.splits.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="bg-surface rounded-lg divide-y divide-edge">
                      {income.splits.map((split) => {
                        const dollars = splitAmount(
                          incomeAmount,
                          split.type,
                          Number(split.value)
                        );
                        return (
                          <div
                            key={split.id}
                            className="flex items-center justify-between px-3 py-2.5"
                          >
                            <span className="text-sm text-on-surface">
                              {split.account.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-subtle">
                                {split.type === "PERCENTAGE"
                                  ? `${split.value}% · ${formatCurrency(dollars, currency)}`
                                  : `${formatCurrency(dollars, currency)} (fixed)`}
                              </span>
                              <span className="text-sm font-semibold text-accent">
                                {formatCurrency(dollars, currency)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {(() => {
                        const remaining = calculateRemainingAllocation(
                          incomeAmount,
                          income.splits
                        );
                        if (remaining < 0.01) return null;
                        return (
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-sm text-subtle italic">
                              Unallocated
                            </span>
                            <span className="text-sm font-medium text-subtle">
                              {formatCurrency(remaining, currency)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {expandedId === income.id && (
                  <div className="border-t border-edge px-5 py-4">
                    <SplitEditor
                      income={income}
                      accounts={accounts}
                      currency={currency}
                      onSaved={(splits) => handleSplitsUpdated(income.id, splits)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mt-6 text-xs text-subtle">
          Accounts:{" "}
          {accounts.map((account) => (
            <span key={account.id} className="font-medium text-muted">
              {account.name} ({ACCOUNT_CATEGORY_LABELS[account.category]}){" "}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
