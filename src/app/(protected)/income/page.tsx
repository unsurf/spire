import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, users, incomes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import IncomeClient from "@/components/income/income-client";
import { ROUTES } from "@/lib/constants/routes.constants";
import { serialiseIncomes, serialiseIncomeAccounts } from "@/lib/utils/prisma-serialise";

export default async function IncomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const [incomeRows, accountRows, userRow] = await Promise.all([
    db.query.incomes.findMany({
      where: eq(incomes.userId, session.user.id),
      with: { splits: { with: { account: true } } },
      orderBy: asc(incomes.createdAt),
    }),
    db.query.accounts.findMany({
      where: eq(accounts.userId, session.user.id),
      orderBy: asc(accounts.createdAt),
    }),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { currency: true },
    }),
  ]);

  return (
    <IncomeClient
      incomes={serialiseIncomes(incomeRows)}
      accounts={serialiseIncomeAccounts(accountRows)}
      currency={userRow?.currency ?? "USD"}
    />
  );
}
