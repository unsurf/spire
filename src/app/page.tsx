import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROUTES } from "@/lib/constants/routes.constants";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.SIGN_IN);
  }

  if (!session.user.onboardingComplete) {
    redirect(ROUTES.ONBOARDING);
  }

  redirect(ROUTES.DASHBOARD);
}
