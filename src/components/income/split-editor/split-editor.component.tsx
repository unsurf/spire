"use client";

import { useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import { ACCOUNT_CATEGORY_LABELS } from "@/lib/utils";
import { updateSplitsResponseSchema } from "@/lib/schemas/income-response.schema";
import type {
  SplitEditorProps,
  SplitEditorDraft,
  SplitEditorSplit,
} from "./split-editor.types";

export function SplitEditor({
  income,
  accounts,
  currency,
  onSaved,
}: SplitEditorProps) {
  const [drafts, setDrafts] = useState<SplitEditorDraft[]>(
    income.splits.map((s, i) => ({
      _id: `${s.account.id}-${i}`,
      accountId: s.account.id,
      type: s.type,
      value: String(s.value),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const incomeAmount = Number(income.amount);

  const totalPct = useMemo(
    () =>
      drafts
        .filter((d) => d.type === "PERCENTAGE")
        .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
    [drafts]
  );

  const totalFixed = useMemo(
    () =>
      drafts
        .filter((d) => d.type === "FIXED")
        .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
    [drafts]
  );

  const remainingPct = 100 - totalPct;
  const remainingFixed = incomeAmount - totalFixed;

  const isOverPct = totalPct > 100;
  const isOverFixed = totalFixed > incomeAmount;

  const addRow = useCallback(() => {
    const unusedAccount = accounts.find(
      (a) => !drafts.some((d) => d.accountId === a.id)
    );
    setDrafts((prev) => [
      ...prev,
      {
        _id: `new-${Date.now()}`,
        accountId: unusedAccount?.id ?? accounts[0]?.id ?? "",
        type: "PERCENTAGE",
        value: "",
      },
    ]);
  }, [accounts, drafts]);

  const removeRow = useCallback((index: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback(
    (index: number, patch: Partial<SplitEditorDraft>) => {
      setDrafts((prev) =>
        prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
      );
    },
    []
  );

  async function handleSave() {
    setError("");
    if (isOverPct) {
      setError("Percentage splits exceed 100%");
      return;
    }
    if (isOverFixed) {
      setError(
        `Fixed splits exceed income amount of ${formatCurrency(incomeAmount, currency)}`
      );
      return;
    }

    setSaving(true);

    const res = await fetch(`/api/income/${income.id}/splits`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        splits: drafts
          .filter((d) => d.accountId && d.value && parseFloat(d.value) > 0)
          .map((d) => ({
            accountId: d.accountId,
            type: d.type,
            value: parseFloat(d.value),
          })),
      }),
    });

    let rawData: unknown;
    try {
      rawData = await res.json();
    } catch {
      setSaving(false);
      setError("Server error: invalid response");
      return;
    }
    setSaving(false);

    if (!res.ok) {
      const errSchema = z.object({ error: z.string() });
      const errResult = errSchema.safeParse(rawData);
      setError(errResult.success ? errResult.data.error : "Failed to save splits");
      return;
    }

    const parsed = updateSplitsResponseSchema.safeParse(rawData);
    if (!parsed.success) {
      setError("Unexpected response from server");
      return;
    }

    onSaved(parsed.data);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
          Split rules
        </h3>
        <div className="flex items-center gap-3 text-xs text-subtle">
          {drafts.some((d) => d.type === "PERCENTAGE") && (
            <span className={isOverPct ? "text-error font-medium" : ""}>
              {remainingPct.toFixed(1)}% remaining
            </span>
          )}
          {drafts.some((d) => d.type === "FIXED") && (
            <span className={isOverFixed ? "text-error font-medium" : ""}>
              {formatCurrency(remainingFixed, currency)} remaining
            </span>
          )}
        </div>
      </div>

      {drafts.length === 0 ? (
        <p className="text-sm text-subtle mb-3">
          No splits configured — all income is unallocated
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {drafts.map((draft, i) => {
            const parsedValue = parseFloat(draft.value) || 0;
            const dollarEquiv =
              draft.type === "PERCENTAGE"
                ? (incomeAmount * parsedValue) / 100
                : parsedValue;
            const pctEquiv =
              draft.type === "FIXED" && incomeAmount > 0
                ? (parsedValue / incomeAmount) * 100
                : null;

            return (
              <div key={draft._id} className="flex items-center gap-2">
                <select
                  value={draft.accountId}
                  onChange={(e) =>
                    updateRow(i, { accountId: e.target.value })
                  }
                  className="flex-1 border border-edge-strong rounded-lg px-3 py-2 text-sm bg-input-bg text-input-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({ACCOUNT_CATEGORY_LABELS[a.category]})
                    </option>
                  ))}
                </select>

                <div className="flex border border-edge-strong rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateRow(i, { type: "PERCENTAGE" })}
                    className={`px-2.5 py-2 text-xs font-medium transition-colors ${
                      draft.type === "PERCENTAGE"
                        ? "bg-accent text-on-accent"
                        : "text-muted hover:bg-surface"
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRow(i, { type: "FIXED" })}
                    className={`px-2.5 py-2 text-xs font-medium transition-colors ${
                      draft.type === "FIXED"
                        ? "bg-accent text-on-accent"
                        : "text-muted hover:bg-surface"
                    }`}
                  >
                    $
                  </button>
                </div>

                <div className="relative w-24">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={draft.type === "PERCENTAGE" ? "100" : undefined}
                    value={draft.value}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                    placeholder={draft.type === "PERCENTAGE" ? "0" : "0.00"}
                    className="w-full border border-edge-strong rounded-lg pl-3 pr-6 py-2 text-sm bg-input-bg text-input-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-right"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-subtle pointer-events-none select-none">
                    {draft.type === "PERCENTAGE" ? "%" : "$"}
                  </span>
                </div>

                {draft.value && parsedValue > 0 && (
                  <span className="text-xs text-subtle whitespace-nowrap min-w-[80px]">
                    {draft.type === "PERCENTAGE"
                      ? formatCurrency(dollarEquiv, currency)
                      : `${pctEquiv?.toFixed(1)}%`}
                  </span>
                )}

                <button
                  onClick={() => removeRow(i)}
                  className="text-subtle hover:text-error transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-error text-xs mb-3 bg-error-soft border border-error-border rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        {accounts.length > drafts.length && (
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-on-surface transition-colors"
          >
            <Plus size={12} />
            Add account
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || isOverPct || isOverFixed}
          className="ml-auto bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent rounded-lg px-4 py-2 text-xs font-medium transition-colors"
        >
          {saving ? "Saving..." : "Save splits"}
        </button>
      </div>
    </div>
  );
}
