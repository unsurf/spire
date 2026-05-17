import { auth } from "@/auth";
import { db } from "@/db";
import { bankConnections } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await db.query.bankConnections.findMany({
    where: eq(bankConnections.userId, session.user.id),
    with: {
      accountLinks: {
        with: {
          spireAccount: {
            columns: { id: true, name: true, category: true },
          },
        },
      },
    },
  });

  return Response.json(connections);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  const connection = await db.query.bankConnections.findFirst({
    where: eq(bankConnections.id, id),
    columns: { id: true, userId: true },
  });

  if (!connection || connection.userId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(bankConnections).where(eq(bankConnections.id, id));

  return Response.json({ ok: true });
}
