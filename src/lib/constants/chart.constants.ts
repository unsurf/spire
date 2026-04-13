/** Stroke/fill colour for historical balance data in all charts. */
export const CHART_COLOR_BALANCE = "#10b981";

/** Stroke/fill colour for oracle projected data in all charts. */
export const CHART_COLOR_PROJECTION = "#8b5cf6";

/** Standard area chart gradient opacity values. */
export const CHART_GRADIENT = {
  BALANCE: { start: 0.2, end: 0 },
  PROJECTION: { start: 0.15, end: 0 },
} as const;
