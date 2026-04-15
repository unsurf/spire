import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import BillsClient from "@/components/bills/bills-client";
import { ROUTES } from "@/lib/constants/routes.constants";
import { serialiseBills, serialiseIncomeAccounts } from "@/lib/utils/prisma-serialise";

export default async function BillsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const [bills, accounts, user] = await Promise.all([
    prisma.bill.findMany({
      where: { userId: session.user.id },
      include: { account: { select: { name: true } } },
      orderBy: { startDate: "asc" },
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
    <BillsClient
      bills={serialiseBills(bills)}
      accounts={serialiseIncomeAccounts(accounts)}
      currency={user?.currency ?? "USD"}
    />
  );
}
