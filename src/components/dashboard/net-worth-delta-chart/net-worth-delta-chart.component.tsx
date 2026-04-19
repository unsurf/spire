"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/currencies";
import { buildMonthlyDeltas, isMonthlyDeltaPoint } from "./net-worth-delta-chart.utils";
import type { NetWorthDeltaChartProps } from "./net-worth-delta-chart.types";

export function NetWorthDeltaChart({ netWorthData, currency }: NetWorthDeltaChartProps) {
  const data = buildMonthlyDeltas(netWorthData);

  if (data.length === 0) return null;

  return (
    <div className="bg-surface-raised border-edge rounded-xl border p-4">
      <p className="text-muted mb-4 text-xs uppercase tracking-wide">Monthly Change</p>
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <ReferenceLine y={0} stroke="var(--edge-strong)" strokeWidth={1} />
            <Tooltip
              cursor={{ fill: "var(--edge)", opacity: 0.4 }}
              wrapperStyle={{ zIndex: 50 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const pt = payload[0]?.payload;
                if (!isMonthlyDeltaPoint(pt)) return null;
                return (
                  <div className="bg-surface-raised border-edge pointer-events-none rounded-xl border px-4 py-3 text-xs shadow-lg">
                    <p className="text-muted mb-1">{pt.month}</p>
                    <p
                      className={`font-semibold ${pt.delta >= 0 ? "text-positive" : "text-error"}`}
                    >
                      {pt.delta >= 0 ? "+" : ""}
                      {formatCurrency(pt.delta, currency)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="delta" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((pt) => (
                <Cell
                  key={pt.month}
                  fill={pt.delta >= 0 ? "var(--positive)" : "var(--error)"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
