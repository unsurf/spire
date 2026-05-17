import { auth } from "@/auth";
import { db } from "@/db";
import { bankAccountLinks, bankConnections, balanceEntries } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getUserAccounts } from "@/lib/basiq/basiq.client";
import { users } from "@/db/schema";
import { z } from "zod";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, basiqUserId: true },
  });

  if (!user?.basiqUserId) {
    return Response.json({ error: "No Basiq account connected" }, { status: 400 });
  }

  const linkedAccounts = await db.query.bankAccountLinks.findMany({
    where: and(
      isNotNull(bankAccountLinks.spireAccountId),
    ),
    with: {
      bankConnection: {
        columns: { userId: true },
      },
    },
  });

  const ownedLinks = linkedAccounts.filter(
    (link) => link.bankConnection.userId === session.user.id && link.spireAccountId
  );

  if (ownedLinks.length === 0) {
    return Response.json({ synced: 0 });
  }

  try {
    const basiqAccounts = await getUserAccounts(user.basiqUserId);
    const basiqAccountMap = new Map(basiqAccounts.map((a) => [a.id, a]));

    let synced = 0;
    const now = new Date();

    for (const link of ownedLinks) {
      if (!link.spireAccountId) continue;
      const basiqAccount = basiqAccountMap.get(link.basiqAccountId);
      if (!basiqAccount) continue;

      const balance = basiqAccount.balance ?? basiqAccount.availableFunds;
      if (balance == null) continue;

      await db.insert(balanceEntries).values({
        id: createId(),
        accountId: link.spireAccountId,
        balance: balance.toFixed(2),
        note: "Synced from bank",
        recordedAt: now,
      });

      await db
        .update(bankAccountLinks)
        .set({ lastSyncedAt: now })
        .where(eq(bankAccountLinks.id, link.id));

      synced++;
    }

    return Response.json({ synced });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
