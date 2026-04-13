import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createAccountSchema } from "@/lib/schemas/account.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    include: {
      balanceEntries: {
        orderBy: { recordedAt: "desc" },
        take: 2,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      oracleEnabled: true,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
