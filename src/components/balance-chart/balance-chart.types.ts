import type { ReactNode } from "react";

export type BalanceChartDataPoint = {
  idx: number;
  date: string;
  value?: number;
  proj?: number;
  actual?: number;
  projected?: number;
  isLive?: boolean;
};

export type BalanceChartSeries = {
  dataKey: string;
  color: string;
  gradientId: string;
  gradientOpacity: { start: number; end: number };
  strokeWidth?: number;
  strokeDasharray?: string;
  connectNulls?: boolean;
  isAnimationActive?: boolean;
};

export type BalanceChartProps = {
  data: BalanceChartDataPoint[];
  series: BalanceChartSeries[];
  height?: number;
  tooltipContent: (pt: BalanceChartDataPoint) => ReactNode;
};
