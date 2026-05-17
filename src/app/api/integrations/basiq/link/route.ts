import { auth } from "@/auth";
import { db } from "@/db";
import { bankAccountLinks, bankConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const linkSchema = z.object({
  bankAccountLinkId: z.string().min(1),
  spireAccountId: z.string().min(1).nullable(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = linkSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const link = await db.query.bankAccountLinks.findFirst({
    where: eq(bankAccountLinks.id, parsed.data.bankAccountLinkId),
    with: {
      bankConnection: {
        columns: { userId: true },
      },
    },
  });

  if (!link || link.bankConnection.userId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(bankAccountLinks)
    .set({ spireAccountId: parsed.data.spireAccountId })
    .where(eq(bankAccountLinks.id, parsed.data.bankAccountLinkId));

  return Response.json({ ok: true });
}
