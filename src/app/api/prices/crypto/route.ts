import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";

const geckoResponseSchema = z.record(z.string(), z.record(z.string(), z.number()));

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  const currency = (searchParams.get("currency") ?? "usd").toLowerCase();

  if (!ids) return NextResponse.json({});

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${currency}`,
    { next: { revalidate: 60 } },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 502 });
  }

  const raw: unknown = await res.json();
  const parsed = geckoResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid price data" }, { status: 502 });
  }

  // Flatten { bitcoin: { usd: 65000 } } → { bitcoin: 65000 }
  const prices: Record<string, number> = {};
  for (const [coinId, values] of Object.entries(parsed.data)) {
    const price = values[currency];
    if (price !== undefined) prices[coinId] = price;
  }

  return NextResponse.json(prices, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
