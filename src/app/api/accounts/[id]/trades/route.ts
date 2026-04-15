import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createTradeSchema } from "@/lib/schemas/trade.schema";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const account = await prisma.account.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = createTradeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { type, quantity, price, tradedAt, note } = parsed.data;

  // Compute updated coinQuantity from all trades + this new one
  const existingTrades = await prisma.trade.findMany({
    where: { accountId: id },
    orderBy: { tradedAt: "asc" },
  });

  let newQty = existingTrades.reduce((sum, t) => {
    const q = parseFloat(t.quantity.toString());
    return t.type === "BUY" ? sum + q : sum - q;
  }, 0);
  newQty = type === "BUY" ? newQty + quantity : newQty - quantity;
  newQty = Math.max(0, newQty);

  const [trade] = await prisma.$transaction([
    prisma.trade.create({
      data: { accountId: id, type, quantity, price, tradedAt: new Date(tradedAt), note: note ?? null },
    }),
    prisma.account.update({
      where: { id },
      data: { coinQuantity: newQty },
    }),
  ]);

  return NextResponse.json(
    {
      id: trade.id,
      type: trade.type,
      quantity: trade.quantity.toString(),
      price: trade.price.toString(),
      tradedAt: trade.tradedAt.toISOString(),
      note: trade.note,
      coinQuantity: String(newQty),
    },
    { status: 201 },
  );
}
