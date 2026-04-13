"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import {
  ACCOUNT_CATEGORY_LABELS,
  CATEGORY_COLORS,
  PAY_CYCLE_LABELS,
} from "@/lib/utils";
import {
  CHART_COLOR_BALANCE,
  CHART_GRADIENT,
} from "@/lib/constants/chart.constants";
import { ROUTES } from "@/lib/constants/routes.constants";
import MaskedValue from "@/components/ui/masked-value";
import type { AccountDetailClientProps } from "./account-detail-client.types";
import {
  buildHistoryData,
  getAccountDelta,
} from "./account-detail-client.utils";

export default function AccountDetailClientComponent({
  account: initial,
  currency,
}: AccountDetailClientProps) {
  const router = useRouter();
  const [account, setAccount] = useState(initial);

  const [newBalance, setNewBalance] = useState("");
  const [note, setNote] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [oracleOn, setOracleOn] = useState(account.oracleEnabled);
  const [growthRate, setGrowthRate] = useState(
    account.annualGrowthRate !== null ? String(account.annualGrowthRate) : ""
  );
  const [savingSettings, setSavingSettings] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(account.name);

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { currentBalance, delta } = useMemo(
    () => getAccountDelta(account),
    [account]
  );
  const historyData = useMemo(
    () => buildHistoryData(account),
    [account]
  );

  const handleUpdateBalance = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBalanceLoading(true);

      const res = await fetch(`/api/accounts/${account.id}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          balance: Number(newBalance),
          note: note || null,
        }),
      });

      if (res.ok) {
        const entry = await res.json();
        setAccount((prev) => ({
          ...prev,
          balanceEntries: [...prev.balanceEntries, entry],
        }));
        setNewBalance("");
        setNote("");
      }

      setBalanceLoading(false);
    },
    [account.id, newBalance, note]
  );

  const handleSaveSettings = useCallback(async () => {
    setSavingSettings(true);

    const res = await fetch(`/api/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameDraft,
        oracleEnabled: oracleOn,
        annualGrowthRate: growthRate !== "" ? Number(growthRate) : null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setAccount((prev) => ({
        ...prev,
        name: updated.name,
        oracleEnabled: updated.oracleEnabled,
        annualGrowthRate: updated.annualGrowthRate,
      }));
      setEditingName(false);
    }

    setSavingSettings(false);
  }, [account.id, nameDraft, oracleOn, growthRate]);

  const handleDelete = useCallback(async () => {
    const res = await fetch(`/api/accounts/${account.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push(ROUTES.DASHBOARD);
      router.refresh();
    }
  }, [account.id, router]);

  const inputClassName =
    "w-full border border-edge-strong rounded-lg px-3.5 py-2.5 bg-input-bg text-input-text placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm";

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href={ROUTES.DASHBOARD_ACCOUNT(account.id)}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-on-surface mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Dashboard
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="text-2xl font-bold text-on-surface bg-input-bg border border-edge-strong rounded-lg px-3 py-1 focus:outline-none focus:border-accent"
                  autoFocus
                />
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="p-1.5 rounded-lg bg-accent text-on-accent hover:bg-accent-strong transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameDraft(account.name);
                  }}
                  className="p-1.5 rounded-lg border border-edge-strong text-muted hover:text-on-surface transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-on-surface">
                  {account.name}
                </h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="p-1 rounded-md text-subtle hover:text-on-surface transition-colors"
                >
                  <Pencil size={13} />
                </button>
              </>
            )}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[account.category]}`}
            >
              {ACCOUNT_CATEGORY_LABELS[account.category]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-on-surface">
              <MaskedValue amount={currentBalance} currency={currency} />
            </p>
            {delta !== null && (
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  delta >= 0 ? "text-positive" : "text-error"
                }`}
              >
                {delta >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {delta >= 0 ? "+" : ""}
                <MaskedValue amount={delta} currency={currency} />
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setDeleteConfirm(true)}
          className="text-subtle hover:text-error transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {deleteConfirm && (
        <div className="mb-6 bg-error-soft border border-error-border rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-error font-medium">
            Delete this account and all its history?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteConfirm(false)}
              className="text-sm px-3 py-1.5 rounded-lg border border-edge-strong text-muted hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="text-sm px-3 py-1.5 rounded-lg bg-error-strong text-on-error hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface-raised border border-edge rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted">Balance History</h2>
        </div>

        {historyData.length <= 1 ? (
          <div className="h-64 flex items-center justify-center text-subtle text-sm">
            No history yet — update the balance to start tracking
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={historyData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLOR_BALANCE} stopOpacity={CHART_GRADIENT.BALANCE.start} />
                  <stop offset="100%" stopColor={CHART_COLOR_BALANCE} stopOpacity={CHART_GRADIENT.BALANCE.end} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="idx"
                type="number"
                domain={[0, historyData.length - 1]}
                ticks={[0, historyData.length - 1]}
                axisLine={false}
                tickLine={false}
                tick={(props) => {
                  const { x, y, index } = props as { x: number; y: number; payload: { value: number }; index: number };
                  const isFirst = index === 0;
                  const label = isFirst ? historyData[0]?.date : historyData[historyData.length - 1]?.date;
                  return <text x={x} y={y + 12} textAnchor={isFirst ? "start" : "end"} fill="var(--muted)" fontSize={11}>{label ?? ""}</text>;
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0].payload as { date: string; value: number };
                  return (
                    <div
                      className="bg-surface-raised border border-edge rounded-xl px-4 py-3 text-xs shadow-lg pointer-events-none"
                    >
                      <p className="text-muted mb-1.5">{pt.date}</p>
                      <p className="font-semibold text-on-surface">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: CHART_COLOR_BALANCE }} />
                        Balance: {formatCurrency(pt.value, currency)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLOR_BALANCE}
                strokeWidth={2.5}
                fill="url(#gradBalance)"
                dot={false}
                activeDot={{ r: 5, fill: CHART_COLOR_BALANCE, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-raised border border-edge rounded-xl p-6">
          <h2 className="text-sm font-semibold text-muted mb-4">
            Update Balance
          </h2>
          <form onSubmit={handleUpdateBalance} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                New balance
              </label>
              <input
                type="number"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                required
                placeholder="0.00"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Monthly update"
                className={inputClassName}
              />
            </div>
            <button
              type="submit"
              disabled={balanceLoading}
              className="w-full bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {balanceLoading ? "Saving..." : "Save balance"}
            </button>
          </form>
        </div>

        <div className="bg-surface-raised border border-edge rounded-xl p-6">
          <h2 className="text-sm font-semibold text-muted mb-4">
            Account Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">
                  Oracle projections
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Include in projection dashboard
                </p>
              </div>
              <button
                onClick={() => setOracleOn((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  oracleOn ? "bg-accent" : "bg-edge-strong"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    oracleOn ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Annual growth rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                placeholder="e.g. 4.5"
                className={inputClassName}
              />
              <p className="text-xs text-subtle mt-1">
                Leave blank for contribution-only projection
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {savingSettings ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      </div>

      {account.splits.length > 0 && (
        <div className="mt-6 bg-surface-raised border border-edge rounded-xl p-6">
          <h2 className="text-sm font-semibold text-muted mb-4">
            Income Splits
          </h2>
          <div className="space-y-2">
            {account.splits.map((split) => {
              const incomeAmount = Number(split.income.amount);
              const dollarValue =
                split.type === "PERCENTAGE"
                  ? (incomeAmount * Number(split.value)) / 100
                  : Number(split.value);
              return (
                <div
                  key={split.id}
                  className="flex items-center justify-between py-2 border-b border-edge last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {split.income.name}
                    </p>
                    <p className="text-xs text-muted">
                      {PAY_CYCLE_LABELS[split.income.cycle]}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-accent">
                      {formatCurrency(dollarValue, currency)}
                    </span>
                    {split.type === "PERCENTAGE" && (
                      <span className="text-xs text-subtle ml-2">
                        ({split.value}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-subtle mt-3">
            Manage splits on the{" "}
            <Link
              href={ROUTES.INCOME}
              className="text-accent hover:underline"
            >
              Income page
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
