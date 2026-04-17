import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { updateBillSchema } from "@/lib/schemas/bill.schema";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.bill.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = updateBillSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, amount, accountId, cycle, startDate, category, subcategory } = parsed.data;

  const bill = await prisma.bill.update({
    where: { id },
    data: {
      name,
      amount: amount ?? null,
      accountId: accountId ?? null,
      cycle,
      startDate: new Date(startDate),
      category: category ?? null,
      subcategory: subcategory ?? null,
    },
    include: { account: { select: { name: true } } },
  });

  return NextResponse.json({
    id: bill.id,
    name: bill.name,
    amount: bill.amount ? bill.amount.toString() : null,
    accountId: bill.accountId,
    accountName: bill.account?.name ?? null,
    cycle: bill.cycle,
    startDate: bill.startDate.toISOString(),
    category: bill.category,
    subcategory: bill.subcategory,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.bill.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.bill.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
