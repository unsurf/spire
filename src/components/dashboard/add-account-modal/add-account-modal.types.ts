import type { DashboardAccount } from "@/components/dashboard/dashboard-client/dashboard-client.types";

export type AddAccountModalProps = {
  onClose: () => void;
  onAdded: (account: DashboardAccount) => void;
};
