import type { NextAuthConfig } from "next-auth";
import { ROUTES } from "@/lib/constants/routes.constants";

// Edge-compatible auth config — no Prisma, no bcrypt
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: ROUTES.SIGN_IN,
  },
  providers: [],
  callbacks: {
    jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = user.onboardingComplete;
      }
      if (trigger === "update") {
        token.onboardingComplete = true;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id ?? "";
      session.user.onboardingComplete = token.onboardingComplete;
      return session;
    },
  },
};
