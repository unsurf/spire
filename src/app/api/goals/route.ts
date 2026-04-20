import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createGoalSchema } from "@/lib/schemas/goal.schema";

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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(goals.map(serialiseGoal));
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

  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      name,
      targetAmount,
      accountId: accountId ?? null,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json(serialiseGoal(goal), { status: 201 });
}
