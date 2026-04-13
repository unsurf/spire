"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HORIZON_MONTHS, projectBalance } from "@/lib/oracle";
import { formatCurrency } from "@/lib/currencies";
import { ORACLE_HORIZONS } from "@/lib/constants/oracle.constants";
import {
  CHART_COLOR_BALANCE,
  CHART_GRADIENT,
} from "@/lib/constants/chart.constants";
import type { OraclePanelProps } from "./oracle-panel.types";

type ProjectionInput = Parameters<typeof projectBalance>[2];

export function OraclePanel({
  accounts,
  horizon,
  onHorizonChange,
  currency,
}: OraclePanelProps) {
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
      const projected = projectBalance(
        currentBalance,
        account.annualGrowthRate,
        splits,
        months
      );
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
      <div className="bg-surface-raised border border-edge rounded-xl px-6 py-5 text-sm text-muted">
        No accounts enabled for Oracle projections.
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-edge rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted uppercase tracking-wide">
          Oracle Projection
        </p>
        <div className="flex items-center gap-1 bg-surface border border-edge rounded-lg p-1">
          {ORACLE_HORIZONS.map((h) => (
            <button
              key={h}
              onClick={() => onHorizonChange(h)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                horizon === h
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:text-on-surface"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="oracleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={CHART_COLOR_BALANCE}
                  stopOpacity={CHART_GRADIENT.BALANCE.start}
                />
                <stop
                  offset="100%"
                  stopColor={CHART_COLOR_BALANCE}
                  stopOpacity={CHART_GRADIENT.BALANCE.end}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="idx"
              type="number"
              domain={[0, Math.max(0, chartData.length - 1)]}
              ticks={[0, chartData.length - 1]}
              axisLine={false}
              tickLine={false}
              tick={(props) => {
                const { x, y, index } = props as {
                  x: number;
                  y: number;
                  index: number;
                };
                const isFirst = index === 0;
                const label = isFirst
                  ? chartData[0]?.date
                  : chartData[chartData.length - 1]?.date;
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor={isFirst ? "start" : "end"}
                    fill="var(--muted)"
                    fontSize={11}
                  >
                    {label ?? ""}
                  </text>
                );
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const pt = payload[0].payload as { date: string; value: number };
                return (
                  <div className="bg-surface-raised border border-edge rounded-xl px-4 py-3 text-xs shadow-lg pointer-events-none">
                    <p className="text-muted mb-1.5">{pt.date}</p>
                    <p className="font-semibold text-on-surface">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: CHART_COLOR_BALANCE }}
                      />
                      Projected: {formatCurrency(pt.value, currency)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_COLOR_BALANCE}
              strokeWidth={2}
              fill="url(#oracleGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: CHART_COLOR_BALANCE,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
