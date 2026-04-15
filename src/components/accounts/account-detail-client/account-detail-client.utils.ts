import type {
  AccountDelta,
  AccountDetailAccount,
  AccountDetailTrade,
  ChartDataPoint,
} from "./account-detail-client.types";

export function getAccountDelta(account: AccountDetailAccount): AccountDelta {
  const entries = account.balanceEntries;
  const currentBalance =
    entries.length > 0 ? Number(entries[entries.length - 1].balance) : 0;
  const previousBalance =
    entries.length > 1 ? Number(entries[entries.length - 2].balance) : null;
  const delta =
    previousBalance !== null ? currentBalance - previousBalance : null;

  return { currentBalance, previousBalance, delta };
}

export type TradePnl = {
  holdings: number;
  avgCostPerCoin: number;
  totalCostBasis: number;
  realizedPnl: number;
  unrealizedPnl: number | null;
  currentValue: number | null;
};

/**
 * Calculates P&L using the Average Cost (AVCO) method.
 * Trades must be sorted oldest-first.
 */
export function calcTradePnl(trades: AccountDetailTrade[], livePrice: number | null): TradePnl {
  let holdings = 0;
  let totalCostBasis = 0;
  let realizedPnl = 0;

  for (const trade of trades) {
    const qty = parseFloat(trade.quantity);
    const price = parseFloat(trade.price);

    if (trade.type === "BUY") {
      totalCostBasis += qty * price;
      holdings += qty;
    } else {
      const avgCost = holdings > 0 ? totalCostBasis / holdings : 0;
      realizedPnl += qty * (price - avgCost);
      // Reduce cost basis proportionally
      const fraction = holdings > 0 ? qty / holdings : 0;
      totalCostBasis -= totalCostBasis * fraction;
      holdings -= qty;
    }
  }

  holdings = Math.max(0, holdings);
  const avgCostPerCoin = holdings > 0 ? totalCostBasis / holdings : 0;
  const currentValue = livePrice !== null ? holdings * livePrice : null;
  const unrealizedPnl = currentValue !== null ? currentValue - totalCostBasis : null;

  return { holdings, avgCostPerCoin, totalCostBasis, realizedPnl, unrealizedPnl, currentValue };
}

export function buildHistoryData(
  account: AccountDetailAccount
): ChartDataPoint[] {
  return account.balanceEntries.map((entry, idx) => ({
    idx,
    date: new Date(entry.recordedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    }),
    value: Number(entry.balance),
  }));
}
