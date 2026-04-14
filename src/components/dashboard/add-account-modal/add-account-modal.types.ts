import type { LucideIcon } from "lucide-react";
import type { DashboardAccount } from "@/components/dashboard/dashboard-client/dashboard-client.types";

export type ModalStep = "picker" | "bank-account" | "high-growth" | "crypto";

export type AccountTypeTile = {
  id: string;
  label: string;
  icon: LucideIcon;
  step: ModalStep | null; // null = not yet implemented
};

export type CoinSearchResult = {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
};

export type AddAccountModalProps = {
  onClose: () => void;
  onAdded: (account: DashboardAccount) => void;
  currency: string;
};

export type AccountTypePickerProps = {
  onSelect: (step: ModalStep) => void;
  onClose: () => void;
};

export type BankAccountFormProps = {
  onBack: () => void;
  onClose: () => void;
  onAdded: (account: DashboardAccount) => void;
};

export type HighGrowthFormProps = {
  onBack: () => void;
  onClose: () => void;
  onAdded: (account: DashboardAccount) => void;
};

export type CryptoFormProps = {
  onBack: () => void;
  onClose: () => void;
  onAdded: (account: DashboardAccount) => void;
  currency: string;
};
