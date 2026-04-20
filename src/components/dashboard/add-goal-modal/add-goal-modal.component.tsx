"use client";

import { useState } from "react";
import { z } from "zod";
import { X } from "lucide-react";
import type { AddGoalModalProps } from "./add-goal-modal.types";

const goalResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.string(),
  accountId: z.string().nullable(),
  deadline: z.string().nullable(),
  createdAt: z.string(),
});

export function AddGoalModal({ accounts, currency, onClose, onAdded }: AddGoalModalProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [type, setType] = useState<"net-worth" | "account">("net-worth");
  const [accountId, setAccountId] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Target amount must be a positive number");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        targetAmount: amount,
        accountId: type === "account" && accountId ? accountId : null,
        deadline: deadline || null,
      }),
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
      const errSchema = z.object({ error: z.union([z.string(), z.record(z.string(), z.unknown())]) });
      const errResult = errSchema.safeParse(data);
      setError(errResult.success ? String(errResult.data.error) : "Failed to create goal");
      return;
    }

    const result = goalResponseSchema.safeParse(data);
    if (!result.success) {
      setError("Unexpected response from server");
      return;
    }

    onAdded(result.data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-raised border-edge w-full max-w-md rounded-2xl border p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-on-surface text-lg font-semibold">Add Goal</h2>
          <button onClick={onClose} className="text-subtle hover:text-on-surface transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-muted mb-1.5 block text-sm font-medium">Goal name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-edge-strong bg-input-bg text-input-text placeholder-subtle focus:border-accent focus:ring-accent w-full rounded-lg border px-3.5 py-2.5 transition-colors focus:ring-1 focus:outline-none"
              placeholder="e.g. Emergency fund"
            />
          </div>

          <div>
            <label className="text-muted mb-1.5 block text-sm font-medium">
              Target amount ({currency})
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="border-edge-strong bg-input-bg text-input-text placeholder-subtle focus:border-accent focus:ring-accent w-full rounded-lg border px-3.5 py-2.5 transition-colors focus:ring-1 focus:outline-none"
              placeholder="e.g. 10000"
            />
          </div>

          <div>
            <label className="text-muted mb-1.5 block text-sm font-medium">Goal type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("net-worth")}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  type === "net-worth"
                    ? "bg-accent border-accent text-on-accent"
                    : "border-edge-strong text-muted hover:border-edge bg-transparent"
                }`}
              >
                Net worth
              </button>
              <button
                type="button"
                onClick={() => setType("account")}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  type === "account"
                    ? "bg-accent border-accent text-on-accent"
                    : "border-edge-strong text-muted hover:border-edge bg-transparent"
                }`}
              >
                Account
              </button>
            </div>
          </div>

          {type === "account" && (
            <div>
              <label className="text-muted mb-1.5 block text-sm font-medium">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="border-edge-strong bg-input-bg text-input-text focus:border-accent focus:ring-accent w-full rounded-lg border px-3.5 py-2.5 transition-colors focus:ring-1 focus:outline-none"
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-muted mb-1.5 block text-sm font-medium">
              Deadline <span className="text-subtle font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border-edge-strong bg-input-bg text-input-text focus:border-accent focus:ring-accent w-full rounded-lg border px-3.5 py-2.5 transition-colors focus:ring-1 focus:outline-none"
            />
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
              {loading ? "Adding..." : "Add goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
