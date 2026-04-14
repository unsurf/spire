"use client";

import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, X } from "lucide-react";
import { isAccountCategory } from "@/lib/utils";
import type { HighGrowthFormProps } from "./add-account-modal.types";

export function HighGrowthForm({ onBack, onClose, onAdded }: HighGrowthFormProps) {
  const [name, setName] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const parsedRate = parseFloat(interestRate);
    if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setError("Interest rate must be between 0 and 100");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category: "HIGH_GROWTH", annualGrowthRate: parsedRate }),
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

    const accountSchema = z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      annualGrowthRate: z.number().nullable(),
    });
    const accountResult = accountSchema.safeParse(data);
    if (!accountResult.success) {
      setError("Unexpected response from server");
      return;
    }

    const { id, name: accountName, category: rawCategory, annualGrowthRate } = accountResult.data;
    if (!isAccountCategory(rawCategory)) {
      setError("Unexpected response from server");
      return;
    }

    onAdded({
      id,
      name: accountName,
      category: rawCategory,
      oracleEnabled: true,
      annualGrowthRate,
      coinId: null,
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
          <h2 className="text-on-surface text-lg font-semibold">High Growth Savings</h2>
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
            placeholder="e.g. High Interest Savings"
          />
        </div>

        <div>
          <label className="text-muted mb-1.5 block text-sm font-medium">Annual interest rate</label>
          <div className="relative">
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              required
              min={0}
              max={100}
              step={0.01}
              className="border-edge-strong bg-input-bg text-input-text placeholder-subtle focus:border-accent focus:ring-accent w-full rounded-lg border px-3.5 py-2.5 pr-8 transition-colors focus:ring-1 focus:outline-none"
              placeholder="e.g. 5.25"
            />
            <span className="text-muted pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm">
              %
            </span>
          </div>
          <p className="text-subtle mt-1 text-xs">
            Used to project future balance with Oracle
          </p>
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
