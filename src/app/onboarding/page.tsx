import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { ROUTES } from "@/lib/constants/routes.constants";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true, onboardingComplete: true },
  });

  if (user?.onboardingComplete) redirect(ROUTES.DASHBOARD);

  return <OnboardingWizard userName={user?.name ?? session.user.name ?? ""} />;
}
