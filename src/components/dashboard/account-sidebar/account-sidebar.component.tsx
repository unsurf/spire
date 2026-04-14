"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import MaskedValue from "@/components/ui/masked-value";
import Sparkline from "@/components/ui/sparkline";
import { CHART_COLOR_BALANCE } from "@/lib/constants/chart.constants";
import {
  getLiveBalance,
  getGrowthPercent,
  getSparklineData,
} from "../dashboard-client/dashboard-client.utils";
import type { AccountSidebarProps } from "./account-sidebar.types";

const FILTER_TABS = [
  { id: "all" as const, label: "All" },
  { id: "assets" as const, label: "Assets" },
  { id: "debts" as const, label: "Debts" },
];

export function AccountSidebar({
  visibleGroups,
  sidebarFilter,
  onFilterChange,
  expandedGroups,
  onToggleGroup,
  selectedAccountId,
  onSelectAccount,
  onAddAccount,
  currency,
  liveCryptoPrices,
}: AccountSidebarProps) {
  return (
    <aside className="border-edge flex w-72 shrink-0 flex-col border-r">
      <div className="p-4 pb-2">
        <div className="bg-surface-raised border-edge mb-3 grid grid-cols-3 rounded-lg border p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                sidebarFilter === tab.id
                  ? "bg-edge text-on-surface"
                  : "text-muted hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onAddAccount}
          className="bg-surface-raised border-edge text-on-surface hover:bg-edge mb-1 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-1">
          {visibleGroups.map((group) => (
            <div key={group.key}>
              <button
                onClick={() => onToggleGroup(group.key)}
                className="hover:bg-surface-raised flex w-full items-center rounded-md px-2 py-2 transition-colors"
                aria-label={`${expandedGroups[group.key] ? "Collapse" : "Expand"} ${group.label}`}
              >
                <span className="text-subtle mr-1">
                  {expandedGroups[group.key] ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
                <span className="text-on-surface flex-1 text-left text-sm">{group.label}</span>
                <span className="text-on-surface text-sm font-medium">
                  <MaskedValue amount={group.total} currency={currency} />
                </span>
              </button>
              {expandedGroups[group.key] &&
                group.accounts.map((account) => {
                  const growth = getGrowthPercent(account);
                  const sparkData = getSparklineData(account);
                  const sparkColor =
                    growth !== null && growth >= 0 ? CHART_COLOR_BALANCE : "#ef4444";
                  return (
                    <button
                      key={account.id}
                      onClick={() => onSelectAccount(account.id)}
                      className={`flex w-full items-center justify-between rounded-md py-1.5 pr-2 pl-5 text-left transition-colors ${
                        selectedAccountId === account.id ? "bg-edge" : "hover:bg-surface-raised"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-muted block truncate text-xs">{account.name}</span>
                        {sparkData.length >= 2 && (
                          <div className="mt-0.5">
                            <Sparkline data={sparkData} width={40} height={12} color={sparkColor} />
                          </div>
                        )}
                      </div>
                      <div className="ml-2 flex shrink-0 flex-col items-end">
                        <span className="text-muted text-xs">
                          <MaskedValue amount={getLiveBalance(account, liveCryptoPrices)} currency={currency} />
                        </span>
                        {growth !== null && (
                          <span
                            className={`text-xs font-medium ${
                              growth >= 0 ? "text-positive" : "text-error"
                            }`}
                          >
                            {growth >= 0 ? "+" : ""}
                            {growth.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
