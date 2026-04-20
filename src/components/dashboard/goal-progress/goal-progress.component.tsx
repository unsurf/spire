"use client";

import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currencies";
import MaskedValue from "@/components/ui/masked-value";
import { getGoalCurrentValue, getGoalProgress, getDaysUntilDeadline } from "./goal-progress.utils";
import type { GoalProgressProps } from "./goal-progress.types";

export function GoalProgress({
  goals,
  accounts,
  netWorth,
  currency,
  onAddGoal,
  onDeleteGoal,
}: GoalProgressProps) {
  return (
    <div className="bg-surface-raised border-edge rounded-xl border p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted text-xs uppercase tracking-wide">Goals</p>
        <button
          onClick={onAddGoal}
          className="text-accent hover:text-accent-strong flex items-center gap-1 text-xs font-medium transition-colors"
        >
          <Plus size={12} />
          Add goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-subtle text-sm">No goals yet</p>
          <p className="text-subtle mt-1 text-xs">Track progress toward savings targets</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map((goal) => {
            const current = getGoalCurrentValue(goal, accounts, netWorth);
            const target = parseFloat(goal.targetAmount);
            const progress = getGoalProgress(current, target);
            const daysLeft = getDaysUntilDeadline(goal.deadline);
            const isComplete = progress >= 100;
            const account = goal.accountId
              ? accounts.find((a) => a.id === goal.accountId)
              : null;

            return (
              <div key={goal.id}>
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-on-surface truncate text-sm font-medium">{goal.name}</p>
                    <p className="text-subtle text-xs">
                      {account ? account.name : "Net worth"} &middot;{" "}
                      <MaskedValue amount={current} currency={currency} />{" "}
                      <span className="text-subtle">
                        of {formatCurrency(target, currency)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isComplete ? "text-positive" : "text-on-surface"
                      }`}
                    >
                      {progress}%
                    </span>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-subtle hover:text-error rounded p-0.5 transition-colors"
                      aria-label="Delete goal"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-surface h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${isComplete ? "bg-positive" : ""}`}
                    style={{
                      width: `${progress}%`,
                      backgroundColor: isComplete ? undefined : "var(--data-1)",
                    }}
                  />
                </div>

                {daysLeft !== null && !isComplete && (
                  <p className={`mt-1 text-xs ${daysLeft < 0 ? "text-error" : "text-subtle"}`}>
                    {daysLeft < 0
                      ? `${Math.abs(daysLeft)}d overdue`
                      : `${daysLeft}d remaining`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
