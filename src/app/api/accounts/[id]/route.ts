import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
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

  const account = await prisma.account.findFirst({
    where: { id, userId: session.user.id },
    include: {
      balanceEntries: { orderBy: { recordedAt: "asc" } },
      splits: {
        include: { income: true },
      },
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

  const account = await prisma.account.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.account.update({
    where: { id },
    data: {
      name: parsed.data.name ?? account.name,
      oracleEnabled: parsed.data.oracleEnabled ?? account.oracleEnabled,
      annualGrowthRate:
        parsed.data.annualGrowthRate !== undefined
          ? parsed.data.annualGrowthRate
          : account.annualGrowthRate,
      ...(parsed.data.coinQuantity !== undefined && {
        coinQuantity: parsed.data.coinQuantity,
      }),
      ...(parsed.data.coinSymbol !== undefined && {
        coinSymbol: parsed.data.coinSymbol,
      }),
    },
  });

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

  const account = await prisma.account.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
