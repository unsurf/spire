import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { CRYPTO_HISTORY_REVALIDATE } from "@/lib/constants/crypto.constants";
import type { CryptoTimeRange } from "@/lib/constants/crypto.constants";

const geckoChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});

function formatDate(ms: number, days: number): string {
  const date = new Date(ms);
  if (days <= 1) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const VALID_DAYS = new Set(["1", "7", "30", "365"]);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const coinId = searchParams.get("coinId");
  const daysParam = searchParams.get("days") ?? "30";
  const currency = (searchParams.get("currency") ?? "usd").toLowerCase();

  if (!coinId) return NextResponse.json({ error: "coinId required" }, { status: 400 });
  if (!VALID_DAYS.has(daysParam)) return NextResponse.json({ error: "invalid days" }, { status: 400 });

  const days = parseInt(daysParam, 10);
  const rangeKey = { 1: "1D", 7: "1W", 30: "1M", 365: "1Y" }[days] as CryptoTimeRange;
  const revalidate = CRYPTO_HISTORY_REVALIDATE[rangeKey];

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=${currency}&days=${days}`,
    { next: { revalidate } },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 502 });
  }

  const raw: unknown = await res.json();
  const parsed = geckoChartSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid price data" }, { status: 502 });
  }

  // For 1D, CoinGecko returns ~288 points (every 5 min). Sample to ~50.
  const rawPrices = parsed.data.prices;
  const step = days <= 1 ? Math.max(1, Math.floor(rawPrices.length / 50)) : 1;
  const points = rawPrices
    .filter((_, i) => i % step === 0)
    .map(([ms, price]) => ({
      ms,
      date: formatDate(ms, days),
      price: Math.round(price * 10000) / 10000,
    }));

  return NextResponse.json(
    { points },
    { headers: { "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=60` } },
  );
}
