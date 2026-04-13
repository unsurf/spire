"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import { PAY_CYCLE_LABELS } from "@/lib/utils";
import type {
  IncomeWithSplits,
  AccountInput,
  SplitInput,
} from "../onboarding-wizard";

const inputClassName =
  "bg-input-bg border border-edge-strong rounded-lg px-3 py-2 text-input-text text-sm focus:outline-none focus:border-accent";

type Props = {
  incomes: IncomeWithSplits[];
  accounts: AccountInput[];
  currency: string;
  onChange: (incomes: IncomeWithSplits[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function StepSplits({
  incomes,
  accounts,
  currency,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [list, setList] = useState<IncomeWithSplits[]>(incomes);

  function updateSplits(incomeIndex: number, splits: SplitInput[]) {
    const updated = list.map((inc, i) =>
      i === incomeIndex ? { ...inc, splits } : inc
    );
    setList(updated);
    onChange(updated);
  }

  function addSplit(incomeIndex: number) {
    const income = list[incomeIndex];
    const usedIndices = income.splits.map((s) => s.accountIndex);
    const nextIndex = accounts.findIndex((_, i) => !usedIndices.includes(i));
    if (nextIndex === -1) return;

    updateSplits(incomeIndex, [
      ...income.splits,
      { accountIndex: nextIndex, type: "PERCENTAGE", value: "" },
    ]);
  }

  function removeSplit(incomeIndex: number, splitIndex: number) {
    const income = list[incomeIndex];
    updateSplits(
      incomeIndex,
      income.splits.filter((_, i) => i !== splitIndex)
    );
  }

  function updateSplit(
    incomeIndex: number,
    splitIndex: number,
    patch: Partial<SplitInput>
  ) {
    const income = list[incomeIndex];
    updateSplits(
      incomeIndex,
      income.splits.map((s, i) =>
        i === splitIndex ? { ...s, ...patch } : s
      )
    );
  }

  function totalPct(income: IncomeWithSplits) {
    return income.splits
      .filter((s) => s.type === "PERCENTAGE")
      .reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
  }

  function totalFixed(income: IncomeWithSplits) {
    return income.splits
      .filter((s) => s.type === "FIXED")
      .reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
  }

  function isOverAllocated(income: IncomeWithSplits) {
    return (
      totalPct(income) > 100 || totalFixed(income) > parseFloat(income.amount)
    );
  }

  const anyOverAllocated = list.some(isOverAllocated);

  return (
    <div>
      <h2 className="text-xl font-semibold text-on-surface mb-1">
        How should income be split?
      </h2>
      <p className="text-muted text-sm mb-6">
        Define how each income source distributes across your accounts. You can
        mix percentage and fixed splits, and skip accounts you don&apos;t want
        to allocate to.
      </p>

      <div className="space-y-6">
        {list.map((income, incomeIdx) => {
          const pct = totalPct(income);
          const fixed = totalFixed(income);
          const overPct = pct > 100;
          const overFixed = fixed > parseFloat(income.amount);
          const incomeAmount = parseFloat(income.amount);

          return (
            <div
              key={incomeIdx}
              className="bg-edge/30 rounded-xl p-4 border border-edge"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {income.name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatCurrency(incomeAmount, currency)} ·{" "}
                    {PAY_CYCLE_LABELS[income.cycle]}
                  </p>
                </div>
                <div className="text-right text-xs">
                  {income.splits.some((s) => s.type === "PERCENTAGE") && (
                    <p
                      className={
                        overPct ? "text-error font-medium" : "text-muted"
                      }
                    >
                      {(100 - pct).toFixed(1)}% unallocated
                    </p>
                  )}
                  {income.splits.some((s) => s.type === "FIXED") && (
                    <p
                      className={
                        overFixed ? "text-error font-medium" : "text-muted"
                      }
                    >
                      {formatCurrency(incomeAmount - fixed, currency)}{" "}
                      unallocated
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {income.splits.map((split, splitIdx) => {
                  const parsedValue = parseFloat(split.value) || 0;
                  const dollarEquiv =
                    split.type === "PERCENTAGE"
                      ? (incomeAmount * parsedValue) / 100
                      : parsedValue;
                  const pctEquiv =
                    split.type === "FIXED" && incomeAmount > 0
                      ? (parsedValue / incomeAmount) * 100
                      : null;

                  return (
                    <div key={splitIdx} className="flex items-center gap-2">
                      <select
                        value={split.accountIndex}
                        onChange={(e) =>
                          updateSplit(incomeIdx, splitIdx, {
                            accountIndex: parseInt(e.target.value),
                          })
                        }
                        className={`flex-1 ${inputClassName}`}
                      >
                        {accounts.map((a, ai) => (
                          <option key={ai} value={ai}>
                            {a.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex border border-edge-strong rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            updateSplit(incomeIdx, splitIdx, {
                              type: "PERCENTAGE",
                            })
                          }
                          className={`px-2.5 py-2 text-xs font-medium transition-colors ${
                            split.type === "PERCENTAGE"
                              ? "bg-accent text-on-accent"
                              : "text-muted hover:text-on-surface bg-input-bg"
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSplit(incomeIdx, splitIdx, {
                              type: "FIXED",
                            })
                          }
                          className={`px-2.5 py-2 text-xs font-medium transition-colors ${
                            split.type === "FIXED"
                              ? "bg-accent text-on-accent"
                              : "text-muted hover:text-on-surface bg-input-bg"
                          }`}
                        >
                          $
                        </button>
                      </div>

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.value}
                        onChange={(e) =>
                          updateSplit(incomeIdx, splitIdx, {
                            value: e.target.value,
                          })
                        }
                        placeholder={
                          split.type === "PERCENTAGE" ? "0" : "0.00"
                        }
                        className={`w-24 text-right ${inputClassName}`}
                      />

                      {split.value && parsedValue > 0 && (
                        <span className="text-xs text-subtle whitespace-nowrap min-w-[80px]">
                          {split.type === "PERCENTAGE"
                            ? formatCurrency(dollarEquiv, currency)
                            : `${pctEquiv?.toFixed(1)}%`}
                        </span>
                      )}

                      <button
                        onClick={() => removeSplit(incomeIdx, splitIdx)}
                        className="text-subtle hover:text-error transition-colors p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {income.splits.length < accounts.length && (
                <button
                  onClick={() => addSplit(incomeIdx)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-on-surface transition-colors mt-3"
                >
                  <Plus size={12} />
                  Add account
                </button>
              )}
            </div>
          );
        })}
      </div>

      {anyOverAllocated && (
        <p className="text-error text-sm mt-4 bg-error-soft border border-error-border rounded-lg px-3 py-2">
          Some splits exceed 100% or the income amount. Please fix before
          continuing.
        </p>
      )}

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="text-muted hover:text-on-surface transition-colors text-sm font-medium"
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={onNext}
            className="text-muted hover:text-on-surface transition-colors text-sm"
          >
            Skip splits
          </button>
          <button
            onClick={onNext}
            disabled={anyOverAllocated}
            className="bg-accent hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed text-on-accent font-medium rounded-lg px-6 py-2.5 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
