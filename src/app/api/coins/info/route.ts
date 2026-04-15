import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";

const marketsResponseSchema = z.array(
  z.object({
    id: z.string(),
    symbol: z.string(),
  }),
);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(id)}`,
    { next: { revalidate: 3600 } },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch coin info" }, { status: 502 });
  }

  const raw: unknown = await res.json();
  const parsed = marketsResponseSchema.safeParse(raw);
  if (!parsed.success || parsed.data.length === 0) {
    return NextResponse.json({ error: "Coin not found" }, { status: 404 });
  }

  return NextResponse.json({ symbol: parsed.data[0].symbol.toUpperCase() });
}
