import { LayoutDashboard, Wallet, CalendarDays, Settings, Receipt } from "lucide-react";
import { ROUTES } from "./routes.constants";

export type NavChild = {
  href: string;
  label: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  children?: NavChild[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.INCOME, label: "Income", icon: Wallet },
  {
    href: ROUTES.BILLS,
    label: "Bills",
    icon: Receipt,
    children: [{ href: ROUTES.BILLS_CALENDAR, label: "Bills Calendar" }],
  },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
];
