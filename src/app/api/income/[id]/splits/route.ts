import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { updateSplitsSchema } from "@/lib/schemas/income.schema";

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

  const income = await prisma.income.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!income) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const percentageSplits = splits.filter((s) => s.type === "PERCENTAGE");
  const fixedSplits = splits.filter((s) => s.type === "FIXED");
  const totalPct = percentageSplits.reduce((sum, s) => sum + s.value, 0);
  const totalFixed = fixedSplits.reduce((sum, s) => sum + s.value, 0);

  if (totalPct > 100) {
    return NextResponse.json(
      { error: "Percentage splits exceed 100%" },
      { status: 400 }
    );
  }

  if (totalFixed > Number(income.amount)) {
    return NextResponse.json(
      { error: "Fixed splits exceed income amount" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.accountSplit.deleteMany({ where: { incomeId: id } }),
    prisma.accountSplit.createMany({
      data: splits.map((s) => ({
        incomeId: id,
        accountId: s.accountId,
        type: s.type,
        value: s.value,
      })),
    }),
  ]);

  const updated = await prisma.accountSplit.findMany({
    where: { incomeId: id },
    include: { account: true },
  });

  return NextResponse.json(updated);
}
