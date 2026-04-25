import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { createGoalSchema } from "@/lib/schemas/goal.schema";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, session.user.id))
    .orderBy(asc(goals.createdAt));

  return NextResponse.json(
    rows.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      accountId: g.accountId,
      deadline: g.deadline ? g.deadline.toISOString() : null,
      createdAt: g.createdAt.toISOString(),
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createGoalSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, targetAmount, accountId, deadline } = parsed.data;

  const [goal] = await db
    .insert(goals)
    .values({
      id: createId(),
      userId: session.user.id,
      name,
      targetAmount: targetAmount.toString(),
      accountId: accountId ?? null,
      deadline: deadline ? new Date(deadline) : null,
    })
    .returning();

  return NextResponse.json(
    {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      accountId: goal.accountId,
      deadline: goal.deadline ? goal.deadline.toISOString() : null,
      createdAt: goal.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
