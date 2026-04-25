import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, balanceEntries, accountSplits, incomes } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { updateAccountSchema } from "@/lib/schemas/account.schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.userId, session.user.id)),
    with: {
      balanceEntries: { orderBy: asc(balanceEntries.recordedAt) },
      splits: { with: { income: true } },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(account);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const parsed = updateAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.userId, session.user.id)),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Partial<typeof accounts.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.oracleEnabled !== undefined) updateData.oracleEnabled = parsed.data.oracleEnabled;
  if (parsed.data.annualGrowthRate !== undefined) updateData.annualGrowthRate = parsed.data.annualGrowthRate;
  if (parsed.data.coinQuantity !== undefined) updateData.coinQuantity = parsed.data.coinQuantity?.toString() ?? null;
  if (parsed.data.coinSymbol !== undefined) updateData.coinSymbol = parsed.data.coinSymbol;

  const [updated] = await db
    .update(accounts)
    .set(updateData)
    .where(eq(accounts.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.userId, session.user.id)),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(accounts).where(eq(accounts.id, id));
  return NextResponse.json({ success: true });
}
