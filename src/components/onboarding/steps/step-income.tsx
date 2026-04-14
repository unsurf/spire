"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PAY_CYCLE_ENTRIES, isPayCycle } from "@/lib/utils";
import { PayDayPicker } from "@/components/income/pay-day-picker";
import type { IncomeWithSplits } from "../onboarding-wizard";

const PAY_CYCLES = PAY_CYCLE_ENTRIES;

const inputClassName =
  "w-full bg-input-bg border border-edge-strong rounded-lg px-3 py-2 text-input-text text-sm placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";

type Props = {
  incomes: IncomeWithSplits[];
  onChange: (incomes: IncomeWithSplits[]) => void;
  onNext: () => void;
  onBack: () => void;
};

const emptyIncome = (): IncomeWithSplits => ({
  _id: crypto.randomUUID(),
  name: "",
  amount: "",
  cycle: "MONTHLY",
  payDay: "",
  payDay2: "",
  splits: [],
});

export default function StepIncome({ incomes, onChange, onNext, onBack }: Props) {
  const [list, setList] = useState<IncomeWithSplits[]>(
    incomes.length > 0 ? incomes : [emptyIncome()]
  );

  function update(index: number, patch: Partial<IncomeWithSplits>) {
    const updated = list.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    setList(updated);
    onChange(updated);
  }

  function add() {
    const updated = [...list, emptyIncome()];
    setList(updated);
    onChange(updated);
  }

  function remove(index: number) {
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
    onChange(updated);
  }

  const valid = list.every(
    (i) => i.name.trim() && i.amount && parseFloat(i.amount) > 0 && i.cycle
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-on-surface mb-1">
        Do you receive regular payments?
      </h2>
      <p className="text-muted text-sm mb-6">
        Add your income sources — salary, freelance, rental income, anything
        that arrives on a schedule.
      </p>

      <div className="space-y-4">
        {list.map((income, i) => (
          <div
            key={income._id}
            className="bg-edge/30 rounded-xl p-4 border border-edge"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-muted uppercase tracking-wide">
                Income {i + 1}
              </span>
              {list.length > 1 && (
                <button
                  onClick={() => remove(i)}
                  className="text-subtle hover:text-error transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={income.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="e.g. Salary"
                  className={inputClassName}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={income.amount}
                    onChange={(e) => update(i, { amount: e.target.value })}
                    placeholder="0.00"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Pay cycle
                  </label>
                  <select
                    value={income.cycle}
                    onChange={(e) => {
                      if (isPayCycle(e.target.value)) {
                        update(i, { cycle: e.target.value, payDay: "", payDay2: "" });
                      }
                    }}
                    className={inputClassName}
                  >
                    {PAY_CYCLES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <PayDayPicker
                cycle={income.cycle}
                payDay={income.payDay}
                payDay2={income.payDay2}
                onPayDayChange={(v) => update(i, { payDay: v })}
                onPayDay2Change={(v) => update(i, { payDay2: v })}
              />
            </div>
          </div>
        ))}

        <button
          onClick={add}
          className="flex items-center gap-2 text-sm text-muted hover:text-on-surface transition-colors"
        >
          <Plus size={15} />
          Add another income source
        </button>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="text-muted hover:text-on-surface transition-colors text-sm font-medium"
        >
          Back
        </button>
        <button
          onClick={() => {
            onChange(list);
            onNext();
          }}
          disabled={!valid}
          className="bg-accent hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed text-on-accent font-medium rounded-lg px-6 py-2.5 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
