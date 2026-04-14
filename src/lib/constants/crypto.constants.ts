export const CRYPTO_TIME_RANGES = ["1D", "1W", "1M", "1Y"] as const;
export type CryptoTimeRange = (typeof CRYPTO_TIME_RANGES)[number];

export const CRYPTO_TIME_RANGE_DAYS: Record<CryptoTimeRange, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "1Y": 365,
};

/** Server-side revalidation seconds per time range */
export const CRYPTO_HISTORY_REVALIDATE: Record<CryptoTimeRange, number> = {
  "1D": 300,   // 5 min
  "1W": 1800,  // 30 min
  "1M": 3600,  // 1 hour
  "1Y": 7200,  // 2 hours
};
