import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings-client";
import { ROUTES } from "@/lib/constants/routes.constants";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, country: true, currency: true },
  });

  if (!user) redirect(ROUTES.SIGN_IN);

  return <SettingsClient user={user} />;
}
