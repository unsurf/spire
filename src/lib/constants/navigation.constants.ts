import { LayoutDashboard, Wallet, Settings } from "lucide-react";
import { ROUTES } from "./routes.constants";

export const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.INCOME, label: "Income", icon: Wallet },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
] as const;
