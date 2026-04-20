/**
 * Data palette — 8 perceptually distinct colours for charts, categories, and
 * multi-series visualisations. Use these instead of repeating semantic tokens
 * (accent / positive / error) across data series.
 *
 * Ordered so adjacent indices contrast well.
 */
export const DATA_COLORS = [
  "var(--data-1)", // sky
  "var(--data-2)", // amber
  "var(--data-3)", // teal
  "var(--data-4)", // pink
  "var(--data-5)", // indigo
  "var(--data-6)", // orange
  "var(--data-7)", // lime
  "var(--data-8)", // slate
] as const;

export type DataColorIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Access a data colour by 1-based index, wrapping if n > 8. */
export function getDataColor(index: number): string {
  return DATA_COLORS[(index - 1) % DATA_COLORS.length];
}
