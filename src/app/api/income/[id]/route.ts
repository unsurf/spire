import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.query.incomes.findFirst({
    where: and(eq(incomes.id, id), eq(incomes.userId, session.user.id)),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(incomes).where(eq(incomes.id, id));
  return NextResponse.json({ success: true });
}
