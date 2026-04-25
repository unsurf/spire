import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { incomes, accountSplits, accounts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { createIncomeSchema } from "@/lib/schemas/income.schema";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.query.incomes.findMany({
    where: eq(incomes.userId, session.user.id),
    with: {
      splits: { with: { account: true } },
    },
    orderBy: asc(incomes.createdAt),
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createIncomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [income] = await db
      .insert(incomes)
      .values({
        id: createId(),
        userId: session.user.id,
        name: parsed.data.name,
        amount: parsed.data.amount.toString(),
        cycle: parsed.data.cycle,
        lastPaidAt: parsed.data.lastPaidAt ? new Date(parsed.data.lastPaidAt) : null,
      })
      .returning();

    const incomeWithSplits = await db.query.incomes.findFirst({
      where: eq(incomes.id, income.id),
      with: { splits: { with: { account: true } } },
    });

    return NextResponse.json(incomeWithSplits, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown income create error";
    return NextResponse.json(
      { error: "Failed to create income", details: message },
      { status: 500 }
    );
  }
}
