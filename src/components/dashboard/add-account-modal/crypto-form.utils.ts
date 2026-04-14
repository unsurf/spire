import { z } from "zod";
import type { CoinSearchResult } from "./add-account-modal.types";

const coinSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  thumb: z.string(),
});

const searchResponseSchema = z.object({
  coins: z.array(coinSchema),
});

const priceResponseSchema = z.record(z.string(), z.record(z.string(), z.number()));

const searchCache = new Map<string, CoinSearchResult[]>();

export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  const key = query.toLowerCase().trim();
  if (searchCache.has(key)) return searchCache.get(key)!;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];

  const raw: unknown = await res.json();
  const parsed = searchResponseSchema.safeParse(raw);
  if (!parsed.success) return [];

  const results = parsed.data.coins.slice(0, 8).map((c) => ({
    id: c.id,
    name: c.name,
    symbol: c.symbol.toUpperCase(),
    thumb: c.thumb,
  }));

  searchCache.set(key, results);
  return results;
}

export async function getCoinPrice(coinId: string, currency: string): Promise<number | null> {
  const vs = currency.toLowerCase();
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=${vs}`,
  );
  if (!res.ok) return null;

  const raw: unknown = await res.json();
  const parsed = priceResponseSchema.safeParse(raw);
  if (!parsed.success) return null;

  return parsed.data[coinId]?.[vs] ?? null;
}
