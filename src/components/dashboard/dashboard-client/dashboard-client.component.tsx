"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  TrendingUp,
  Plus,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { OraclePanel } from "../oracle-panel";
import { AddAccountModal } from "../add-account-modal";
import MaskedValue from "@/components/ui/masked-value";
import Sparkline from "@/components/ui/sparkline";
import { useVisibility } from "@/lib/visibility-context";
import { ACCOUNT_CATEGORY_LABELS } from "@/lib/utils";
import { formatCurrency } from "@/lib/currencies";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { OracleHorizon, SplitInput as OracleSplitInput } from "@/lib/oracle";
import { HORIZON_MONTHS, projectBalance } from "@/lib/oracle";
import { ORACLE_HORIZONS } from "@/lib/constants/oracle.constants";
import {
  CHART_COLOR_BALANCE,
  CHART_COLOR_PROJECTION,
  CHART_GRADIENT,
} from "@/lib/constants/chart.constants";
import { ROUTES } from "@/lib/constants/routes.constants";
import type {
  DashboardAccountGroupKey,
  DashboardAccount,
  DashboardClientProps,
  ChartDataPoint,
} from "./dashboard-client.types";
import {
  getCurrentBalance,
  getGreeting,
  getAccountGroups,
  getGrowthPercent,
  getSparklineData,
  buildNetWorthData,
} from "./dashboard-client.utils";

export default function DashboardClientComponent({
  accounts: initial,
  userName,
  currency,
  initialSelectedId,
}: DashboardClientProps) {
  const [accounts, setAccounts] = useState(initial);
  const [oracleOn, setOracleOn] = useState(false);
  const [horizon, setHorizon] = useState<OracleHorizon>("1y");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    initialSelectedId
  );
  const [sidebarFilter, setSidebarFilter] = useState<
    "all" | "assets" | "debts"
  >("all");
  const [expandedGroups, setExpandedGroups] = useState<
    Record<DashboardAccountGroupKey, boolean>
  >({
    accounts: true,
    investments: true,
    liabilities: true,
    loan: true,
  });
  const { hidden, toggle: toggleVisibility } = useVisibility();

  const netWorth = accounts.reduce((sum, a) => sum + getCurrentBalance(a), 0);
  const greeting = getGreeting(new Date().getHours());
  const accountGroups = getAccountGroups(accounts);
  const selectedAccount =
    selectedAccountId !== null
      ? accounts.find((a) => a.id === selectedAccountId) ?? null
      : null;

  const selectedBalanceData = selectedAccount
    ? selectedAccount.balanceEntries.map((entry, idx) => ({
        idx,
        date: new Date(entry.recordedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "2-digit",
        }),
        value: Number(entry.balance),
      }))
    : [];

  const accOracleActive = oracleOn && !!selectedAccount?.oracleEnabled;

  const selectedChartData = ((): ChartDataPoint[] => {
    const n = selectedBalanceData.length;
    if (!accOracleActive || n === 0) return selectedBalanceData;
    const projPoints = projectBalance(
      getCurrentBalance(selectedAccount!),
      selectedAccount!.annualGrowthRate,
      selectedAccount!.splits.map((s): OracleSplitInput => ({
        type: s.type,
        value: Number(s.value),
        income: { amount: Number(s.income.amount), cycle: s.income.cycle },
      })),
      HORIZON_MONTHS[horizon]
    ).map((p, i) => ({
      idx: n + i,
      date: new Date(p.date + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      proj: Math.round(p.balance * 100) / 100,
    }));
    const historical = selectedBalanceData.map((d, i) => ({
      ...d,
      proj: i === n - 1 ? d.value : undefined,
    }));
    return [...historical, ...projPoints];
  })();

  const netWorthData = buildNetWorthData(accounts);
  const netWorthDelta =
    netWorthData.length >= 2
      ? netWorthData[netWorthData.length - 1].value -
        netWorthData[netWorthData.length - 2].value
      : 0;

  const netWorthOraclePoints = (() => {
    if (!oracleOn || accounts.length === 0 || netWorthData.length === 0) return [];
    const oracleAccounts = accounts.filter((a) => a.oracleEnabled);
    if (oracleAccounts.length === 0) return [];
    const months = HORIZON_MONTHS[horizon];
    const byMonth = new Map<string, number>();
    for (const account of oracleAccounts) {
      const projected = projectBalance(
        getCurrentBalance(account),
        account.annualGrowthRate,
        account.splits.map((s): OracleSplitInput => ({
          type: s.type,
          value: Number(s.value),
          income: { amount: Number(s.income.amount), cycle: s.income.cycle },
        })),
        months
      );
      for (const p of projected) {
        byMonth.set(p.date, (byMonth.get(p.date) ?? 0) + p.balance);
      }
    }
    const sorted = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, balance]) => ({
        date: new Date(date + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        value: Math.round(balance * 100) / 100,
      }));
    const last = netWorthData[netWorthData.length - 1];
    return [
      { ...last },
      ...sorted.map((p, i) => ({ ...p, idx: netWorthData.length + i })),
    ];
  })();

  const showOracle = oracleOn && netWorthOraclePoints.length > 0;

  const netWorthChartData = (() => {
    if (!showOracle) return netWorthData.map((d) => ({ ...d, actual: d.value }));
    const historical = netWorthData.map((d, i) => ({
      ...d,
      idx: i,
      actual: d.value,
      projected: i === netWorthData.length - 1 ? d.value : undefined,
    }));
    const oracle = netWorthOraclePoints.slice(1).map((d, i) => ({
      ...d,
      idx: netWorthData.length + i,
      actual: i === 0 ? netWorthData[netWorthData.length - 1]?.value : undefined,
      projected: d.value,
    }));
    return [...historical, ...oracle];
  })();


  const netWorthYDomain = (() => {
    if (netWorthChartData.length < 2) return [0, "auto"] as [number, string];
    const values = netWorthChartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15 || max * 0.1;
    return [Math.max(0, min - padding), max + padding] as [number, number];
  })();

  const visibleGroups = accountGroups.filter((group) => {
    if (sidebarFilter === "all") return true;
    if (sidebarFilter === "assets")
      return group.key === "accounts" || group.key === "investments";
    return group.key === "liabilities" || group.key === "loan";
  });

  const handleAccountAdded = useCallback((account: DashboardAccount) => {
    setAccounts((prev) => [...prev, account]);
    setSelectedAccountId(account.id);
    setShowAddAccount(false);
  }, []);

  const toggleGroup = useCallback((groupKey: DashboardAccountGroupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }, []);

  return (
    <div className="bg-surface min-h-full">
      <div className="flex items-start">
        <aside className="w-72 shrink-0 border-r border-edge min-h-screen p-4">
          <div className="grid grid-cols-3 bg-surface-raised border border-edge rounded-lg p-1 mb-3">
            {[
              { id: "all", label: "All" },
              { id: "assets", label: "Assets" },
              { id: "debts", label: "Debts" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setSidebarFilter(tab.id as "all" | "assets" | "debts")
                }
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
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
            onClick={() => setShowAddAccount(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface-raised border border-edge text-on-surface hover:bg-edge transition-colors mb-3"
          >
            <Plus size={14} />
            New account
          </button>

          <div className="space-y-1">
            {visibleGroups.map((group) => (
              <div key={group.key}>
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center px-2 py-2 rounded-md hover:bg-surface-raised transition-colors"
                  aria-label={`${expandedGroups[group.key] ? "Collapse" : "Expand"} ${group.label}`}
                >
                  <span className="mr-1 text-subtle">
                    {expandedGroups[group.key] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </span>
                  <span className="flex-1 text-left text-sm text-on-surface">
                    {group.label}
                  </span>
                  <span className="text-sm font-medium text-on-surface">
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
                        onClick={() => setSelectedAccountId(account.id)}
                        className={`w-full text-left flex items-center justify-between pl-5 pr-2 py-1.5 rounded-md transition-colors ${
                          selectedAccountId === account.id
                            ? "bg-edge"
                            : "hover:bg-surface-raised"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted block truncate">
                            {account.name}
                          </span>
                          {sparkData.length >= 2 && (
                            <div className="mt-0.5">
                              <Sparkline
                                data={sparkData}
                                width={40}
                                height={12}
                                color={sparkColor}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0 ml-2">
                          <span className="text-xs text-muted">
                            <MaskedValue
                              amount={getCurrentBalance(account)}
                              currency={currency}
                            />
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
        </aside>

        <div className="flex-1 min-w-0 p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">
                {greeting}, {userName.split(" ")[0]}
              </h1>
              <p className="text-muted mt-0.5">
                Here&apos;s what&apos;s happening with your finances
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleVisibility}
                className="p-2 rounded-md border border-edge text-subtle hover:text-on-surface hover:bg-surface-raised transition-colors"
                aria-label={hidden ? "Show values" : "Hide values"}
              >
                {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => setOracleOn((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  oracleOn
                    ? "bg-accent border-accent text-on-accent"
                    : "bg-surface-raised border-edge text-muted hover:border-edge-strong"
                }`}
              >
                Oracle
              </button>
            </div>
          </div>

          {selectedAccount ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => setSelectedAccountId(null)}
                    className="text-muted hover:text-on-surface transition-colors"
                  >
                    Overview
                  </button>
                  <span className="text-subtle">/</span>
                  <span className="text-on-surface font-medium">
                    {selectedAccount.name}
                  </span>
                </div>
                <Link
                  href={ROUTES.ACCOUNT_DETAIL(selectedAccount.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-strong transition-colors"
                >
                  Manage account
                  <ExternalLink size={12} />
                </Link>
              </div>

              <div className="bg-surface-raised border border-edge rounded-xl p-6">
                <p className="text-xs uppercase tracking-wide text-muted mb-1">
                  Account Summary
                </p>
                <h2 className="text-2xl font-bold text-on-surface">
                  {selectedAccount.name}
                </h2>
                <p className="text-sm text-muted mt-1">
                  {ACCOUNT_CATEGORY_LABELS[selectedAccount.category]}
                </p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface border border-edge rounded-lg p-4">
                    <p className="text-xs text-muted">Current balance</p>
                    <p className="text-lg font-semibold text-on-surface mt-1">
                      <MaskedValue
                        amount={getCurrentBalance(selectedAccount)}
                        currency={currency}
                      />
                    </p>
                  </div>
                  <div className="bg-surface border border-edge rounded-lg p-4">
                    <p className="text-xs text-muted">Balance entries</p>
                    <p className="text-lg font-semibold text-on-surface mt-1">
                      {selectedAccount.balanceEntries.length}
                    </p>
                  </div>
                  <div className="bg-surface border border-edge rounded-lg p-4">
                    <p className="text-xs text-muted">Oracle</p>
                    <p className="text-lg font-semibold text-on-surface mt-1">
                      {selectedAccount.oracleEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-raised border border-edge rounded-xl">
                <div className="p-6">
                <h3 className="text-sm font-semibold text-muted mb-4">
                  Recent entries
                </h3>
                </div>
                {selectedAccount.balanceEntries.length === 0 ? (
                  <p className="text-sm text-subtle">
                    No balance history yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {oracleOn && selectedAccount.oracleEnabled && (
                        <div className="flex items-center gap-1 bg-surface border border-edge rounded-lg p-1">
                          {ORACLE_HORIZONS.map((h) => (
                            <button
                              key={h}
                              onClick={() => setHorizon(h)}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                horizon === h
                                  ? "bg-accent text-on-accent"
                                  : "text-muted hover:text-on-surface"
                              }`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={selectedChartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="dashGradBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={CHART_COLOR_BALANCE} stopOpacity={CHART_GRADIENT.BALANCE.start} />
                              <stop offset="100%" stopColor={CHART_COLOR_BALANCE} stopOpacity={CHART_GRADIENT.BALANCE.end} />
                            </linearGradient>
                            <linearGradient id="dashGradAccOracle" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={CHART_COLOR_PROJECTION} stopOpacity={CHART_GRADIENT.PROJECTION.start} />
                              <stop offset="100%" stopColor={CHART_COLOR_PROJECTION} stopOpacity={CHART_GRADIENT.PROJECTION.end} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="idx"
                            type="number"
                            domain={[0, selectedChartData.length - 1]}
                            ticks={[0, selectedChartData.length - 1]}
                            axisLine={false}
                            tickLine={false}
                            tick={(props) => {
                              const { x, y, index } = props as { x: number; y: number; payload: { value: number }; index: number };
                              const isFirst = index === 0;
                              const label = isFirst ? selectedChartData[0]?.date : selectedChartData[selectedChartData.length - 1]?.date;
                              return <text x={x} y={y + 12} textAnchor={isFirst ? "start" : "end"} fill="var(--muted)" fontSize={11}>{label ?? ""}</text>;
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const pt = payload[0].payload as { date: string; value?: number; proj?: number };
                              const isProjected = pt.proj != null && pt.value == null;
                              const val = pt.proj ?? pt.value ?? 0;
                              return (
                                <div className="bg-surface-raised border border-edge rounded-xl px-4 py-3 text-xs shadow-lg pointer-events-none">
                                  <p className="text-muted mb-1.5">{pt.date}</p>
                                  <p className="font-semibold text-on-surface">
                                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: isProjected ? CHART_COLOR_PROJECTION : CHART_COLOR_BALANCE }} />
                                    {isProjected ? "Projected" : "Balance"}: {formatCurrency(val, currency)}
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Area type="monotone" dataKey="value" stroke={CHART_COLOR_BALANCE} strokeWidth={2} fill="url(#dashGradBalance)" dot={false} activeDot={{ r: 5, fill: CHART_COLOR_BALANCE, stroke: "#fff", strokeWidth: 2 }} connectNulls={false} />
                          {accOracleActive && (
                            <Area
                              type="monotone"
                              dataKey="proj"
                              stroke={CHART_COLOR_PROJECTION}
                              strokeWidth={2}
                              strokeDasharray="6 3"
                              fill="url(#dashGradAccOracle)"
                              dot={false}
                              activeDot={{ r: 5, fill: CHART_COLOR_PROJECTION, stroke: "#fff", strokeWidth: 2 }}
                              connectNulls={false}
                              isAnimationActive={false}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                      {[...selectedAccount.balanceEntries]
                        .slice(-5)
                        .reverse()
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between border border-edge rounded-lg px-3 py-2"
                          >
                            <div>
                              <p className="text-sm text-on-surface">
                                {new Date(entry.recordedAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-subtle">
                                {entry.note ?? "No note"}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-on-surface">
                              <MaskedValue
                                amount={Number(entry.balance)}
                                currency={currency}
                              />
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-surface-raised border border-edge rounded-xl p-4">
                  <p className="text-xs text-muted uppercase tracking-wide">
                    Net Worth
                  </p>
                  <p className="text-3xl font-bold text-on-surface mt-1">
                    <MaskedValue amount={netWorth} currency={currency} />
                  </p>
                  {netWorthData.length >= 2 && (
                    <p
                      className={`text-sm font-medium mt-1 ${
                        netWorthDelta >= 0 ? "text-positive" : "text-error"
                      }`}
                    >
                      {netWorthDelta >= 0 ? "+" : ""}
                      {formatCurrency(netWorthDelta, currency)}
                    </p>
                  )}
                </div>
              </div>

              {netWorthData.length >= 2 && (
                <div className="bg-surface-raised border border-edge rounded-xl p-6 mb-6">
                  <p className="text-xs text-muted uppercase tracking-wide mb-4">
                    Net Worth Over Time
                  </p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={netWorthChartData as { idx: number; date: string; actual?: number; projected?: number }[]}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="dashGradNetWorth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLOR_BALANCE} stopOpacity={CHART_GRADIENT.BALANCE.start} />
                            <stop offset="100%" stopColor={CHART_COLOR_BALANCE} stopOpacity={CHART_GRADIENT.BALANCE.end} />
                          </linearGradient>
                          <linearGradient id="dashGradOracle" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLOR_PROJECTION} stopOpacity={CHART_GRADIENT.PROJECTION.start} />
                            <stop offset="100%" stopColor={CHART_COLOR_PROJECTION} stopOpacity={CHART_GRADIENT.PROJECTION.end} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="idx"
                          type="number"
                          domain={[0, netWorthChartData.length - 1]}
                          ticks={[0, netWorthChartData.length - 1]}
                          axisLine={false}
                          tickLine={false}
                          tick={(props) => {
                            const { x, y, index } = props as { x: number; y: number; payload: { value: number }; index: number };
                            const isFirst = index === 0;
                            const label = isFirst ? netWorthChartData[0]?.date : netWorthChartData[netWorthChartData.length - 1]?.date;
                            return <text x={x} y={y + 12} textAnchor={isFirst ? "start" : "end"} fill="var(--muted)" fontSize={11}>{label ?? ""}</text>;
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const pt = payload[0].payload as { date: string; actual?: number; projected?: number };
                            const val = pt.projected ?? pt.actual ?? 0;
                            const isProjected = pt.projected != null && pt.actual == null;
                            return (
                              <div
                                className="bg-surface-raised border border-edge rounded-xl px-4 py-3 text-xs shadow-lg pointer-events-none"
                              >
                                <p className="text-muted mb-1.5">{pt.date}</p>
                                <p className="font-semibold text-on-surface">
                                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: isProjected ? CHART_COLOR_PROJECTION : CHART_COLOR_BALANCE }} />
                                  {isProjected ? "Projected" : "Net Worth"}: {formatCurrency(val, currency)}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="actual"
                          stroke={CHART_COLOR_BALANCE}
                          strokeWidth={2}
                          fill="url(#dashGradNetWorth)"
                          dot={false}
                          activeDot={{ r: 5, fill: CHART_COLOR_BALANCE, stroke: "#fff", strokeWidth: 2 }}
                          connectNulls={false}
                        />
                        {showOracle && (
                          <Area
                            type="monotone"
                            dataKey="projected"
                            stroke={CHART_COLOR_PROJECTION}
                            strokeWidth={2}
                            strokeDasharray="6 3"
                            fill="url(#dashGradOracle)"
                            dot={false}
                            activeDot={{ r: 5, fill: CHART_COLOR_PROJECTION, stroke: "#fff", strokeWidth: 2 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {oracleOn && (
                <OraclePanel
                  accounts={accounts}
                  horizon={horizon}
                  onHorizonChange={setHorizon}
                  currency={currency}
                />
              )}

              {accounts.length === 0 ? (
                <div className="text-center py-20 text-subtle">
                  <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No accounts yet</p>
                  <p className="text-sm mt-1">
                    Add your first account to get started
                  </p>
                </div>
              ) : !oracleOn && netWorthData.length < 2 && (
                <div className="bg-surface-raised border border-edge rounded-xl p-6">
                  <p className="text-sm text-muted">
                    Select an account from the sidebar to view its summary.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddAccount && (
        <AddAccountModal
          onClose={() => setShowAddAccount(false)}
          onAdded={handleAccountAdded}
        />
      )}
    </div>
  );
}
