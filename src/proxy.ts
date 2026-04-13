import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const session = req.auth;

  const publicPaths = ["/signin", "/register"];
  const isPublicPath = publicPaths.includes(pathname);
  const isApiAuthPath = pathname.startsWith("/api/auth");
  const isApiRegisterPath = pathname === "/api/register";

  if (isApiAuthPath || isApiRegisterPath) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isLoggedIn && pathname === "/") {
    const onboardingComplete = (
      session?.user as { onboardingComplete?: boolean }
    )?.onboardingComplete;
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
