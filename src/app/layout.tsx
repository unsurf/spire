import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/session-provider";
import Providers from "@/lib/providers";

export const metadata: Metadata = {
  title: "Spire",
  description: "Your personal financial layer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface text-on-surface antialiased">
        <Providers>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </Providers>
      </body>
    </html>
  );
}
