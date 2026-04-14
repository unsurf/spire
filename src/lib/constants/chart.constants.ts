/** Stroke/fill colour for historical balance data in all charts. */
export const CHART_COLOR_BALANCE = "var(--positive)";

/** Stroke/fill colour for oracle projected data in all charts. */
export const CHART_COLOR_PROJECTION = "var(--accent)";

/** Standard area chart gradient opacity values. */
export const CHART_GRADIENT = {
  BALANCE: { start: 0.2, end: 0 },
  PROJECTION: { start: 0.15, end: 0 },
} as const;
