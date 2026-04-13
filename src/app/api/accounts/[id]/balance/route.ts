import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createBalanceEntrySchema } from "@/lib/schemas/account.schema";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const parsed = createBalanceEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const account = await prisma.account.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entry = await prisma.balanceEntry.create({
    data: {
      accountId: id,
      balance: parsed.data.balance,
      note: parsed.data.note ?? null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
