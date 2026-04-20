import { auth } from "@/auth";
import prisma from "@/lib/prisma";
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

  const [params, accounts, user, bills, goals] = await Promise.all([
    searchParams,
    prisma.account.findMany({
      where: { userId: session.user.id },
      include: {
        balanceEntries: { orderBy: { recordedAt: "asc" } },
        splits: { include: { income: true } },
        trades: { orderBy: { tradedAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, currency: true, onboardingComplete: true },
    }),
    prisma.bill.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, amount: true, cycle: true, category: true, subcategory: true },
    }),
    prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!user?.onboardingComplete) redirect(ROUTES.ONBOARDING);

  return (
    <DashboardClient
      accounts={serialiseDashboardAccounts(accounts)}
      bills={serialiseDashboardBills(bills)}
      goals={serialiseGoals(goals)}
      userName={user?.name ?? ""}
      currency={user?.currency ?? "USD"}
      initialSelectedId={params[QUERY_PARAMS.ACCOUNT] ?? null}
    />
  );
}
