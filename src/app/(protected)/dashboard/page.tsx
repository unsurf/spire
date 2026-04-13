import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { ROUTES, QUERY_PARAMS } from "@/lib/constants/routes.constants";
import { serialiseDashboardAccounts } from "@/lib/utils/prisma-serialise";

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

  const [params, accounts, user] = await Promise.all([
    searchParams,
    prisma.account.findMany({
      where: { userId: session.user.id },
      include: {
        balanceEntries: { orderBy: { recordedAt: "asc" } },
        splits: { include: { income: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, currency: true, onboardingComplete: true },
    }),
  ]);

  if (!user?.onboardingComplete) redirect(ROUTES.ONBOARDING);

  return (
    <DashboardClient
      accounts={serialiseDashboardAccounts(accounts)}
      userName={user?.name ?? ""}
      currency={user?.currency ?? "USD"}
      initialSelectedId={params[QUERY_PARAMS.ACCOUNT] ?? null}
    />
  );
}
