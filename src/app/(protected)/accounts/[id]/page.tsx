import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, users, balanceEntries, trades } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import AccountDetailClient from "@/components/accounts/account-detail-client";
import { ROUTES } from "@/lib/constants/routes.constants";
import { serialiseAccountDetail } from "@/lib/utils/prisma-serialise";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const { id } = await params;

  const [account, userRow] = await Promise.all([
    db.query.accounts.findFirst({
      where: and(eq(accounts.id, id), eq(accounts.userId, session.user.id)),
      with: {
        balanceEntries: { orderBy: asc(balanceEntries.recordedAt) },
        splits: { with: { income: true } },
        trades: { orderBy: asc(trades.tradedAt) },
      },
    }),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { currency: true },
    }),
  ]);

  if (!account) notFound();

  return (
    <AccountDetailClient
      account={serialiseAccountDetail(account)}
      currency={userRow?.currency ?? "USD"}
    />
  );
}
