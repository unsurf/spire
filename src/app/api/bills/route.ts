import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createBillSchema } from "@/lib/schemas/bill.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bills = await prisma.bill.findMany({
    where: { userId: session.user.id },
    include: { account: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(
    bills.map((b) => ({
      id: b.id,
      name: b.name,
      amount: b.amount ? b.amount.toString() : null,
      accountId: b.accountId,
      accountName: b.account?.name ?? null,
      cycle: b.cycle,
      startDate: b.startDate.toISOString(),
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

  const { name, amount, accountId, cycle, startDate } = parsed.data;

  const bill = await prisma.bill.create({
    data: {
      userId: session.user.id,
      name,
      amount: amount ?? null,
      accountId: accountId ?? null,
      cycle,
      startDate: new Date(startDate),
    },
    include: { account: { select: { name: true } } },
  });

  return NextResponse.json(
    {
      id: bill.id,
      name: bill.name,
      amount: bill.amount ? bill.amount.toString() : null,
      accountId: bill.accountId,
      accountName: bill.account?.name ?? null,
      cycle: bill.cycle,
      startDate: bill.startDate.toISOString(),
    },
    { status: 201 },
  );
}
