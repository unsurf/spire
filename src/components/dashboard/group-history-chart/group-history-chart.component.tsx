"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/currencies";
import {
  buildGroupHistoryData,
  getActiveGroupKeys,
  isGroupHistoryPoint,
} from "./group-history-chart.utils";
import { GROUP_HISTORY_SERIES } from "./group-history-chart.constants";
import type { GroupHistoryChartProps } from "./group-history-chart.types";

export function GroupHistoryChart({ accounts, currency }: GroupHistoryChartProps) {
  const data = buildGroupHistoryData(accounts);

  if (data.length < 2) return null;

  const activeKeys = getActiveGroupKeys(data);
  const activeSeries = GROUP_HISTORY_SERIES.filter((s) => activeKeys.includes(s.key));

  return (
    <div className="bg-surface-raised border-edge rounded-xl border pt-4">
      <p className="text-muted mb-4 px-4 text-xs uppercase tracking-wide">Balance by Group</p>
      <div style={{ height: 192 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {activeSeries.map((s) => (
                <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis
              dataKey="idx"
              type="number"
              domain={[0, Math.max(0, data.length - 1)]}
              tick={false}
              axisLine={false}
              tickLine={false}
              height={0}
            />
            <YAxis hide padding={{ top: 10, bottom: 10 }} />
            <Tooltip
              wrapperStyle={{ zIndex: 50 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const pt = payload[0]?.payload;
                if (!isGroupHistoryPoint(pt)) return null;
                return (
                  <div className="bg-surface-raised border-edge pointer-events-none rounded-xl border px-4 py-3 text-xs shadow-lg">
                    <p className="text-muted mb-2">{pt.date}</p>
                    {activeSeries.map((s) => {
                      const val = pt[s.key];
                      if (val == null) return null;
                      return (
                        <p key={s.key} className="text-on-surface mb-1 font-medium">
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.label}: {formatCurrency(val, currency)}
                        </p>
                      );
                    })}
                  </div>
                );
              }}
            />
            {activeSeries.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#${s.gradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: s.color, stroke: "var(--surface-raised)", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {data.length >= 2 && (
        <div className="text-muted mt-1 flex justify-between px-4 pb-2 text-xs">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      )}
    </div>
  );
}
