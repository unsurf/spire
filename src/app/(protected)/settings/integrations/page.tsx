import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, bankConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes.constants";
import { IntegrationsClient } from "@/components/integrations/integrations-client";
import type {
  BankConnectionData,
  SpireAccountOption,
} from "@/components/integrations/integrations-client/integrations-client.types";

type Props = {
  searchParams: Promise<{ connected?: string; error?: string }>;
};

export default async function IntegrationsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const params = await searchParams;

  const [connectionsRaw, spireAccountsRaw] = await Promise.all([
    db.query.bankConnections.findMany({
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
    }),
    db.query.accounts.findMany({
      where: eq(accounts.userId, session.user.id),
      columns: { id: true, name: true, category: true },
      orderBy: (a, { asc }) => asc(a.name),
    }),
  ]);

  const connections: BankConnectionData[] = connectionsRaw.map((c) => ({
    id: c.id,
    basiqConnectionId: c.basiqConnectionId,
    institution: c.institution,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    accountLinks: c.accountLinks.map((l) => ({
      id: l.id,
      basiqAccountId: l.basiqAccountId,
      basiqAccountName: l.basiqAccountName,
      spireAccountId: l.spireAccountId ?? null,
      lastSyncedAt: l.lastSyncedAt?.toISOString() ?? null,
      spireAccount: l.spireAccount
        ? { id: l.spireAccount.id, name: l.spireAccount.name, category: l.spireAccount.category }
        : null,
    })),
  }));

  const spireAccounts: SpireAccountOption[] = spireAccountsRaw.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
  }));

  return (
    <IntegrationsClient
      connections={connections}
      spireAccounts={spireAccounts}
      initialError={params.error ?? null}
      initialConnected={params.connected === "true"}
    />
  );
}
