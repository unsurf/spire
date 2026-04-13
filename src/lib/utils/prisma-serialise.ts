/**
 * Typed serializers for Prisma query results.
 *
 * Prisma returns Decimal and Date objects that aren't JSON-serializable.
 * These functions explicitly map each field to the plain types expected by
 * Client Components, replacing the JSON.parse(JSON.stringify(...)) antipattern.
 */
import type { DashboardAccount } from "@/components/dashboard/dashboard-client/dashboard-client.types";
import type { AccountDetailAccount } from "@/components/accounts/account-detail-client/account-detail-client.types";
import type {
  IncomeItem,
  IncomeAccount,
} from "@/components/income/income-client/income-client.types";

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

type PrismaAccount = {
  id: string;
  name: string;
  category: string;
  oracleEnabled: boolean;
  annualGrowthRate: number | null;
  balanceEntries: PrismaBalanceEntry[];
  splits: PrismaSplit[];
};

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

export function serialiseDashboardAccounts(accounts: PrismaAccount[]): DashboardAccount[] {
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category as DashboardAccount["category"],
    oracleEnabled: a.oracleEnabled,
    annualGrowthRate: a.annualGrowthRate,
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
