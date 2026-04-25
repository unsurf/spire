import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, trades } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createTradeSchema } from "@/lib/schemas/trade.schema";
import { createId } from "@paralleldrive/cuid2";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.userId, session.user.id)),
  });
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = createTradeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { type, quantity, price, tradedAt, note } = parsed.data;

  // Compute updated coinQuantity from all existing trades + this new one
  const existingTrades = await db
    .select()
    .from(trades)
    .where(eq(trades.accountId, id))
    .orderBy(asc(trades.tradedAt));

  let newQty = existingTrades.reduce((sum, t) => {
    const q = parseFloat(t.quantity);
    return t.type === "BUY" ? sum + q : sum - q;
  }, 0);
  newQty = type === "BUY" ? newQty + quantity : newQty - quantity;
  newQty = Math.max(0, newQty);

  const trade = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(trades)
      .values({
        id: createId(),
        accountId: id,
        type,
        quantity: quantity.toString(),
        price: price.toString(),
        tradedAt: new Date(tradedAt),
        note: note ?? null,
      })
      .returning();

    await tx
      .update(accounts)
      .set({ coinQuantity: newQty.toString() })
      .where(eq(accounts.id, id));

    return inserted;
  });

  return NextResponse.json(
    {
      id: trade.id,
      type: trade.type,
      quantity: trade.quantity,
      price: trade.price,
      tradedAt: trade.tradedAt.toISOString(),
      note: trade.note,
      coinQuantity: newQty.toString(),
    },
    { status: 201 },
  );
}
