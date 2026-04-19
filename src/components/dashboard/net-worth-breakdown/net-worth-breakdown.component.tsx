"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/currencies";
import { buildBreakdownSegments, isBreakdownSegment } from "./net-worth-breakdown.utils";
import { BREAKDOWN_COLORS } from "./net-worth-breakdown.constants";
import type { NetWorthBreakdownProps } from "./net-worth-breakdown.types";

export function NetWorthBreakdown({ accounts, currency }: NetWorthBreakdownProps) {
  const segments = buildBreakdownSegments(accounts);

  if (segments.length === 0) return null;

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="bg-surface-raised border-edge rounded-xl border p-4">
      <p className="text-muted mb-4 text-xs uppercase tracking-wide">Breakdown</p>
      <div className="flex items-center gap-6">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Visible thin ring */}
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={64}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
              >
                {segments.map((seg) => (
                  <Cell key={seg.key} fill={BREAKDOWN_COLORS[seg.key]} stroke="none" />
                ))}
              </Pie>
              {/* Transparent wider ring for easier hover detection — rendered on top to capture events */}
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={76}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
                style={{ opacity: 0 }}
              >
                {segments.map((seg) => (
                  <Cell key={seg.key} fill={BREAKDOWN_COLORS[seg.key]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 50 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const seg = payload[0]?.payload;
                  if (!isBreakdownSegment(seg)) return null;
                  return (
                    <div className="bg-surface-raised border-edge pointer-events-none rounded-xl border px-4 py-3 text-xs shadow-lg">
                      <p className="text-muted mb-1">{seg.label}</p>
                      <p className="text-on-surface font-semibold">
                        {formatCurrency(seg.value, currency)}
                      </p>
                      <p className="text-muted">{seg.percentage.toFixed(1)}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-muted text-xs">Total</p>
            <p className="text-on-surface text-sm font-bold">{formatCurrency(total, currency)}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: BREAKDOWN_COLORS[seg.key] }}
                />
                <span className="text-muted truncate text-sm">{seg.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-on-surface text-sm font-medium">
                  {formatCurrency(seg.value, currency)}
                </span>
                <span className="text-subtle w-9 text-right text-xs">
                  {seg.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
