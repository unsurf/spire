import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string; tradeId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, tradeId } = await params;

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, accountId: id, account: { userId: session.user.id } },
  });
  if (!trade) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trade.delete({ where: { id: tradeId } });

  // Recompute coinQuantity from remaining trades
  const remaining = await prisma.trade.findMany({
    where: { accountId: id },
    orderBy: { tradedAt: "asc" },
  });
  const newQty = Math.max(
    0,
    remaining.reduce((sum, t) => {
      const q = parseFloat(t.quantity.toString());
      return t.type === "BUY" ? sum + q : sum - q;
    }, 0),
  );

  await prisma.account.update({ where: { id }, data: { coinQuantity: newQty } });

  return NextResponse.json({ coinQuantity: String(newQty) });
}
