import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { bills, accounts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { createBillSchema } from "@/lib/schemas/bill.schema";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.query.bills.findMany({
    where: eq(bills.userId, session.user.id),
    with: { account: { columns: { name: true } } },
    orderBy: asc(bills.startDate),
  });

  return NextResponse.json(
    rows.map((b) => ({
      id: b.id,
      name: b.name,
      amount: b.amount ?? null,
      accountId: b.accountId,
      accountName: b.account?.name ?? null,
      cycle: b.cycle,
      startDate: b.startDate.toISOString(),
      category: b.category,
      subcategory: b.subcategory,
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createBillSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, amount, accountId, cycle, startDate, category, subcategory } = parsed.data;

  const [bill] = await db
    .insert(bills)
    .values({
      id: createId(),
      userId: session.user.id,
      name,
      amount: amount?.toString() ?? null,
      accountId: accountId ?? null,
      cycle,
      startDate: new Date(startDate),
      category: category ?? null,
      subcategory: subcategory ?? null,
    })
    .returning();

  const billWithAccount = await db.query.bills.findFirst({
    where: eq(bills.id, bill.id),
    with: { account: { columns: { name: true } } },
  });

  return NextResponse.json(
    {
      id: bill.id,
      name: bill.name,
      amount: bill.amount ?? null,
      accountId: bill.accountId,
      accountName: billWithAccount?.account?.name ?? null,
      cycle: bill.cycle,
      startDate: bill.startDate.toISOString(),
      category: bill.category,
      subcategory: bill.subcategory,
    },
    { status: 201 },
  );
}
