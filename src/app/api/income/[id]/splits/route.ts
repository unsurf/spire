import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { incomes, accountSplits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateSplitsSchema } from "@/lib/schemas/income.schema";
import { createId } from "@paralleldrive/cuid2";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const parsed = updateSplitsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { splits } = parsed.data;

  const income = await db.query.incomes.findFirst({
    where: and(eq(incomes.id, id), eq(incomes.userId, session.user.id)),
  });

  if (!income) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const percentageSplits = splits.filter((s) => s.type === "PERCENTAGE");
  const fixedSplits = splits.filter((s) => s.type === "FIXED");
  const totalPct = percentageSplits.reduce((sum, s) => sum + s.value, 0);
  const totalFixed = fixedSplits.reduce((sum, s) => sum + s.value, 0);

  if (totalPct > 100) {
    return NextResponse.json({ error: "Percentage splits exceed 100%" }, { status: 400 });
  }

  if (totalFixed > Number(income.amount)) {
    return NextResponse.json({ error: "Fixed splits exceed income amount" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx.delete(accountSplits).where(eq(accountSplits.incomeId, id));
    if (splits.length > 0) {
      await tx.insert(accountSplits).values(
        splits.map((s) => ({
          id: createId(),
          incomeId: id,
          accountId: s.accountId,
          type: s.type,
          value: s.value.toString(),
        })),
      );
    }
  });

  const updated = await db.query.accountSplits.findMany({
    where: eq(accountSplits.incomeId, id),
    with: { account: true },
  });

  return NextResponse.json(updated);
}
