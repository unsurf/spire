"use client";

import { useState } from "react";
import { z } from "zod";
import { X } from "lucide-react";
import { ACCOUNT_CATEGORY_ENTRIES, isAccountCategory } from "@/lib/utils";
import type { AccountCategory } from "@/generated/prisma/client";
import type { AddAccountModalProps } from "./add-account-modal.types";

const CATEGORIES = ACCOUNT_CATEGORY_ENTRIES;

export function AddAccountModal({ onClose, onAdded }: AddAccountModalProps) {
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

    onAdded({ id, name: accountName, category: rawCategory, oracleEnabled: false, annualGrowthRate: null, balanceEntries: [], splits: [] });
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (isAccountCategory(value)) {
      setCategory(value);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised rounded-2xl shadow-xl w-full max-w-md p-6 border border-edge">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-on-surface">
            Add account
          </h2>
          <button
            onClick={onClose}
            className="text-subtle hover:text-on-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Account name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-edge-strong rounded-lg px-3.5 py-2.5 bg-input-bg text-input-text placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              placeholder="e.g. Everyday Account"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={handleCategoryChange}
              className="w-full border border-edge-strong rounded-lg px-3.5 py-2.5 bg-input-bg text-input-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-error text-sm bg-error-soft border border-error-border rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-edge-strong text-muted rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
