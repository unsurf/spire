import {
  Landmark,
  TrendingUp,
  Bitcoin,
  PiggyBank,
  Shield,
  CreditCard,
  Home,
  Car,
  Package,
  Minus,
} from "lucide-react";
import type { AccountTypeTile } from "./add-account-modal.types";

export const ACCOUNT_TYPE_TILES: AccountTypeTile[] = [
  { id: "bank-account", label: "Bank Account", icon: Landmark, step: "bank-account" },
  { id: "high-growth", label: "High Growth", icon: PiggyBank, step: "high-growth" },
  { id: "stock", label: "Stock", icon: TrendingUp, step: null },
  { id: "crypto", label: "Crypto", icon: Bitcoin, step: "crypto" },
  { id: "retirement", label: "Retirement Fund", icon: Shield, step: null },
  { id: "loan", label: "Loan", icon: CreditCard, step: null },
  { id: "property", label: "Property", icon: Home, step: null },
  { id: "vehicle", label: "Vehicle", icon: Car, step: null },
  { id: "other-asset", label: "Other Asset", icon: Package, step: null },
  { id: "other-liability", label: "Other Liability", icon: Minus, step: null },
];
