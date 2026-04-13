import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { ROUTES } from "@/lib/constants/routes.constants";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, onboardingComplete: true },
  });

  if (user?.onboardingComplete) redirect(ROUTES.DASHBOARD);

  return <OnboardingWizard userName={user?.name ?? session.user.name ?? ""} />;
}
