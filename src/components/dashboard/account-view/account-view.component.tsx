"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
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
import type { AccountViewProps } from "./account-view.types";

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
  onDeselect,
  liveValue,
  isCrypto,
  cryptoTimeRange,
  onCryptoTimeRangeChange,
  cryptoChartLoading,
}: AccountViewProps) {
  const displayBalance = liveValue ?? getCurrentBalance(selectedAccount);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onDeselect}
            className="text-muted hover:text-on-surface transition-colors"
          >
            Overview
          </button>
          <span className="text-subtle">/</span>
          <span className="text-on-surface font-medium">{selectedAccount.name}</span>
        </div>
        <Link
          href={ROUTES.ACCOUNT_DETAIL(selectedAccount.id)}
          className="text-accent hover:text-accent-strong flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          Manage account
          <ExternalLink size={12} />
        </Link>
      </div>

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
              {cryptoChartLoading && (
                <span className="text-muted mr-1 text-xs">Loading...</span>
              )}
              {CRYPTO_TIME_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => onCryptoTimeRangeChange(r)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    cryptoTimeRange === r ? "bg-accent text-on-accent" : "text-muted hover:text-on-surface"
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
            const color = pt.isLive ? "var(--positive)" : isProjected ? CHART_COLOR_PROJECTION : CHART_COLOR_BALANCE;
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

      <div className="bg-surface-raised border-edge overflow-hidden rounded-xl border">
        <button
          onClick={onTransactionsToggle}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
          aria-expanded={transactionsOpen}
        >
          <span className="text-on-surface text-sm font-medium">Transactions</span>
          {transactionsOpen ? (
            <ChevronDown size={16} className="text-subtle" />
          ) : (
            <ChevronRight size={16} className="text-subtle" />
          )}
        </button>
        {transactionsOpen && (
          <div className="border-edge flex flex-col gap-3 border-t p-4">
            {[...selectedAccount.balanceEntries]
              .slice(-5)
              .reverse()
              .map((entry) => (
                <div
                  key={entry.id}
                  className="border-edge flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-on-surface text-sm">
                      {new Date(entry.recordedAt).toLocaleDateString()}
                    </p>
                    <p className="text-subtle text-xs">{entry.note ?? "No note"}</p>
                  </div>
                  <p className="text-on-surface text-sm font-semibold">
                    <MaskedValue amount={Number(entry.balance)} currency={currency} />
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
