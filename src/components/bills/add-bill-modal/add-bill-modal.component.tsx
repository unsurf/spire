"use client";

import { useState } from "react";
import { z } from "zod";
import { X, Trash2 } from "lucide-react";
import { BILL_CYCLE_ENTRIES } from "../bills-client/bills-client.constants";
import { billItemResponseSchema } from "@/lib/schemas/bill-response.schema";
import type { BillCycle } from "@/generated/prisma/client";
import type { AddBillModalProps } from "./add-bill-modal.types";

const TODAY = new Date().toISOString().slice(0, 10);

const errSchema = z.object({ error: z.union([z.string(), z.record(z.string(), z.unknown())]) });

export default function AddBillModalComponent({
  accounts,
  currency,
  bill,
  onClose,
  onSaved,
  onDeleted,
}: AddBillModalProps) {
  const editing = !!bill;
  const [name, setName] = useState(bill?.name ?? "");
  const [amount, setAmount] = useState(bill?.amount ?? "");
  const [accountId, setAccountId] = useState(bill?.accountId ?? "");
  const [cycle, setCycle] = useState<BillCycle>(bill?.cycle ?? "MONTHLY");
  const [startDate, setStartDate] = useState(
    bill?.startDate ? bill.startDate.slice(0, 10) : TODAY,
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full border border-edge-strong rounded-lg px-3.5 py-2.5 bg-input-bg text-input-text placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body = {
      name,
      amount: amount !== "" ? parseFloat(amount as string) : null,
      accountId: accountId || null,
      cycle,
      startDate,
    };

    const url = editing ? `/api/bills/${bill.id}` : "/api/bills";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let rawData: unknown = null;
    try { rawData = JSON.parse(raw); } catch {}
    setSaving(false);

    if (!res.ok) {
      const parsed = errSchema.safeParse(rawData);
      setError(parsed.success ? String(parsed.data.error) : "Failed to save bill");
      return;
    }

    const parsed = billItemResponseSchema.safeParse(rawData);
    if (!parsed.success) { setError("Unexpected response"); return; }
    onSaved(parsed.data);
  }

  async function handleDelete() {
    if (!bill || !onDeleted) return;
    setDeleting(true);
    const res = await fetch(`/api/bills/${bill.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onDeleted(bill.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-raised border border-edge rounded-2xl w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-edge">
          <h2 className="text-base font-semibold text-on-surface">
            {editing ? "Edit bill" : "Add bill"}
          </h2>
          <button
            onClick={onClose}
            className="text-subtle hover:text-on-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Netflix"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Amount ({currency}) <span className="text-subtle font-normal">optional</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Recurrence</label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as BillCycle)}
                className={inputClass}
              >
                {BILL_CYCLE_ENTRIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Account <span className="text-subtle font-normal">optional</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={inputClass}
            >
              <option value="">No account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-error text-sm bg-error-soft border border-error-border rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            {editing && onDeleted ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-sm text-error hover:text-error-strong disabled:opacity-50 transition-colors"
              >
                <Trash2 size={14} />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="border border-edge-strong text-muted rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {saving ? "Saving..." : editing ? "Save changes" : "Add bill"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
