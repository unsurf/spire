import type { DashboardAccount, DashboardGoal } from "../dashboard-client/dashboard-client.types";

export type AddGoalModalProps = {
  accounts: DashboardAccount[];
  currency: string;
  onClose: () => void;
  onAdded: (goal: DashboardGoal) => void;
};
