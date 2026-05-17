import { auth } from "@/auth";
import { db } from "@/db";
import { bankAccountLinks, bankConnections, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { redirect } from "next/navigation";
import { getUserAccounts, getUserConnections, pollJobUntilComplete } from "@/lib/basiq/basiq.client";
import { ROUTES } from "@/lib/constants/routes.constants";
import { z } from "zod";

const callbackParamsSchema = z.object({
  jobId: z.string().optional(),
  error: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(ROUTES.SIGN_IN);
  }

  const url = new URL(req.url);
  const params = callbackParamsSchema.parse({
    jobId: url.searchParams.get("jobId") ?? undefined,
    error: url.searchParams.get("error") ?? undefined,
  });

  if (params.error) {
    redirect(`${ROUTES.INTEGRATIONS}?error=${encodeURIComponent(params.error)}`);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, basiqUserId: true },
  });

  if (!user?.basiqUserId) {
    redirect(`${ROUTES.INTEGRATIONS}?error=no_basiq_user`);
  }

  try {
    if (params.jobId) {
      await pollJobUntilComplete(params.jobId);
    }

    const [connections, accounts] = await Promise.all([
      getUserConnections(user.basiqUserId),
      getUserAccounts(user.basiqUserId),
    ]);

    for (const connection of connections) {
      if (connection.status === "active" || connection.status === "pending") {
        const existingConnection = await db.query.bankConnections.findFirst({
          where: eq(bankConnections.basiqConnectionId, connection.id),
        });

        let connectionId: string;

        if (!existingConnection) {
          connectionId = createId();
          await db.insert(bankConnections).values({
            id: connectionId,
            userId: user.id,
            basiqConnectionId: connection.id,
            institution: connection.institution?.name ?? connection.institution?.id ?? null,
            status: connection.status,
          });
        } else {
          connectionId = existingConnection.id;
          await db
            .update(bankConnections)
            .set({ status: connection.status })
            .where(eq(bankConnections.id, connectionId));
        }

        const connectionAccounts = accounts.filter(
          (a) => a.connection === connection.id || !a.connection
        );

        for (const account of connectionAccounts) {
          const existingLink = await db.query.bankAccountLinks.findFirst({
            where: eq(bankAccountLinks.basiqAccountId, account.id),
          });

          if (!existingLink) {
            await db.insert(bankAccountLinks).values({
              id: createId(),
              bankConnectionId: connectionId,
              basiqAccountId: account.id,
              basiqAccountName: account.name,
              spireAccountId: null,
            });
          }
        }
      }
    }

    if (connections.length === 0 && accounts.length > 0) {
      const existingConnections = await db.query.bankConnections.findMany({
        where: eq(bankConnections.userId, user.id),
        columns: { id: true },
      });

      const connectionId = existingConnections[0]?.id ?? createId();

      if (!existingConnections[0]) {
        await db.insert(bankConnections).values({
          id: connectionId,
          userId: user.id,
          basiqConnectionId: params.jobId ?? "unknown",
          institution: null,
          status: "active",
        });
      }

      for (const account of accounts) {
        const existingLink = await db.query.bankAccountLinks.findFirst({
          where: eq(bankAccountLinks.basiqAccountId, account.id),
        });

        if (!existingLink) {
          await db.insert(bankAccountLinks).values({
            id: createId(),
            bankConnectionId: connectionId,
            basiqAccountId: account.id,
            basiqAccountName: account.name,
            spireAccountId: null,
          });
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "sync_failed";
    redirect(`${ROUTES.INTEGRATIONS}?error=${encodeURIComponent(message)}`);
  }

  redirect(`${ROUTES.INTEGRATIONS}?connected=true`);
}
