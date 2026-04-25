import { auth } from "@/auth";
import { db } from "@/db";
import { accounts, users, bills } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import BillsClient from "@/components/bills/bills-client";
import { ROUTES } from "@/lib/constants/routes.constants";
import { serialiseBills, serialiseIncomeAccounts } from "@/lib/utils/prisma-serialise";

export default async function BillsCalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const [billRows, accountRows, userRow] = await Promise.all([
    db.query.bills.findMany({
      where: eq(bills.userId, session.user.id),
      with: { account: { columns: { name: true } } },
      orderBy: asc(bills.startDate),
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
    <BillsClient
      bills={serialiseBills(billRows)}
      accounts={serialiseIncomeAccounts(accountRows)}
      currency={userRow?.currency ?? "USD"}
    />
  );
}
