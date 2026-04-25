import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, balanceEntries } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { createAccountSchema } from "@/lib/schemas/account.schema";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.query.accounts.findMany({
    where: eq(accounts.userId, session.user.id),
    with: {
      balanceEntries: {
        orderBy: desc(balanceEntries.recordedAt),
        limit: 2,
      },
    },
    orderBy: asc(accounts.createdAt),
  });

  return NextResponse.json(rows);
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

  const [account] = await db
    .insert(accounts)
    .values({
      id: createId(),
      userId: session.user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      annualGrowthRate: parsed.data.annualGrowthRate ?? null,
      coinId: parsed.data.coinId ?? null,
      coinSymbol: parsed.data.coinSymbol ?? null,
      coinQuantity: parsed.data.coinQuantity?.toString() ?? null,
      oracleEnabled: true,
    })
    .returning();

  return NextResponse.json(account, { status: 201 });
}
