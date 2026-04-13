import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createIncomeSchema } from "@/lib/schemas/income.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incomes = await prisma.income.findMany({
    where: { userId: session.user.id },
    include: {
      splits: { include: { account: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(incomes);
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

    const parsedLastPaidAt = parsed.data.lastPaidAt
      ? new Date(parsed.data.lastPaidAt)
      : null;

    const income = await prisma.income.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        amount: parsed.data.amount.toString(),
        cycle: parsed.data.cycle,
        lastPaidAt: parsedLastPaidAt,
      },
      include: { splits: { include: { account: true } } },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown income create error";
    return NextResponse.json(
      { error: "Failed to create income", details: message },
      { status: 500 }
    );
  }
}
