"use client";

import { useMemo } from "react";
import { HORIZON_MONTHS, projectBalance } from "@/lib/oracle";
import { formatCurrency } from "@/lib/currencies";
import { ORACLE_HORIZONS } from "@/lib/constants/oracle.constants";
import { CHART_COLOR_BALANCE, CHART_GRADIENT } from "@/lib/constants/chart.constants";
import { BalanceChart } from "@/components/balance-chart";
import type { OraclePanelProps } from "./oracle-panel.types";

type ProjectionInput = Parameters<typeof projectBalance>[2];

export function OraclePanel({ accounts, horizon, onHorizonChange, currency }: OraclePanelProps) {
  const oracleAccounts = accounts.filter((a) => a.oracleEnabled);

  const chartData = useMemo(() => {
    if (oracleAccounts.length === 0) return [];
    const months = HORIZON_MONTHS[horizon];
    const byMonth = new Map<string, number>();

    for (const account of oracleAccounts) {
      const currentBalance =
        account.balanceEntries.length > 0
          ? Number(account.balanceEntries[account.balanceEntries.length - 1].balance)
          : 0;
      const splits: ProjectionInput = account.splits.map((s) => ({
        type: s.type,
        value: Number(s.value),
        income: { amount: Number(s.income.amount), cycle: s.income.cycle },
      }));
      const projected = projectBalance(currentBalance, account.annualGrowthRate, splits, months);
      for (const point of projected) {
        byMonth.set(point.date, (byMonth.get(point.date) ?? 0) + point.balance);
      }
    }

    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, balance], idx) => ({
        idx,
        date: new Date(date + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        value: Math.round(balance * 100) / 100,
      }));
  }, [oracleAccounts, horizon]);

  if (oracleAccounts.length === 0) {
    return (
      <div className="bg-surface-raised border-edge text-muted rounded-xl border px-6 py-5 text-sm">
        No accounts enabled for Oracle projections.
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border-edge rounded-xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted text-xs tracking-wide uppercase">Oracle Projection</p>
        <div className="bg-surface border-edge flex items-center gap-1 rounded-lg border p-1">
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
      </div>
      <BalanceChart
        data={chartData}
        series={[
          {
            dataKey: "value",
            color: CHART_COLOR_BALANCE,
            gradientId: "oracleGrad",
            gradientOpacity: CHART_GRADIENT.BALANCE,
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
              Projected: {formatCurrency(pt.value ?? 0, currency)}
            </p>
          </div>
        )}
      />
    </div>
  );
}
