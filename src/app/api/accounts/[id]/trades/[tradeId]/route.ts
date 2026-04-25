import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, trades } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

type Params = { params: Promise<{ id: string; tradeId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, tradeId } = await params;

  // Verify trade belongs to an account owned by this user
  const trade = await db.query.trades.findFirst({
    where: and(eq(trades.id, tradeId), eq(trades.accountId, id)),
    with: { account: true },
  });
  if (!trade || trade.account.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(trades).where(eq(trades.id, tradeId));

  // Recompute coinQuantity from remaining trades
  const remaining = await db
    .select()
    .from(trades)
    .where(eq(trades.accountId, id))
    .orderBy(asc(trades.tradedAt));

  const newQty = Math.max(
    0,
    remaining.reduce((sum, t) => {
      const q = parseFloat(t.quantity);
      return t.type === "BUY" ? sum + q : sum - q;
    }, 0),
  );

  await db
    .update(accounts)
    .set({ coinQuantity: newQty.toString() })
    .where(eq(accounts.id, id));

  return NextResponse.json({ coinQuantity: newQty.toString() });
}
