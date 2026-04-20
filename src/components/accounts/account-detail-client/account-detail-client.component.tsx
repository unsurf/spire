"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BalanceChart } from "@/components/balance-chart";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  Check,
  X,
  Minus,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import {
  ACCOUNT_CATEGORY_LABELS,
  CATEGORY_COLORS,
  PAY_CYCLE_LABELS,
  isProjectableCategory,
} from "@/lib/utils";
import { CHART_COLOR_BALANCE, CHART_GRADIENT } from "@/lib/constants/chart.constants";
import { ROUTES } from "@/lib/constants/routes.constants";
import MaskedValue from "@/components/ui/masked-value";
import { z } from "zod";
import type { AccountDetailClientProps, AccountDetailTrade } from "./account-detail-client.types";
import { buildHistoryData, getAccountDelta, calcTradePnl } from "./account-detail-client.utils";

const priceSchema = z.record(z.string(), z.number());

const tradeResponseSchema = z.object({
  id: z.string(),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.coerce.string(),
  price: z.coerce.string(),
  tradedAt: z.string(),
  note: z.string().nullable(),
  coinQuantity: z.coerce.string(),
});

const TODAY = new Date().toISOString().slice(0, 10);

export default function AccountDetailClientComponent({
  account: initial,
  currency,
}: AccountDetailClientProps) {
  const router = useRouter();
  const [account, setAccount] = useState(initial);

  const isCrypto = account.category === "CRYPTO";
  const isProjectable = isProjectableCategory(account.category);

  // Live price for crypto P&L
  const [livePrice, setLivePrice] = useState<number | null>(null);
  useEffect(() => {
    if (!isCrypto || !account.coinId) return;
    fetch(`/api/prices/crypto?ids=${encodeURIComponent(account.coinId)}&currency=${currency}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const parsed = priceSchema.safeParse(data);
        if (parsed.success && account.coinId) {
          setLivePrice(parsed.data[account.coinId] ?? null);
        }
      })
      .catch(() => {});
  }, [isCrypto, account.coinId, currency]);

  // Auto-heal missing coinSymbol for accounts created before the field was saved
  useEffect(() => {
    if (!isCrypto || !account.coinId || account.coinSymbol) return;
    fetch(`/api/coins/info?id=${encodeURIComponent(account.coinId)}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const parsed = z.object({ symbol: z.string() }).safeParse(data);
        if (!parsed.success) return;
        const symbol = parsed.data.symbol;
        setAccount((prev) => ({ ...prev, coinSymbol: symbol }));
        fetch(`/api/accounts/${account.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coinSymbol: symbol }),
        }).catch(() => {});
      })
      .catch(() => {});
  }, [isCrypto, account.coinId, account.coinSymbol, account.id]);

  // Trades state
  const [trades, setTrades] = useState<AccountDetailTrade[]>(account.trades);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [tradeQty, setTradeQty] = useState("");
  const [tradePrice, setTradePrice] = useState("");
  const [tradeDate, setTradeDate] = useState(TODAY);
  const [tradeNote, setTradeNote] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState("");

  // Balance form (non-crypto)
  const [newBalance, setNewBalance] = useState("");
  const [note, setNote] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [oracleOn, setOracleOn] = useState(account.oracleEnabled);
  const [growthRate, setGrowthRate] = useState(
    account.annualGrowthRate !== null ? String(account.annualGrowthRate) : "",
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(account.name);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { currentBalance, delta } = useMemo(() => getAccountDelta(account), [account]);
  const historyData = useMemo(() => buildHistoryData(account), [account]);
  const pnl = useMemo(() => calcTradePnl(trades, livePrice), [trades, livePrice]);

  const handleAddTrade = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setTradeError("");
      setTradeLoading(true);

      const res = await fetch(`/api/accounts/${account.id}/trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tradeType,
          quantity: parseFloat(tradeQty),
          price: parseFloat(tradePrice),
          tradedAt: tradeDate,
          note: tradeNote || null,
        }),
      });

      const raw = await res.text();
      let rawData: unknown = null;
      try {
        rawData = JSON.parse(raw);
      } catch {}
      setTradeLoading(false);

      if (!res.ok) {
        const errSchema = z.object({ error: z.unknown() });
        const errResult = errSchema.safeParse(rawData);
        setTradeError(errResult.success ? String(errResult.data.error) : "Failed to save trade");
        return;
      }

      const parsed = tradeResponseSchema.safeParse(rawData);
      if (!parsed.success) {
        setTradeError("Unexpected response");
        return;
      }

      const newTrade: AccountDetailTrade = {
        id: parsed.data.id,
        type: parsed.data.type,
        quantity: parsed.data.quantity,
        price: parsed.data.price,
        tradedAt: parsed.data.tradedAt,
        note: parsed.data.note,
      };
      setTrades((prev) =>
        [...prev, newTrade].sort(
          (a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime(),
        ),
      );
      setAccount((prev) => ({ ...prev, coinQuantity: parsed.data.coinQuantity }));
      setTradeQty("");
      setTradePrice("");
      setTradeNote("");
    },
    [account.id, tradeType, tradeQty, tradePrice, tradeDate, tradeNote],
  );

  const handleDeleteTrade = useCallback(
    async (tradeId: string) => {
      const res = await fetch(`/api/accounts/${account.id}/trades/${tradeId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      const data = z.object({ coinQuantity: z.coerce.string() }).safeParse(await res.json());
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
      if (data.success) setAccount((prev) => ({ ...prev, coinQuantity: data.data.coinQuantity }));
    },
    [account.id],
  );

  const handleUpdateBalance = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBalanceLoading(true);
      const res = await fetch(`/api/accounts/${account.id}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: Number(newBalance), note: note || null }),
      });
      if (res.ok) {
        const entry = await res.json();
        setAccount((prev) => ({ ...prev, balanceEntries: [...prev.balanceEntries, entry] }));
        setNewBalance("");
        setNote("");
      }
      setBalanceLoading(false);
    },
    [account.id, newBalance, note],
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
    const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(ROUTES.DASHBOARD);
      router.refresh();
    }
  }, [account.id, router]);

  const inputClassName =
    "w-full border border-edge-strong rounded-lg px-3.5 py-2.5 bg-input-bg text-input-text placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm";

  const pnlColor = (val: number) => (val >= 0 ? "text-positive" : "text-error");
  const pnlSign = (val: number) => (val >= 0 ? "+" : "");

  return (
    <div className="max-w-4xl p-8">
      <Link
        href={ROUTES.DASHBOARD_ACCOUNT(account.id)}
        className="text-muted hover:text-on-surface mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft size={14} />
        Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="text-on-surface bg-input-bg border-edge-strong focus:border-accent rounded-lg border px-3 py-1 text-2xl font-bold focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-accent text-on-accent hover:bg-accent-strong rounded-lg p-1.5 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameDraft(account.name);
                  }}
                  className="border-edge-strong text-muted hover:text-on-surface rounded-lg border p-1.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-on-surface text-2xl font-bold">{account.name}</h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-subtle hover:text-on-surface rounded-md p-1 transition-colors"
                >
                  <Pencil size={13} />
                </button>
              </>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[account.category]}`}
            >
              {ACCOUNT_CATEGORY_LABELS[account.category]}
            </span>
          </div>

          {isCrypto ? (
            <div className="flex items-center gap-3">
              <p className="text-on-surface text-3xl font-bold">
                {pnl.currentValue !== null ? (
                  <MaskedValue amount={pnl.currentValue} currency={currency} />
                ) : (
                  <span className="text-subtle text-xl">No price data</span>
                )}
              </p>
              {pnl.unrealizedPnl !== null && (
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${pnlColor(pnl.unrealizedPnl)}`}
                >
                  {pnl.unrealizedPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {pnlSign(pnl.unrealizedPnl)}
                  <MaskedValue amount={pnl.unrealizedPnl} currency={currency} />
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-on-surface text-3xl font-bold">
                <MaskedValue amount={currentBalance} currency={currency} />
              </p>
              {delta !== null && (
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${delta >= 0 ? "text-positive" : "text-error"}`}
                >
                  {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {delta >= 0 ? "+" : ""}
                  <MaskedValue amount={delta} currency={currency} />
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="text-subtle hover:text-error transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {deleteConfirm && (
        <div className="bg-error-soft border-error-border mb-6 flex items-center justify-between rounded-xl border p-4">
          <p className="text-error text-sm font-medium">Delete this account and all its history?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteConfirm(false)}
              className="border-edge-strong text-muted hover:bg-surface rounded-lg border px-3 py-1.5 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-error-strong text-on-error rounded-lg px-3 py-1.5 text-sm hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {isCrypto ? (
        /* ── CRYPTO: P&L summary + trades ── */
        <div className="space-y-6">
          {/* P&L summary */}
          {trades.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  label: "Holdings",
                  value: `${pnl.holdings.toFixed(8).replace(/\.?0+$/, "")} ${account.coinSymbol ?? ""}`,
                },
                { label: "Avg cost", value: formatCurrency(pnl.avgCostPerCoin, currency) },
                {
                  label: "Unrealized P&L",
                  value:
                    pnl.unrealizedPnl !== null
                      ? `${pnlSign(pnl.unrealizedPnl)}${formatCurrency(pnl.unrealizedPnl, currency)}`
                      : "—",
                  color: pnl.unrealizedPnl !== null ? pnlColor(pnl.unrealizedPnl) : "text-muted",
                },
                {
                  label: "Realized P&L",
                  value: `${pnlSign(pnl.realizedPnl)}${formatCurrency(pnl.realizedPnl, currency)}`,
                  color: pnlColor(pnl.realizedPnl),
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-raised border-edge rounded-xl border p-4">
                  <p className="text-muted mb-1 text-xs font-medium">{label}</p>
                  <p className={`text-sm font-semibold ${color ?? "text-on-surface"}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add trade form */}
          <div className="bg-surface-raised border-edge rounded-xl border p-6">
            <h2 className="text-muted mb-4 text-sm font-semibold">Record trade</h2>
            <form onSubmit={handleAddTrade} className="space-y-4">
              {/* Buy / Sell toggle */}
              <div className="border-edge-strong flex w-fit overflow-hidden rounded-lg border">
                {(["BUY", "SELL"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTradeType(t)}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${
                      tradeType === t
                        ? t === "BUY"
                          ? "bg-positive text-white"
                          : "bg-error text-on-error"
                        : "text-muted hover:bg-surface"
                    }`}
                  >
                    {t === "BUY" ? (
                      <span className="flex items-center gap-1.5">
                        <ArrowDownCircle size={14} />
                        Buy
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <ArrowUpCircle size={14} />
                        Sell
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-muted mb-1 block text-xs font-medium">
                    Quantity{account.coinSymbol ? ` (${account.coinSymbol})` : ""}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(e.target.value)}
                    required
                    placeholder="0.00000000"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="text-muted mb-1 block text-xs font-medium">
                    Price per coin ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    required
                    placeholder="0.00"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="text-muted mb-1 block text-xs font-medium">Date</label>
                  <input
                    type="date"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="text-muted mb-1 block text-xs font-medium">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={tradeNote}
                    onChange={(e) => setTradeNote(e.target.value)}
                    placeholder="e.g. Dollar cost average"
                    className={inputClassName}
                  />
                </div>
              </div>

              {tradePrice && tradeQty && (
                <p className="text-muted text-xs">
                  Total:{" "}
                  <span className="text-on-surface font-semibold">
                    {formatCurrency(parseFloat(tradePrice) * parseFloat(tradeQty), currency)}
                  </span>
                </p>
              )}

              {tradeError && (
                <p className="text-error bg-error-soft border-error-border rounded-lg border px-3 py-2 text-sm">
                  {tradeError}
                </p>
              )}

              <button
                type="submit"
                disabled={tradeLoading}
                className="bg-accent hover:bg-accent-strong text-on-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {tradeLoading ? "Saving..." : "Record trade"}
              </button>
            </form>
          </div>

          {/* Trade history */}
          {trades.length > 0 && (
            <div className="bg-surface-raised border-edge overflow-hidden rounded-xl border">
              <div className="border-edge border-b px-5 py-3.5">
                <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                  Trade history
                </p>
              </div>
              <div className="divide-edge divide-y">
                {[...trades].reverse().map((trade) => {
                  const qty = parseFloat(trade.quantity);
                  const price = parseFloat(trade.price);
                  const total = qty * price;
                  return (
                    <div key={trade.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            trade.type === "BUY"
                              ? "bg-positive-soft text-positive"
                              : "bg-error-soft text-error"
                          }`}
                        >
                          {trade.type === "BUY" ? (
                            <ArrowDownCircle size={10} />
                          ) : (
                            <ArrowUpCircle size={10} />
                          )}
                          {trade.type}
                        </span>
                        <div className="min-w-0">
                          <p className="text-on-surface text-sm tabular-nums">
                            {qty.toFixed(8).replace(/\.?0+$/, "")} {account.coinSymbol ?? ""}
                            <span className="text-muted mx-1.5">@</span>
                            {formatCurrency(price, currency)}
                          </p>
                          {trade.note && (
                            <p className="text-subtle truncate text-xs">{trade.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold tabular-nums ${trade.type === "BUY" ? "text-error" : "text-positive"}`}
                          >
                            {trade.type === "BUY" ? "-" : "+"}
                            {formatCurrency(total, currency)}
                          </p>
                          <p className="text-subtle text-xs">
                            {new Date(trade.tradedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "2-digit",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="text-subtle hover:text-error p-1 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {trades.length === 0 && (
            <div className="text-subtle bg-surface-raised border-edge rounded-xl border py-10 text-center text-sm">
              No trades recorded yet — add your first trade above
            </div>
          )}
        </div>
      ) : (
        /* ── NON-CRYPTO: balance chart + update form ── */
        <>
          <div className="bg-surface-raised border-edge mb-6 rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-muted text-sm font-semibold">Balance History</h2>
            </div>
            {historyData.length <= 1 ? (
              <div className="text-subtle flex h-64 items-center justify-center text-sm">
                No history yet — update the balance to start tracking
              </div>
            ) : (
              <BalanceChart
                data={historyData}
                height={280}
                series={[
                  {
                    dataKey: "value",
                    color: CHART_COLOR_BALANCE,
                    gradientId: "gradBalance",
                    gradientOpacity: CHART_GRADIENT.BALANCE,
                    strokeWidth: 2.5,
                  },
                ]}
                tooltipContent={(pt) => (
                  <div className="bg-surface-raised border-edge pointer-events-none rounded-xl border px-4 py-3 text-xs shadow-lg">
                    <p className="text-muted mb-1.5">{pt.date}</p>
                    <p className="text-on-surface font-semibold">
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHART_COLOR_BALANCE }}
                      />
                      Balance: {formatCurrency(pt.value ?? 0, currency)}
                    </p>
                  </div>
                )}
              />
            )}
          </div>

          {account.balanceEntries.length > 0 && (
            <div className="bg-surface-raised border-edge mb-6 overflow-hidden rounded-xl border">
              <div className="border-edge border-b px-5 py-3.5">
                <p className="text-muted text-xs font-semibold uppercase tracking-wide">
                  Balance entries
                </p>
              </div>
              <div className="divide-edge divide-y">
                {[...account.balanceEntries].reverse().map((entry, i, arr) => {
                  const prev = arr[i + 1];
                  const current = Number(entry.balance);
                  const delta = prev !== undefined ? current - Number(prev.balance) : null;
                  const up = delta !== null && delta > 0;
                  const down = delta !== null && delta < 0;
                  return (
                    <div key={entry.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`inline-flex shrink-0 items-center rounded-md p-2 ${
                            up
                              ? "bg-positive-soft text-positive"
                              : down
                                ? "bg-error-soft text-error"
                                : "bg-edge text-muted"
                          }`}
                        >
                          {up ? (
                            <TrendingUp size={10} />
                          ) : down ? (
                            <TrendingDown size={10} />
                          ) : (
                            <Minus size={10} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-on-surface text-sm tabular-nums">
                            {delta !== null ? (
                              <span className={up ? "text-positive" : down ? "text-error" : "text-muted"}>
                                {up ? "+" : ""}{formatCurrency(delta, currency)}
                              </span>
                            ) : (
                              <span className="text-muted text-xs">Initial entry</span>
                            )}
                          </p>
                          {entry.note && (
                            <p className="text-subtle truncate text-xs">{entry.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-on-surface text-sm font-semibold tabular-nums">
                          {formatCurrency(current, currency)}
                        </p>
                        <p className="text-subtle text-xs">
                          {new Date(entry.recordedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-surface-raised border-edge rounded-xl border p-6">
              <h2 className="text-muted mb-4 text-sm font-semibold">Update Balance</h2>
              <form onSubmit={handleUpdateBalance} className="space-y-3">
                <div>
                  <label className="text-muted mb-1 block text-xs font-medium">New balance</label>
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
                  <label className="text-muted mb-1 block text-xs font-medium">
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
                  className="bg-accent hover:bg-accent-strong text-on-accent w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {balanceLoading ? "Saving..." : "Save balance"}
                </button>
              </form>
            </div>

            <div className="bg-surface-raised border-edge rounded-xl border p-6">
              <h2 className="text-muted mb-4 text-sm font-semibold">Account Settings</h2>
              <div className="space-y-4">
                {isProjectable && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-on-surface text-sm font-medium">Oracle projections</p>
                        <p className="text-muted mt-0.5 text-xs">Include in projection dashboard</p>
                      </div>
                      <button
                        onClick={() => setOracleOn((v) => !v)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${oracleOn ? "bg-accent" : "bg-edge-strong"}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${oracleOn ? "translate-x-4.5" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>
                    <div>
                      <label className="text-muted mb-1 block text-xs font-medium">
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
                      <p className="text-subtle mt-1 text-xs">
                        Leave blank for contribution-only projection
                      </p>
                    </div>
                  </>
                )}
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-accent hover:bg-accent-strong text-on-accent w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : "Save settings"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {account.splits.length > 0 && (
        <div className="bg-surface-raised border-edge mt-6 rounded-xl border p-6">
          <h2 className="text-muted mb-4 text-sm font-semibold">Income Splits</h2>
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
                  className="border-edge flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div>
                    <p className="text-on-surface text-sm font-medium">{split.income.name}</p>
                    <p className="text-muted text-xs">{PAY_CYCLE_LABELS[split.income.cycle]}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-accent text-sm font-semibold">
                      {formatCurrency(dollarValue, currency)}
                    </span>
                    {split.type === "PERCENTAGE" && (
                      <span className="text-subtle ml-2 text-xs">({split.value}%)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-subtle mt-3 text-xs">
            Manage splits on the{" "}
            <Link href={ROUTES.INCOME} className="text-accent hover:underline">
              Income page
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
