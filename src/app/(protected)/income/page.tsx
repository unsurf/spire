import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import IncomeClient from "@/components/income/income-client";
import { ROUTES } from "@/lib/constants/routes.constants";
import { serialiseIncomes, serialiseIncomeAccounts } from "@/lib/utils/prisma-serialise";

export default async function IncomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const [incomes, accounts, user] = await Promise.all([
    prisma.income.findMany({
      where: { userId: session.user.id },
      include: { splits: { include: { account: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.account.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currency: true },
    }),
  ]);

  return (
    <IncomeClient
      incomes={serialiseIncomes(incomes)}
      accounts={serialiseIncomeAccounts(accounts)}
      currency={user?.currency ?? "USD"}
    />
  );
}
