import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateGoalSchema } from "@/lib/schemas/goal.schema";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.query.goals.findFirst({
    where: and(eq(goals.id, id), eq(goals.userId, session.user.id)),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = updateGoalSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, targetAmount, accountId, deadline } = parsed.data;

  const [updated] = await db
    .update(goals)
    .set({
      name,
      targetAmount: targetAmount.toString(),
      accountId: accountId ?? null,
      deadline: deadline ? new Date(deadline) : null,
    })
    .where(eq(goals.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    targetAmount: updated.targetAmount,
    accountId: updated.accountId,
    deadline: updated.deadline ? updated.deadline.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.query.goals.findFirst({
    where: and(eq(goals.id, id), eq(goals.userId, session.user.id)),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(goals).where(eq(goals.id, id));
  return new NextResponse(null, { status: 204 });
}
