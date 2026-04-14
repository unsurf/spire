"use client";

import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, X } from "lucide-react";
import { isAccountCategory } from "@/lib/utils";
import type { AccountCategory } from "@/generated/prisma/client";
import type { BankAccountFormProps } from "./add-account-modal.types";

const BANK_CATEGORIES: [AccountCategory, string][] = [
  ["CHEQUE", "Cheque"],
  ["SAVINGS", "Savings"],
];

export function BankAccountForm({ onBack, onClose, onAdded }: BankAccountFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AccountCategory>("CHEQUE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category }),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      setLoading(false);
      setError("Server error: invalid response");
      return;
    }
    setLoading(false);

    if (!res.ok) {
      const errSchema = z.object({ error: z.string() });
      const errResult = errSchema.safeParse(data);
      setError(errResult.success ? errResult.data.error : "Failed to create account");
      return;
    }

    const accountSchema = z.object({ id: z.string(), name: z.string(), category: z.string() });
    const accountResult = accountSchema.safeParse(data);
    if (!accountResult.success) {
      setError("Unexpected response from server");
      return;
    }

    const { id, name: accountName, category: rawCategory } = accountResult.data;
    if (!isAccountCategory(rawCategory)) {
      setError("Unexpected response from server");
      return;
    }

    onAdded({
      id,
      name: accountName,
      category: rawCategory,
      oracleEnabled: false,
      annualGrowthRate: null,
      coinId: null,
      coinSymbol: null,
      coinQuantity: null,
      balanceEntries: [],
      splits: [],
    });
  }

  return (
    <div className="bg-surface-raised border-edge w-full max-w-md rounded-2xl border p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-subtle hover:text-on-surface -ml-1 rounded-md p-1 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-on-surface text-lg font-semibold">Bank Account</h2>
        </div>
        <button onClick={onClose} className="text-subtle hover:text-on-surface transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-muted mb-1.5 block text-sm font-medium">Account name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-edge-strong bg-input-bg text-input-text placeholder-subtle focus:border-accent focus:ring-accent w-full rounded-lg border px-3.5 py-2.5 transition-colors focus:ring-1 focus:outline-none"
            placeholder="e.g. Everyday Account"
          />
        </div>

        <div>
          <label className="text-muted mb-1.5 block text-sm font-medium">Type</label>
          <select
            value={category}
            onChange={(e) => {
              const val = e.target.value;
              if (isAccountCategory(val)) setCategory(val);
            }}
            className="border-edge-strong bg-input-bg text-input-text focus:border-accent focus:ring-accent w-full rounded-lg border px-3.5 py-2.5 transition-colors focus:ring-1 focus:outline-none"
          >
            {BANK_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-error bg-error-soft border-error-border rounded-lg border px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="border-edge-strong text-muted hover:bg-surface flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent-strong text-on-accent flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
