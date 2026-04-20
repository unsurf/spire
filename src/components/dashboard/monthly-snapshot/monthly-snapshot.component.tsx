"use client";

import { formatCurrency } from "@/lib/currencies";
import { calcMonthlyBills, calcMonthlySavings } from "@/lib/utils/finance.utils";
import MaskedValue from "@/components/ui/masked-value";
import type { MonthlySnapshotProps } from "./monthly-snapshot.types";

export function MonthlySnapshot({ accounts, bills, currency }: MonthlySnapshotProps) {
  const { total: monthlyBills, variableCount } = calcMonthlyBills(bills);
  const { monthlyIncome, savingsRate } = calcMonthlySavings(accounts, monthlyBills);

  const hasData = bills.length > 0 || monthlyIncome > 0;
  if (!hasData) return null;

  return (
    <div className="bg-surface-raised border-edge rounded-xl border p-4">
      <p className="text-muted mb-4 text-xs uppercase tracking-wide">Monthly Snapshot</p>
      <div className="grid grid-cols-3 gap-4">
        {/* Bills */}
        <div>
          <p className="text-muted mb-1 text-xs">Bills</p>
          <p className="text-on-surface text-lg font-semibold">
            <MaskedValue amount={monthlyBills} currency={currency} />
          </p>
          {variableCount > 0 && (
            <p className="text-subtle mt-0.5 text-xs">
              +{variableCount} variable
            </p>
          )}
        </div>

        {/* Income */}
        {monthlyIncome > 0 && (
          <div>
            <p className="text-muted mb-1 text-xs">Income</p>
            <p className="text-on-surface text-lg font-semibold">
              <MaskedValue amount={monthlyIncome} currency={currency} />
            </p>
          </div>
        )}

        {/* Savings rate */}
        {savingsRate !== null && (
          <div>
            <p className="text-muted mb-1 text-xs">Savings Rate</p>
            <p
              className={`text-lg font-semibold ${
                savingsRate >= 0 ? "text-positive" : "text-error"
              }`}
            >
              {savingsRate}%
            </p>
            {savingsRate >= 0 && monthlyIncome > 0 && (
              <p className="text-subtle mt-0.5 text-xs">
                {formatCurrency(monthlyIncome - monthlyBills, currency)}/mo saved
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
