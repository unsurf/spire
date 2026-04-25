import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, users, bills, goals, balanceEntries, accountSplits, incomes, trades } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { ROUTES, QUERY_PARAMS } from "@/lib/constants/routes.constants";
import { serialiseDashboardAccounts, serialiseDashboardBills, serialiseGoals } from "@/lib/utils/prisma-serialise";

type DashboardSearchParams = {
  [key in typeof QUERY_PARAMS.ACCOUNT]?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const [params, accountRows, userRow, billRows, goalRows] = await Promise.all([
    searchParams,
    db.query.accounts.findMany({
      where: eq(accounts.userId, session.user.id),
      with: {
        balanceEntries: { orderBy: asc(balanceEntries.recordedAt) },
        splits: { with: { income: true } },
        trades: { orderBy: asc(trades.tradedAt) },
      },
      orderBy: asc(accounts.createdAt),
    }),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true, currency: true, onboardingComplete: true },
    }),
    db.query.bills.findMany({
      where: eq(bills.userId, session.user.id),
      columns: { id: true, name: true, amount: true, cycle: true, category: true, subcategory: true },
    }),
    db.query.goals.findMany({
      where: eq(goals.userId, session.user.id),
      orderBy: asc(goals.createdAt),
    }),
  ]);

  if (!userRow?.onboardingComplete) redirect(ROUTES.ONBOARDING);

  return (
    <DashboardClient
      accounts={serialiseDashboardAccounts(accountRows)}
      bills={serialiseDashboardBills(billRows)}
      goals={serialiseGoals(goalRows)}
      userName={userRow?.name ?? ""}
      currency={userRow?.currency ?? "USD"}
      initialSelectedId={params[QUERY_PARAMS.ACCOUNT] ?? null}
    />
  );
}
