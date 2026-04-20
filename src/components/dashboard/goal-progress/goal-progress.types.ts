import type { DashboardAccount, DashboardGoal } from "../dashboard-client/dashboard-client.types";

export type GoalProgressProps = {
  goals: DashboardGoal[];
  accounts: DashboardAccount[];
  netWorth: number;
  currency: string;
  onAddGoal: () => void;
  onDeleteGoal: (id: string) => void;
};
