"use client";

import { useState, useCallback, useEffect } from "react";
import { z } from "zod";
import { Eye, EyeOff, PanelLeft, ExternalLink } from "lucide-react";
import { AddAccountModal } from "../add-account-modal";
import { AccountView } from "../account-view";
import { OverviewView } from "../overview-view";
import { AccountSidebar } from "../account-sidebar";
import { useVisibility } from "@/lib/visibility-context";
import type { OracleHorizon } from "@/lib/oracle";
import { CRYPTO_TIME_RANGE_DAYS, type CryptoTimeRange } from "@/lib/constants/crypto.constants";
import type {
  DashboardAccountGroupKey,
  DashboardAccount,
  DashboardClientProps,
  ChartDataPoint,
} from "./dashboard-client.types";
import {
  getLiveBalance,
  getGreeting,
  getAccountGroups,
  buildNetWorthData,
  buildSelectedChartData,
  buildNetWorthOraclePoints,
  buildNetWorthChartData,
  getVisibleGroups,
  buildCryptoChartData,
} from "./dashboard-client.utils";
import { isProjectableCategory } from "@/lib/utils";
import { ROUTES } from "@/lib/constants/routes.constants";

const priceSchema = z.record(z.string(), z.number());
const cachedPricesSchema = z.array(z.tuple([z.string(), z.number()]));
const historySchema = z.object({
  points: z.array(z.object({ ms: z.number(), date: z.string(), price: z.number() })),
});

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
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(initialSelectedId);
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "assets" | "debts">("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<DashboardAccountGroupKey, boolean>>({
    accounts: true,
    investments: true,
    liabilities: true,
    loan: true,
  });
  const [transactionsOpen, setTransactionsOpen] = useState(true);
  const [liveCryptoPrices, setLiveCryptoPrices] = useState<Map<string, number>>(new Map());
  const [cryptoTimeRange, setCryptoTimeRange] = useState<CryptoTimeRange>("1M");
  const [cryptoChartData, setCryptoChartData] = useState<ChartDataPoint[]>([]);
  const [cryptoChartLoading, setCryptoChartLoading] = useState(false);
  const { hidden, toggle: toggleVisibility } = useVisibility();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Reset oracle when account selection changes
  useEffect(() => {
    setOracleOn(false);
  }, [selectedAccountId]);

  // Hydrate live prices from localStorage cache on mount — prevents layout shift
  useEffect(() => {
    try {
      const cached = localStorage.getItem("spire_crypto_prices");
      if (cached) {
        const parsed = cachedPricesSchema.safeParse(JSON.parse(cached));
        if (parsed.success) setLiveCryptoPrices(new Map(parsed.data));
      }
    } catch {}
  }, []);

  // Bulk live price fetch — one request for all crypto accounts
  useEffect(() => {
    const coinIds = accounts
      .filter((a) => a.category === "CRYPTO" && a.coinId)
      .map((a) => a.coinId as string);
    if (coinIds.length === 0) return;

    fetch(`/api/prices/crypto?ids=${encodeURIComponent(coinIds.join(","))}&currency=${currency}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const parsed = priceSchema.safeParse(data);
        if (parsed.success) {
          const entries = Object.entries(parsed.data) as [string, number][];
          setLiveCryptoPrices(new Map(entries));
          try {
            localStorage.setItem("spire_crypto_prices", JSON.stringify(entries));
          } catch {}
        }
      })
      .catch(() => {});
  }, [accounts, currency]);

  // Price history fetch — fires when a crypto account is selected or time range changes
  useEffect(() => {
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;
    if (
      !selectedAccount ||
      selectedAccount.category !== "CRYPTO" ||
      !selectedAccount.coinId ||
      !selectedAccount.coinQuantity
    ) {
      setCryptoChartData([]);
      return;
    }

    const days = CRYPTO_TIME_RANGE_DAYS[cryptoTimeRange];
    setCryptoChartLoading(true);

    fetch(
      `/api/prices/crypto/history?coinId=${encodeURIComponent(selectedAccount.coinId)}&days=${days}&currency=${currency}`,
    )
      .then((r) => r.json())
      .then((data: unknown) => {
        const parsed = historySchema.safeParse(data);
        if (parsed.success)
          setCryptoChartData(buildCryptoChartData(parsed.data.points, selectedAccount.trades));
      })
      .catch(() => {})
      .finally(() => setCryptoChartLoading(false));
  }, [selectedAccountId, cryptoTimeRange, currency, accounts]);

  const selectedAccount =
    selectedAccountId !== null ? (accounts.find((a) => a.id === selectedAccountId) ?? null) : null;

  const isCryptoAccount = selectedAccount?.category === "CRYPTO" && !!selectedAccount.coinId;
  const livePrice = selectedAccount?.coinId
    ? liveCryptoPrices.get(selectedAccount.coinId)
    : undefined;
  const liveValue =
    livePrice !== undefined && selectedAccount?.coinQuantity
      ? Math.round(parseFloat(selectedAccount.coinQuantity) * livePrice * 100) / 100
      : undefined;

  const accOracleActive = oracleOn && !!selectedAccount?.oracleEnabled;
  const fallbackChartData = selectedAccount
    ? buildSelectedChartData(selectedAccount, oracleOn, horizon, liveValue)
    : [];
  const effectiveChartData =
    isCryptoAccount && cryptoChartData.length > 0 ? cryptoChartData : fallbackChartData;

  const netWorth = accounts.reduce((sum, a) => sum + getLiveBalance(a, liveCryptoPrices), 0);
  const greeting = getGreeting(new Date().getHours());
  const accountGroups = getAccountGroups(accounts, liveCryptoPrices);

  const netWorthData = buildNetWorthData(accounts);
  const netWorthDelta =
    netWorthData.length >= 2
      ? netWorthData[netWorthData.length - 1].value - netWorthData[netWorthData.length - 2].value
      : 0;

  const netWorthOraclePoints = buildNetWorthOraclePoints(accounts, oracleOn, horizon, netWorthData);
  const showOracle = oracleOn && netWorthOraclePoints.length > 0;
  const netWorthChartData = buildNetWorthChartData(netWorthData, showOracle, netWorthOraclePoints);
  const visibleGroups = getVisibleGroups(accountGroups, sidebarFilter);

  const handleAccountAdded = useCallback((account: DashboardAccount) => {
    setAccounts((prev) => [...prev, account]);
    setSelectedAccountId(account.id);
    setShowAddAccount(false);
  }, []);

  const toggleGroup = useCallback((groupKey: DashboardAccountGroupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }, []);

  return (
    <div className="bg-surface flex h-full">
      <div
        className="shrink-0 overflow-hidden border-r border-edge transition-[width] duration-300 ease-in-out"
        style={{ width: sidebarCollapsed ? 0 : 288 }}
      >
        <AccountSidebar
          accounts={accounts}
          visibleGroups={visibleGroups}
          sidebarFilter={sidebarFilter}
          onFilterChange={setSidebarFilter}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onAddAccount={() => setShowAddAccount(true)}
          currency={currency}
          liveCryptoPrices={liveCryptoPrices}
        />
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto p-8">
        {/* Row 1: panel toggle + eye/oracle */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="border-edge text-subtle hover:text-on-surface hover:bg-surface-raised shrink-0 rounded-md border p-2 transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={14} />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleVisibility}
              className="border-edge text-subtle hover:text-on-surface hover:bg-surface-raised rounded-md border p-2 transition-colors"
              aria-label={hidden ? "Show values" : "Hide values"}
            >
              {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            {selectedAccount?.oracleEnabled && isProjectableCategory(selectedAccount.category) && (
              <button
                onClick={() => setOracleOn((v) => !v)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  oracleOn
                    ? "bg-accent border-accent text-on-accent"
                    : "bg-surface-raised border-edge text-muted hover:border-edge-strong"
                }`}
              >
                Oracle
              </button>
            )}
          </div>
        </div>

        {/* Row 2: breadcrumbs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm">
            {selectedAccount ? (
              <>
                <button
                  onClick={() => setSelectedAccountId(null)}
                  className="text-muted hover:text-on-surface transition-colors"
                >
                  Overview
                </button>
                <span className="text-subtle">/</span>
                <span className="text-on-surface font-medium">{selectedAccount.name}</span>
              </>
            ) : (
              <span className="text-on-surface font-medium">Overview</span>
            )}
          </div>
          {selectedAccount && (
            <a
              href={ROUTES.ACCOUNT_DETAIL(selectedAccount.id)}
              className="text-accent hover:text-accent-strong flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              Manage account
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Row 3: greeting — overview only */}
        {!selectedAccount && (
          <div className="mb-8">
            <h1 className="text-on-surface text-2xl font-bold">
              {greeting}, {userName.split(" ")[0]}
            </h1>
            <p className="text-muted mt-0.5">
              Here&apos;s what&apos;s happening with your finances
            </p>
          </div>
        )}

        {selectedAccount ? (
          <AccountView
            selectedAccount={selectedAccount}
            currency={currency}
            oracleOn={oracleOn}
            accOracleActive={accOracleActive}
            horizon={horizon}
            onHorizonChange={setHorizon}
            chartData={effectiveChartData}
            transactionsOpen={transactionsOpen}
            onTransactionsToggle={() => setTransactionsOpen((prev) => !prev)}
            liveValue={liveValue}
            livePricePerCoin={livePrice}
            isCrypto={isCryptoAccount}
            cryptoTimeRange={cryptoTimeRange}
            onCryptoTimeRangeChange={setCryptoTimeRange}
            cryptoChartLoading={cryptoChartLoading}
          />
        ) : (
          <OverviewView
            accounts={accounts}
            currency={currency}
            oracleOn={oracleOn}
            horizon={horizon}
            onHorizonChange={setHorizon}
            netWorth={netWorth}
            netWorthData={netWorthData}
            netWorthDelta={netWorthDelta}
            netWorthChartData={netWorthChartData}
            showOracle={showOracle}
          />
        )}
      </div>

      {showAddAccount && (
        <AddAccountModal
          onClose={() => setShowAddAccount(false)}
          onAdded={handleAccountAdded}
          currency={currency}
        />
      )}
    </div>
  );
}
