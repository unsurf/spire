import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { updateGoalSchema } from "@/lib/schemas/goal.schema";

type Params = { params: Promise<{ id: string }> };

function serialiseGoal(g: {
  id: string;
  name: string;
  targetAmount: { toString(): string };
  accountId: string | null;
  deadline: Date | null;
  createdAt: Date;
}) {
  return {
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount.toString(),
    accountId: g.accountId,
    deadline: g.deadline ? g.deadline.toISOString() : null,
    createdAt: g.createdAt.toISOString(),
  };
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.goal.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = updateGoalSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, targetAmount, accountId, deadline } = parsed.data;

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      name,
      targetAmount,
      accountId: accountId ?? null,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json(serialiseGoal(updated));
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.goal.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.goal.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
