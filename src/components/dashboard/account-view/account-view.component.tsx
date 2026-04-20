"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, Minus, TrendingUp, TrendingDown } from "lucide-react";
import MaskedValue from "@/components/ui/masked-value";
import { BalanceChart } from "@/components/balance-chart";
import { ACCOUNT_CATEGORY_LABELS } from "@/lib/utils";
import { formatCurrency } from "@/lib/currencies";
import { ORACLE_HORIZONS } from "@/lib/constants/oracle.constants";
import { CRYPTO_TIME_RANGES } from "@/lib/constants/crypto.constants";
import { ROUTES } from "@/lib/constants/routes.constants";
import {
  CHART_COLOR_BALANCE,
  CHART_COLOR_PROJECTION,
  CHART_GRADIENT,
} from "@/lib/constants/chart.constants";
import { getCurrentBalance } from "../dashboard-client/dashboard-client.utils";
import { calcTradePnl } from "../../accounts/account-detail-client/account-detail-client.utils";
import type { AccountViewProps } from "./account-view.types";
import type { DashboardTrade } from "../dashboard-client/dashboard-client.types";

export function AccountView({
  selectedAccount,
  currency,
  oracleOn,
  accOracleActive,
  horizon,
  onHorizonChange,
  chartData,
  transactionsOpen,
  onTransactionsToggle,
  liveValue,
  livePricePerCoin,
  isCrypto,
  cryptoTimeRange,
  onCryptoTimeRangeChange,
  cryptoChartLoading,
}: AccountViewProps) {
  const displayBalance = liveValue ?? getCurrentBalance(selectedAccount);
  const trades = selectedAccount.trades ?? [];
  const pnl = isCrypto ? calcTradePnl(trades, livePricePerCoin ?? null) : null;

  return (
    <div className="space-y-4">
      {/* Chart card */}
      <div className="bg-surface-raised border-edge rounded-xl border">
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="flex h-9 items-center gap-1">
            {selectedAccount.name}{" "}
            <span className="text-muted">
              / {ACCOUNT_CATEGORY_LABELS[selectedAccount.category]}
            </span>
          </p>
          {isCrypto && onCryptoTimeRangeChange && cryptoTimeRange ? (
            <div className="bg-surface border-edge flex h-9 items-center gap-1 rounded-lg border p-1">
              {cryptoChartLoading && <span className="text-muted mr-1 text-xs">Loading...</span>}
              {CRYPTO_TIME_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => onCryptoTimeRangeChange(r)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    cryptoTimeRange === r
                      ? "bg-accent text-on-accent"
                      : "text-muted hover:text-on-surface"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          ) : oracleOn && selectedAccount.oracleEnabled ? (
            <div className="bg-surface border-edge flex h-9 items-center gap-1 rounded-lg border p-1">
              {ORACLE_HORIZONS.map((h) => (
                <button
                  key={h}
                  onClick={() => onHorizonChange(h)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    horizon === h ? "bg-accent text-on-accent" : "text-muted hover:text-on-surface"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2 px-4">
          <div className="text-2xl font-bold">
            <MaskedValue amount={displayBalance} currency={currency} />
          </div>
        </div>
        <BalanceChart
          data={chartData}
          series={[
            {
              dataKey: "value",
              color: CHART_COLOR_BALANCE,
              gradientId: "dashGradBalance",
              gradientOpacity: CHART_GRADIENT.BALANCE,
            },
            ...(accOracleActive
              ? [
                  {
                    dataKey: "proj",
                    color: CHART_COLOR_PROJECTION,
                    gradientId: "dashGradAccOracle",
                    gradientOpacity: CHART_GRADIENT.PROJECTION,
                    strokeDasharray: "6 3",
                    connectNulls: false,
                    isAnimationActive: false,
                  },
                ]
              : []),
          ]}
          tooltipContent={(pt) => {
            const isProjected = pt.proj != null && pt.value == null;
            const label = pt.isLive ? "Live price" : isProjected ? "Projected" : "Balance";
            const color = pt.isLive
              ? "var(--positive)"
              : isProjected
                ? CHART_COLOR_PROJECTION
                : CHART_COLOR_BALANCE;
            const val = pt.proj ?? pt.value ?? 0;
            return (
              <div className="bg-surface-raised border-edge pointer-events-none rounded-xl border px-4 py-3 text-xs shadow-lg">
                <p className="text-muted mb-1.5">{pt.date}</p>
                <p className="text-on-surface font-semibold">
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}: {formatCurrency(val, currency)}
                </p>
              </div>
            );
          }}
        />
      </div>

      {/* P&L summary row for crypto */}
      {isCrypto && pnl && trades.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Holdings",
              value: `${pnl.holdings.toFixed(8).replace(/\.?0+$/, "")} ${selectedAccount.coinSymbol ?? ""}`,
              color: "text-on-surface",
            },
            {
              label: "Avg cost",
              value: formatCurrency(pnl.avgCostPerCoin, currency),
              color: "text-on-surface",
            },
            {
              label: "Unrealized P&L",
              value:
                pnl.unrealizedPnl !== null
                  ? `${pnl.unrealizedPnl >= 0 ? "+" : ""}${formatCurrency(pnl.unrealizedPnl, currency)}`
                  : "—",
              color:
                pnl.unrealizedPnl !== null
                  ? pnl.unrealizedPnl >= 0
                    ? "text-positive"
                    : "text-error"
                  : "text-muted",
            },
            {
              label: "Realized P&L",
              value: `${pnl.realizedPnl >= 0 ? "+" : ""}${formatCurrency(pnl.realizedPnl, currency)}`,
              color: pnl.realizedPnl >= 0 ? "text-positive" : "text-error",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface-raised border-edge rounded-xl border p-3">
              <p className="text-muted mb-0.5 text-xs">{label}</p>
              <p className={`text-sm font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trades (crypto) / Transactions (non-crypto) */}
      <div className="bg-surface-raised border-edge overflow-hidden rounded-xl border">
        <button
          onClick={onTransactionsToggle}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
          aria-expanded={transactionsOpen}
        >
          <span className="text-on-surface text-sm font-medium">
            {isCrypto ? "Trades" : "Transactions"}
          </span>
          {transactionsOpen ? (
            <ChevronDown size={16} className="text-subtle" />
          ) : (
            <ChevronRight size={16} className="text-subtle" />
          )}
        </button>

        {transactionsOpen && (
          <div className="border-edge border-t">
            {isCrypto ? (
              trades.length === 0 ? (
                <p className="text-subtle px-4 py-4 text-sm">
                  No trades yet — record your first trade in{" "}
                  <Link
                    href={ROUTES.ACCOUNT_DETAIL(selectedAccount.id)}
                    className="text-accent hover:underline"
                  >
                    Manage account
                  </Link>
                </p>
              ) : (
                <div className="divide-edge divide-y">
                  {[...trades]
                    .reverse()
                    .slice(0, 8)
                    .map((trade: DashboardTrade) => {
                      const qty = parseFloat(trade.quantity);
                      const price = parseFloat(trade.price);
                      const total = qty * price;
                      return (
                        <div key={trade.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-md p-2 text-xs font-semibold ${
                                trade.type === "BUY"
                                  ? "bg-positive-soft text-positive"
                                  : "bg-error-soft text-error"
                              }`}
                            >
                              {trade.type === "BUY" ? <Plus size={10} /> : <Minus size={10} />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-on-surface text-sm tabular-nums">
                                {qty.toFixed(8).replace(/\.?0+$/, "")}{" "}
                                {selectedAccount.coinSymbol ?? ""}
                                <span className="text-muted mx-1">@</span>
                                {formatCurrency(price, currency)}
                              </p>
                              {trade.note && (
                                <p className="text-subtle truncate text-xs">{trade.note}</p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 shrink-0 text-right">
                            <p
                              className={`text-sm font-semibold tabular-nums ${
                                trade.type === "BUY" ? "text-error" : "text-positive"
                              }`}
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
                        </div>
                      );
                    })}
                  {trades.length > 8 && (
                    <div className="px-4 py-3">
                      <Link
                        href={ROUTES.ACCOUNT_DETAIL(selectedAccount.id)}
                        className="text-accent text-xs hover:underline"
                      >
                        View all {trades.length} trades in Manage account
                      </Link>
                    </div>
                  )}
                </div>
              )
            ) : (
              selectedAccount.balanceEntries.length === 0 ? (
                <p className="text-subtle px-4 py-4 text-sm">
                  No balance entries yet — update the balance in{" "}
                  <Link
                    href={ROUTES.ACCOUNT_DETAIL(selectedAccount.id)}
                    className="text-accent hover:underline"
                  >
                    Manage account
                  </Link>
                </p>
              ) : (
                <div className="divide-edge divide-y">
                  {[...selectedAccount.balanceEntries]
                    .slice(-8)
                    .reverse()
                    .map((entry, i, arr) => {
                      const prev = arr[i + 1];
                      const current = Number(entry.balance);
                      const delta = prev !== undefined ? current - Number(prev.balance) : null;
                      const up = delta !== null && delta > 0;
                      const down = delta !== null && delta < 0;
                      return (
                        <div key={entry.id} className="flex items-center justify-between px-4 py-3">
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
                                {delta !== null && (
                                  <span className={`mr-1.5 ${up ? "text-positive" : down ? "text-error" : "text-muted"}`}>
                                    {up ? "+" : ""}{formatCurrency(delta, currency)}
                                  </span>
                                )}
                              </p>
                              {entry.note && (
                                <p className="text-subtle truncate text-xs">{entry.note}</p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 shrink-0 text-right">
                            <p className="text-on-surface text-sm font-semibold tabular-nums">
                              <MaskedValue amount={current} currency={currency} />
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
                  {selectedAccount.balanceEntries.length > 8 && (
                    <div className="px-4 py-3">
                      <Link
                        href={ROUTES.ACCOUNT_DETAIL(selectedAccount.id)}
                        className="text-accent text-xs hover:underline"
                      >
                        View all {selectedAccount.balanceEntries.length} entries in Manage account
                      </Link>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
