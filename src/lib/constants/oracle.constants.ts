export const ORACLE_HORIZONS = ["6m", "1y", "2y", "3y"] as const;
export type OracleHorizon = (typeof ORACLE_HORIZONS)[number];
