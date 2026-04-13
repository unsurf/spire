import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/ui/nav";
import { ROUTES } from "@/lib/constants/routes.constants";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.SIGN_IN);

  return (
    <div className="flex h-screen overflow-hidden">
      <Nav />
      <main className="flex-1 overflow-y-auto bg-surface">{children}</main>
    </div>
  );
}
