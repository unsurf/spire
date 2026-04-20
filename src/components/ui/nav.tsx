"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants/navigation.constants";
import { ROUTES } from "@/lib/constants/routes.constants";

export default function Nav() {
  const pathname = usePathname();

  return (
    <aside className="bg-surface-raised border-edge flex w-60 shrink-0 flex-col border-r">
      <div className="border-edge flex items-center gap-3 border-b px-6 py-5">
        <Image
          src="/spire.png"
          alt="Spire"
          width={32}
          height={32}
          className="rounded-sm"
          unoptimized
        />
        <div>
          <span className="text-on-surface block text-xl font-bold tracking-tight">Spire</span>
          <p className="text-muted text-xs">Financial layer</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, children }) => {
          const active = pathname === href || (children ? false : pathname.startsWith(href + "/"));
          const parentActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <div key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active || (parentActive && !children)
                    ? "bg-edge text-on-surface"
                    : parentActive
                      ? "text-on-surface"
                      : "text-muted hover:text-on-surface hover:bg-edge",
                )}
              >
                <Icon size={16} />
                {label}
              </Link>

              {children && parentActive && (
                <div className="mt-0.5 ml-4 space-y-0.5">
                  {children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "border-edge ml-2 flex items-center gap-3 rounded-lg border-l py-2 pr-3 pl-5 text-sm font-medium transition-colors",
                          childActive
                            ? "bg-edge text-on-surface"
                            : "text-muted hover:text-on-surface hover:bg-edge",
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-edge border-t px-3 py-4">
        <button
          onClick={() => signOut({ callbackUrl: ROUTES.SIGN_IN })}
          className="text-muted hover:text-on-surface hover:bg-edge flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
