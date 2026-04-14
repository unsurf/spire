"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { BalanceChartProps, BalanceChartDataPoint } from "./balance-chart.types";

function isDataPoint(pt: unknown): pt is BalanceChartDataPoint {
  return (
    typeof pt === "object" &&
    pt !== null &&
    "idx" in pt &&
    "date" in pt &&
    typeof (pt as Record<string, unknown>).idx === "number" &&
    typeof (pt as Record<string, unknown>).date === "string"
  );
}

export function BalanceChart({ data, series, height = 192, tooltipContent }: BalanceChartProps) {
  return (
    <div className="py-2.5">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={s.gradientOpacity.start} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={s.gradientOpacity.end} />
                </linearGradient>
              ))}
            </defs>
            <XAxis
              dataKey="idx"
              type="number"
              domain={[0, Math.max(0, data.length - 1)]}
              padding={{ left: 0, right: 0 }}
              tick={false}
              axisLine={false}
              tickLine={false}
              height={0}
            />
            <YAxis hide={true} padding={{ top: 10, bottom: 10 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const rawPt = payload[0]?.payload;
                if (!isDataPoint(rawPt)) return null;
                return tooltipContent(rawPt);
              }}
            />
            {series.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                strokeWidth={s.strokeWidth ?? 2}
                strokeDasharray={s.strokeDasharray}
                fill={`url(#${s.gradientId})`}
                dot={false}
                activeDot={{ r: 5, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
                connectNulls={s.connectNulls ?? false}
                isAnimationActive={s.isAnimationActive !== false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {data.length >= 2 && (
        <div className="text-muted mt-1 flex justify-between px-2 text-xs">
          <span>{data[0]?.date ?? ""}</span>
          <span>{data[data.length - 1]?.date ?? ""}</span>
        </div>
      )}
    </div>
  );
}
