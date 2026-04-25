import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, balanceEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createBalanceEntrySchema } from "@/lib/schemas/account.schema";
import { createId } from "@paralleldrive/cuid2";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const parsed = createBalanceEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.userId, session.user.id)),
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [entry] = await db
    .insert(balanceEntries)
    .values({
      id: createId(),
      accountId: id,
      balance: parsed.data.balance.toString(),
      note: parsed.data.note ?? null,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
