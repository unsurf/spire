import type { OracleHorizon, SplitInput as OracleSplitInput } from "@/lib/oracle";
import { HORIZON_MONTHS, projectBalance } from "@/lib/oracle";
import type {
  DashboardAccount,
  DashboardAccountGroup,
  NetWorthDataPoint,
  ChartDataPoint,
  NetWorthChartPoint,
} from "./dashboard-client.types";

export function getCurrentBalance(account: DashboardAccount): number {
  if (account.balanceEntries.length === 0) return 0;
  return Number(account.balanceEntries[account.balanceEntries.length - 1].balance);
}

export function getLiveBalance(
  account: DashboardAccount,
  liveCryptoPrices?: Map<string, number>,
): number {
  if (
    account.category === "CRYPTO" &&
    account.coinId &&
    account.coinQuantity &&
    liveCryptoPrices?.has(account.coinId)
  ) {
    const price = liveCryptoPrices.get(account.coinId)!;
    return Math.round(parseFloat(account.coinQuantity) * price * 100) / 100;
  }
  return getCurrentBalance(account);
}

export function buildCryptoChartData(
  points: Array<{ date: string; price: number; ms: number }>,
  trades: Array<{ type: "BUY" | "SELL"; quantity: string; tradedAt: string }>,
): ChartDataPoint[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime(),
  );

  const result: ChartDataPoint[] = [];
  let idx = 0;
  for (const p of points) {
    let holdings = 0;
    for (const t of sorted) {
      if (new Date(t.tradedAt).getTime() > p.ms) break;
      const qty = parseFloat(t.quantity);
      holdings += t.type === "BUY" ? qty : -qty;
    }
    if (holdings > 0) {
      result.push({ idx: idx++, date: p.date, value: Math.round(p.price * holdings * 100) / 100 });
    }
  }
  return result;
}

export function getCryptoTotalGrowth(
  account: DashboardAccount,
  liveCryptoPrices: Map<string, number>,
): number | null {
  if (account.category !== "CRYPTO" || !account.coinId || !account.coinQuantity) return null;
  const livePrice = liveCryptoPrices.get(account.coinId);
  if (livePrice === undefined) return null;
  const purchaseEntry = account.balanceEntries[0];
  if (!purchaseEntry) return null;
  const purchaseValue = Number(purchaseEntry.balance);
  if (purchaseValue === 0) return null;
  const liveValue = parseFloat(account.coinQuantity) * livePrice;
  return ((liveValue - purchaseValue) / purchaseValue) * 100;
}

export function getGrowthPercent(account: DashboardAccount): number | null {
  const entries = account.balanceEntries;
  if (entries.length < 2) return null;
  const current = Number(entries[entries.length - 1].balance);
  const previous = Number(entries[entries.length - 2].balance);
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function getSparklineData(account: DashboardAccount): number[] {
  return account.balanceEntries.map((e) => Number(e.balance));
}

export function getGreeting(hour: number): string {
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";

  if (hour < 17) return "Good afternoon";
  if (hour < 0) return "Good night";
  return "Good evening";
}

export function getAccountGroups(
  accounts: DashboardAccount[],
  liveCryptoPrices?: Map<string, number>,
): DashboardAccountGroup[] {
  const groups: DashboardAccountGroup[] = [
    { key: "accounts", label: "Accounts", accounts: [], total: 0 },
    { key: "investments", label: "Investments", accounts: [], total: 0 },
    { key: "liabilities", label: "Liabilities", accounts: [], total: 0 },
    { key: "loan", label: "Loan", accounts: [], total: 0 },
  ];

  for (const account of accounts) {
    const balance = getLiveBalance(account, liveCryptoPrices);
    const groupKey =
      account.category === "CHEQUE" || account.category === "SAVINGS"
        ? "accounts"
        : account.category === "INVESTMENT" ||
            account.category === "CRYPTO" ||
            account.category === "ASSET" ||
            account.category === "HIGH_GROWTH"
          ? "investments"
          : account.category === "EMERGENCY"
            ? "liabilities"
            : "loan";

    const target = groups.find((group) => group.key === groupKey);
    if (!target) continue;
    target.accounts.push(account);
    target.total += balance;
  }

  return groups;
}

export function getVisibleGroups(
  groups: DashboardAccountGroup[],
  filter: "all" | "assets" | "debts",
): DashboardAccountGroup[] {
  return groups.filter((group) => {
    if (filter === "all") return true;
    if (filter === "assets") return group.key === "accounts" || group.key === "investments";
    return group.key === "liabilities" || group.key === "loan";
  });
}

export function buildSelectedChartData(
  account: DashboardAccount,
  oracleOn: boolean,
  horizon: OracleHorizon,
  liveValue?: number,
): ChartDataPoint[] {
  const balanceData: ChartDataPoint[] = account.balanceEntries.map((entry, idx) => ({
    idx,
    date: new Date(entry.recordedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    }),
    value: Number(entry.balance),
  }));

  const n = balanceData.length;
  const accOracleActive = oracleOn && account.oracleEnabled;

  // Inject live price as rightmost point before oracle projection
  const withLive: ChartDataPoint[] =
    liveValue !== undefined && n > 0
      ? [
          ...balanceData.slice(0, -1),
          { ...balanceData[n - 1] },
          { idx: n, date: "Live", value: liveValue, isLive: true },
        ]
      : balanceData;

  if (!accOracleActive || withLive.length === 0) return withLive;

  const liveN = withLive.length;
  const projPoints = projectBalance(
    getCurrentBalance(account),
    account.annualGrowthRate,
    account.splits.map(
      (s): OracleSplitInput => ({
        type: s.type,
        value: Number(s.value),
        income: { amount: Number(s.income.amount), cycle: s.income.cycle },
      }),
    ),
    HORIZON_MONTHS[horizon],
  ).map((p, i) => ({
    idx: liveN + i,
    date: new Date(p.date + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    proj: Math.round(p.balance * 100) / 100,
  }));

  const historical = withLive.map((d, i) => ({
    ...d,
    proj: i === liveN - 1 ? d.value : undefined,
  }));

  return [...historical, ...projPoints];
}

export function buildNetWorthOraclePoints(
  accounts: DashboardAccount[],
  oracleOn: boolean,
  horizon: OracleHorizon,
  netWorthData: NetWorthDataPoint[],
): NetWorthDataPoint[] {
  if (!oracleOn || accounts.length === 0 || netWorthData.length === 0) return [];
  const oracleAccounts = accounts.filter((a) => a.oracleEnabled);
  if (oracleAccounts.length === 0) return [];

  const months = HORIZON_MONTHS[horizon];
  const byMonth = new Map<string, number>();
  for (const account of oracleAccounts) {
    const projected = projectBalance(
      getCurrentBalance(account),
      account.annualGrowthRate,
      account.splits.map(
        (s): OracleSplitInput => ({
          type: s.type,
          value: Number(s.value),
          income: { amount: Number(s.income.amount), cycle: s.income.cycle },
        }),
      ),
      months,
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
  return [{ ...last }, ...sorted.map((p, i) => ({ ...p, idx: netWorthData.length + i }))];
}

export function buildNetWorthChartData(
  netWorthData: NetWorthDataPoint[],
  showOracle: boolean,
  oraclePoints: NetWorthDataPoint[],
): NetWorthChartPoint[] {
  if (!showOracle) return netWorthData.map((d) => ({ ...d, actual: d.value }));

  const historical = netWorthData.map((d, i) => ({
    ...d,
    idx: i,
    actual: d.value,
    projected: i === netWorthData.length - 1 ? d.value : undefined,
  }));
  const oracle = oraclePoints.slice(1).map((d, i) => ({
    ...d,
    idx: netWorthData.length + i,
    actual: i === 0 ? netWorthData[netWorthData.length - 1]?.value : undefined,
    projected: d.value,
  }));
  return [...historical, ...oracle];
}

export function buildNetWorthData(accounts: DashboardAccount[]): NetWorthDataPoint[] {
  type FlatEntry = { recordedAt: string; accountId: string; balance: number };
  const flat: FlatEntry[] = [];

  for (const account of accounts) {
    for (const entry of account.balanceEntries) {
      flat.push({
        recordedAt: entry.recordedAt,
        accountId: account.id,
        balance: Number(entry.balance),
      });
    }
  }

  if (flat.length === 0) return [];

  flat.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const runningTotals = new Map<string, number>();
  const points: NetWorthDataPoint[] = [];

  for (const entry of flat) {
    runningTotals.set(entry.accountId, entry.balance);
    const total = [...runningTotals.values()].reduce((sum, v) => sum + v, 0);
    points.push({
      idx: points.length,
      date: new Date(entry.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      }),
      value: total,
    });
  }

  return points;
}
