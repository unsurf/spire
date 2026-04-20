"use client";

import { TrendingUp } from "lucide-react";
import MaskedValue from "@/components/ui/masked-value";
import { BalanceChart } from "@/components/balance-chart";
import { OraclePanel } from "../oracle-panel";
import { formatCurrency } from "@/lib/currencies";
import {
  CHART_COLOR_BALANCE,
  CHART_COLOR_PROJECTION,
  CHART_GRADIENT,
} from "@/lib/constants/chart.constants";
import { NetWorthBreakdown } from "../net-worth-breakdown";
import { NetWorthDeltaChart } from "../net-worth-delta-chart";
import { AccountBalancesChart } from "../account-balances-chart";
import { MonthlySnapshot } from "../monthly-snapshot";
import { GoalProgress } from "../goal-progress";
import type { OverviewViewProps } from "./overview-view.types";

export function OverviewView({
  accounts,
  bills,
  goals,
  currency,
  oracleOn,
  horizon,
  onHorizonChange,
  netWorth,
  netWorthData,
  netWorthDelta,
  netWorthChartData,
  showOracle,
  onAddGoal,
  onDeleteGoal,
}: OverviewViewProps) {
  return (
    <>
      <div className="mb-6">
        <div className="bg-surface-raised border-edge rounded-xl border pt-4">
          <div className="px-4">
            <p className="text-muted text-xs tracking-wide uppercase">Net Worth</p>
            <p className="text-on-surface mt-1 text-3xl font-bold">
              <MaskedValue amount={netWorth} currency={currency} />
            </p>
          </div>
          {netWorthData.length >= 2 && (
            <>
              <p
                className={`mt-1 px-4 text-sm font-medium ${
                  netWorthDelta >= 0 ? "text-positive" : "text-error"
                }`}
              >
                {netWorthDelta >= 0 ? "+" : ""}
                {formatCurrency(netWorthDelta, currency)}
              </p>
              <BalanceChart
                data={netWorthChartData}
                series={[
                  {
                    dataKey: "actual",
                    color: CHART_COLOR_BALANCE,
                    gradientId: "dashGradNetWorth",
                    gradientOpacity: CHART_GRADIENT.BALANCE,
                  },
                  ...(showOracle
                    ? [
                        {
                          dataKey: "projected",
                          color: CHART_COLOR_PROJECTION,
                          gradientId: "dashGradOracle",
                          gradientOpacity: CHART_GRADIENT.PROJECTION,
                          strokeDasharray: "6 3",
                          connectNulls: false,
                          isAnimationActive: false,
                        },
                      ]
                    : []),
                ]}
                tooltipContent={(pt) => {
                  const isProjected = pt.projected != null && pt.actual == null;
                  const val = pt.projected ?? pt.actual ?? 0;
                  return (
                    <div className="bg-surface-raised border-edge pointer-events-none rounded-xl border px-4 py-3 text-xs shadow-lg">
                      <p className="text-muted mb-1.5">{pt.date}</p>
                      <p className="text-on-surface font-semibold">
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: isProjected
                              ? CHART_COLOR_PROJECTION
                              : CHART_COLOR_BALANCE,
                          }}
                        />
                        {isProjected ? "Projected" : "Net Worth"}: {formatCurrency(val, currency)}
                      </p>
                    </div>
                  );
                }}
              />
            </>
          )}
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="mb-6 flex flex-col gap-4">
          <NetWorthBreakdown accounts={accounts} currency={currency} />
          <NetWorthDeltaChart netWorthData={netWorthData} currency={currency} />
          <MonthlySnapshot accounts={accounts} bills={bills} currency={currency} />
          <GoalProgress
            goals={goals}
            accounts={accounts}
            netWorth={netWorth}
            currency={currency}
            onAddGoal={onAddGoal}
            onDeleteGoal={onDeleteGoal}
          />
          <AccountBalancesChart accounts={accounts} currency={currency} />
        </div>
      )}

      {oracleOn && (
        <OraclePanel
          accounts={accounts}
          horizon={horizon}
          onHorizonChange={onHorizonChange}
          currency={currency}
        />
      )}

      {accounts.length === 0 ? (
        <div className="text-subtle py-20 text-center">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No accounts yet</p>
          <p className="mt-1 text-sm">Add your first account to get started</p>
        </div>
      ) : (
        !oracleOn &&
        netWorthData.length < 2 && (
          <div className="bg-surface-raised border-edge rounded-xl border p-6">
            <p className="text-muted text-sm">
              Select an account from the sidebar to view its summary.
            </p>
          </div>
        )
      )}
    </>
  );
}
