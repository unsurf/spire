"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/currencies";
import { buildAccountBalanceBars, isAccountBalanceBar } from "./account-balances-chart.utils";
import { ACCOUNT_BAR_COLORS } from "./account-balances-chart.constants";
import type { AccountBalancesChartProps } from "./account-balances-chart.types";

const BAR_HEIGHT = 28;
const BAR_GAP = 8;

export function AccountBalancesChart({ accounts, currency }: AccountBalancesChartProps) {
  const bars = buildAccountBalanceBars(accounts);

  if (bars.length === 0) return null;

  const chartHeight = bars.length * (BAR_HEIGHT + BAR_GAP);

  return (
    <div className="bg-surface-raised border-edge rounded-xl border p-4">
      <p className="text-muted mb-4 text-xs uppercase tracking-wide">Accounts</p>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={bars}
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            barCategoryGap={BAR_GAP}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(name: string) =>
                name.length > 14 ? `${name.slice(0, 13)}…` : name
              }
            />
            <Tooltip
              cursor={{ fill: "var(--edge)", opacity: 0.4 }}
              wrapperStyle={{ zIndex: 50 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const bar = payload[0]?.payload;
                if (!isAccountBalanceBar(bar)) return null;
                return (
                  <div className="bg-surface-raised border-edge pointer-events-none rounded-xl border px-4 py-3 text-xs shadow-lg">
                    <p className="text-muted mb-1">{bar.name}</p>
                    <p className="text-on-surface font-semibold">
                      {formatCurrency(bar.value, currency)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {bars.map((bar) => (
                <Cell
                  key={bar.id}
                  fill={ACCOUNT_BAR_COLORS[bar.groupKey]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
