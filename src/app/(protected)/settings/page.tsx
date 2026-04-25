import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings-client";
import { ROUTES } from "@/lib/constants/routes.constants";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true, email: true, country: true, currency: true },
  });

  if (!user) redirect(ROUTES.SIGN_IN);

  return <SettingsClient user={user} />;
}
