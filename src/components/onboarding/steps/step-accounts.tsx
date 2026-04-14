"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ACCOUNT_CATEGORY_ENTRIES, isAccountCategory } from "@/lib/utils";
import type { AccountInput } from "../onboarding-wizard";

const CATEGORIES = ACCOUNT_CATEGORY_ENTRIES;

const inputClassName =
  "w-full bg-input-bg border border-edge-strong rounded-lg px-3.5 py-2.5 text-input-text text-sm placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";

type Props = {
  accounts: AccountInput[];
  onChange: (accounts: AccountInput[]) => void;
  onNext: () => void;
  onBack: () => void;
};

const emptyAccount = (): AccountInput => ({ _id: crypto.randomUUID(), name: "", category: "CHEQUE" });

export default function StepAccounts({ accounts, onChange, onNext, onBack }: Props) {
  const [list, setList] = useState<AccountInput[]>(
    accounts.length > 0 ? accounts : [emptyAccount()]
  );

  function update(index: number, patch: Partial<AccountInput>) {
    const updated = list.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    setList(updated);
    onChange(updated);
  }

  function add() {
    const updated = [...list, emptyAccount()];
    setList(updated);
    onChange(updated);
  }

  function remove(index: number) {
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
    onChange(updated);
  }

  const valid = list.every((a) => a.name.trim() && a.category);

  return (
    <div>
      <h2 className="text-xl font-semibold text-on-surface mb-1">
        Set up your accounts
      </h2>
      <p className="text-muted text-sm mb-6">
        Add the accounts you want to track — bank accounts, savings pots,
        investment accounts, crypto wallets, and physical assets.
      </p>

      <div className="space-y-3">
        {list.map((account, i) => (
          <div key={account._id} className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={account.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Account name"
                className={inputClassName}
              />
            </div>
            <div className="flex-1">
              <select
                value={account.category}
                onChange={(e) => {
                  if (isAccountCategory(e.target.value)) {
                    update(i, { category: e.target.value });
                  }
                }}
                className={inputClassName}
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {list.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="text-subtle hover:text-error transition-colors p-1 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={add}
          className="flex items-center gap-2 text-sm text-muted hover:text-on-surface transition-colors mt-1"
        >
          <Plus size={15} />
          Add another account
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
          disabled={!valid || list.length === 0}
          className="bg-accent hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed text-on-accent font-medium rounded-lg px-6 py-2.5 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
