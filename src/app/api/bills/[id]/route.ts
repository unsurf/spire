import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { bills } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateBillSchema } from "@/lib/schemas/bill.schema";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.query.bills.findFirst({
    where: and(eq(bills.id, id), eq(bills.userId, session.user.id)),
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = updateBillSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, amount, accountId, cycle, startDate, category, subcategory } = parsed.data;

  const [bill] = await db
    .update(bills)
    .set({
      name,
      amount: amount?.toString() ?? null,
      accountId: accountId ?? null,
      cycle,
      startDate: new Date(startDate),
      category: category ?? null,
      subcategory: subcategory ?? null,
    })
    .where(eq(bills.id, id))
    .returning();

  const billWithAccount = await db.query.bills.findFirst({
    where: eq(bills.id, bill.id),
    with: { account: { columns: { name: true } } },
  });

  return NextResponse.json({
    id: bill.id,
    name: bill.name,
    amount: bill.amount ?? null,
    accountId: bill.accountId,
    accountName: billWithAccount?.account?.name ?? null,
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
  const existing = await db.query.bills.findFirst({
    where: and(eq(bills.id, id), eq(bills.userId, session.user.id)),
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(bills).where(eq(bills.id, id));
  return new NextResponse(null, { status: 204 });
}
