import { auth } from "@/auth";
import prisma from "@/lib/prisma";
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

  const [account, user] = await Promise.all([
    prisma.account.findFirst({
      where: { id, userId: session.user.id },
      include: {
        balanceEntries: { orderBy: { recordedAt: "asc" } },
        splits: { include: { income: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currency: true },
    }),
  ]);

  if (!account) notFound();

  return (
    <AccountDetailClient
      account={serialiseAccountDetail(account)}
      currency={user?.currency ?? "USD"}
    />
  );
}
