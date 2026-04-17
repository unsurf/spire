/**
 * Typed serializers for Prisma query results.
 *
 * Prisma returns Decimal and Date objects that aren't JSON-serializable.
 * These functions explicitly map each field to the plain types expected by
 * Client Components, replacing the JSON.parse(JSON.stringify(...)) antipattern.
 */
import type { DashboardAccount, DashboardTrade } from "@/components/dashboard/dashboard-client/dashboard-client.types";
import type { AccountDetailAccount } from "@/components/accounts/account-detail-client/account-detail-client.types";
import type {
  IncomeItem,
  IncomeAccount,
} from "@/components/income/income-client/income-client.types";
import type { BillItem } from "@/components/bills/bills-client/bills-client.types";
import type { AccountDetailTrade } from "@/components/accounts/account-detail-client/account-detail-client.types";

type PrismaBalanceEntry = {
  id: string;
  balance: { toString(): string };
  note: string | null;
  recordedAt: Date;
};

type PrismaSplit = {
  id: string;
  type: string;
  value: { toString(): string };
  income: {
    id: string;
    name?: string;
    amount: { toString(): string };
    cycle: string;
  };
};

type PrismaTrade = {
  id: string;
  type: string;
  quantity: { toString(): string };
  price: { toString(): string };
  tradedAt: Date;
  note: string | null;
};

type PrismaAccountBase = {
  id: string;
  name: string;
  category: string;
  oracleEnabled: boolean;
  annualGrowthRate: number | null;
  coinId: string | null;
  coinSymbol: string | null;
  coinQuantity: { toString(): string } | null;
  balanceEntries: PrismaBalanceEntry[];
  splits: PrismaSplit[];
  trades: PrismaTrade[];
};

type PrismaAccount = PrismaAccountBase;

type PrismaIncomeSplit = {
  id: string;
  type: string;
  value: { toString(): string };
  account: {
    id: string;
    name: string;
    category: string;
  };
};

type PrismaIncome = {
  id: string;
  name: string;
  amount: { toString(): string };
  cycle: string;
  lastPaidAt: Date | null;
  splits: PrismaIncomeSplit[];
};

type PrismaAccountSimple = {
  id: string;
  name: string;
  category: string;
};

export function serialiseDashboardAccounts(accounts: PrismaAccountBase[]): DashboardAccount[] {
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category as DashboardAccount["category"],
    oracleEnabled: a.oracleEnabled,
    annualGrowthRate: a.annualGrowthRate,
    coinId: a.coinId,
    coinSymbol: a.coinSymbol,
    coinQuantity: a.coinQuantity?.toString() ?? null,
    trades: a.trades.map((t) => ({
      id: t.id,
      type: t.type as DashboardTrade["type"],
      quantity: t.quantity.toString(),
      price: t.price.toString(),
      tradedAt: t.tradedAt.toISOString(),
      note: t.note,
    })),
    balanceEntries: a.balanceEntries.map((e) => ({
      id: e.id,
      balance: e.balance.toString(),
      note: e.note,
      recordedAt: e.recordedAt.toISOString(),
    })),
    splits: a.splits.map((s) => ({
      id: s.id,
      type: s.type as DashboardAccount["splits"][number]["type"],
      value: s.value.toString(),
      income: {
        id: s.income.id,
        amount: s.income.amount.toString(),
        cycle: s.income.cycle as DashboardAccount["splits"][number]["income"]["cycle"],
      },
    })),
  }));
}

export function serialiseAccountDetail(account: PrismaAccount): AccountDetailAccount {
  return {
    id: account.id,
    name: account.name,
    category: account.category as AccountDetailAccount["category"],
    oracleEnabled: account.oracleEnabled,
    annualGrowthRate: account.annualGrowthRate,
    coinId: account.coinId,
    coinSymbol: account.coinSymbol,
    coinQuantity: account.coinQuantity?.toString() ?? null,
    trades: account.trades.map((t) => ({
      id: t.id,
      type: t.type as AccountDetailTrade["type"],
      quantity: t.quantity.toString(),
      price: t.price.toString(),
      tradedAt: t.tradedAt.toISOString(),
      note: t.note,
    })),
    balanceEntries: account.balanceEntries.map((e) => ({
      id: e.id,
      balance: e.balance.toString(),
      note: e.note,
      recordedAt: e.recordedAt.toISOString(),
    })),
    splits: account.splits.map((s) => ({
      id: s.id,
      type: s.type as AccountDetailAccount["splits"][number]["type"],
      value: s.value.toString(),
      income: {
        id: s.income.id,
        name: s.income.name ?? "",
        amount: s.income.amount.toString(),
        cycle: s.income.cycle as AccountDetailAccount["splits"][number]["income"]["cycle"],
      },
    })),
  };
}

export function serialiseIncomes(incomes: PrismaIncome[]): IncomeItem[] {
  return incomes.map((inc) => ({
    id: inc.id,
    name: inc.name,
    amount: inc.amount.toString(),
    cycle: inc.cycle as IncomeItem["cycle"],
    lastPaidAt: inc.lastPaidAt ? inc.lastPaidAt.toISOString() : null,
    splits: inc.splits.map((s) => ({
      id: s.id,
      type: s.type as IncomeItem["splits"][number]["type"],
      value: s.value.toString(),
      account: {
        id: s.account.id,
        name: s.account.name,
        category: s.account.category as IncomeItem["splits"][number]["account"]["category"],
      },
    })),
  }));
}

export function serialiseIncomeAccounts(accounts: PrismaAccountSimple[]): IncomeAccount[] {
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category as IncomeAccount["category"],
  }));
}

type PrismaBill = {
  id: string;
  name: string;
  amount: { toString(): string } | null;
  accountId: string | null;
  cycle: string;
  startDate: Date;
  category: string | null;
  subcategory: string | null;
  account: { name: string } | null;
};

export function serialiseBills(bills: PrismaBill[]): BillItem[] {
  return bills.map((b) => ({
    id: b.id,
    name: b.name,
    amount: b.amount ? b.amount.toString() : null,
    accountId: b.accountId,
    accountName: b.account?.name ?? null,
    cycle: b.cycle as BillItem["cycle"],
    startDate: b.startDate.toISOString(),
    category: b.category as BillItem["category"],
    subcategory: b.subcategory as BillItem["subcategory"],
  }));
}
