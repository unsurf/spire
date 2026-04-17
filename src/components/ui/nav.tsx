"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants/navigation.constants";
import { ROUTES } from "@/lib/constants/routes.constants";

export default function Nav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-surface-raised flex flex-col border-r border-edge shrink-0">
      <div className="px-6 py-6 border-b border-edge">
        <span className="text-on-surface font-bold text-xl tracking-tight">
          Spire
        </span>
        <p className="text-muted text-xs mt-0.5">Financial layer</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, children }) => {
          const active = pathname === href || (children ? false : pathname.startsWith(href + "/"));
          const parentActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <div key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active || (parentActive && !children)
                    ? "bg-edge text-on-surface"
                    : parentActive
                    ? "text-on-surface"
                    : "text-muted hover:text-on-surface hover:bg-edge"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>

              {children && parentActive && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 pl-5 pr-3 py-2 rounded-lg text-sm font-medium transition-colors border-l border-edge ml-2",
                          childActive
                            ? "bg-edge text-on-surface"
                            : "text-muted hover:text-on-surface hover:bg-edge"
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

      <div className="px-3 py-4 border-t border-edge">
        <button
          onClick={() => signOut({ callbackUrl: ROUTES.SIGN_IN })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-on-surface hover:bg-edge transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
