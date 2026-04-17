"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import MaskedValue from "@/components/ui/masked-value";
import Sparkline from "@/components/ui/sparkline";
import { CHART_COLOR_BALANCE } from "@/lib/constants/chart.constants";
import { formatCurrency } from "@/lib/currencies";
import {
  getLiveBalance,
  getGrowthPercent,
  getCryptoTotalGrowth,
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
    <aside className="flex w-72 shrink-0 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="bg-surface-raised border-edge grid grid-cols-3 rounded-lg border p-1 flex-1 mr-2">
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
          aria-label="Add account"
          className="border-edge text-subtle hover:text-on-surface hover:bg-surface-raised shrink-0 rounded-lg border p-2 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Groups */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-3">
          {visibleGroups.map((group) => (
            <div key={group.key}>
              {/* Group header */}
              <button
                onClick={() => onToggleGroup(group.key)}
                className="hover:bg-surface-raised flex w-full items-center rounded-md px-2 py-1.5 transition-colors"
                aria-label={`${expandedGroups[group.key] ? "Collapse" : "Expand"} ${group.label}`}
              >
                <span className="text-subtle mr-1.5">
                  {expandedGroups[group.key] ? (
                    <ChevronDown size={13} />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                </span>
                <span className="text-muted flex-1 text-left text-xs font-medium">
                  {group.label}
                </span>
                <span className="text-muted text-xs font-medium tabular-nums">
                  <MaskedValue amount={group.total} currency={currency} />
                </span>
              </button>

              {/* Account cards */}
              {expandedGroups[group.key] && (
                <div className="mt-1 space-y-1.5">
                  {group.accounts.map((account) => {
                    const isSelected = selectedAccountId === account.id;
                    const growth =
                      account.category === "CRYPTO"
                        ? getCryptoTotalGrowth(account, liveCryptoPrices)
                        : getGrowthPercent(account);
                    const sparkData = getSparklineData(account);
                    const sparkColor =
                      growth !== null && growth >= 0 ? CHART_COLOR_BALANCE : "var(--error)";

                    return (
                      <button
                        key={account.id}
                        onClick={() => onSelectAccount(account.id)}
                        className={`w-full rounded-xl border px-3 pt-2.5 pb-2.5 text-left transition-all ${
                          isSelected
                            ? "border-edge-strong bg-surface-raised"
                            : "border-edge hover:border-edge-strong hover:bg-surface-raised"
                        }`}
                      >
                        {/* Top row: name + growth */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted truncate text-xs">{account.name}</span>
                          {growth !== null && (
                            <span
                              className={`ml-2 shrink-0 text-[10px] font-medium ${
                                growth >= 0 ? "text-positive" : "text-error"
                              }`}
                            >
                              {growth >= 0 ? "+" : ""}
                              {growth.toFixed(1)}%
                            </span>
                          )}
                        </div>

                        {/* Crypto: price per coin */}
                        {account.category === "CRYPTO" && account.coinId && liveCryptoPrices.get(account.coinId) !== undefined && (
                          <p className="text-subtle mt-0.5 text-[10px] tabular-nums">
                            1{account.coinSymbol ? ` ${account.coinSymbol}` : ""} = {formatCurrency(liveCryptoPrices.get(account.coinId)!, currency)}
                          </p>
                        )}

                        {/* Balance — the hero */}
                        <p className="text-on-surface mt-0.5 text-sm font-semibold tabular-nums">
                          <MaskedValue
                            amount={getLiveBalance(account, liveCryptoPrices)}
                            currency={currency}
                          />
                        </p>

                        {/* Sparkline spanning full card width */}
                        {sparkData.length >= 2 && (
                          <div className="mt-1.5">
                            <Sparkline data={sparkData} width={40} height={12} color={sparkColor} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
