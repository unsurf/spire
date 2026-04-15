import type { BillCycle, AccountCategory } from "@/generated/prisma/client";

export type BillItem = {
  id: string;
  name: string;
  amount: string | null;
  accountId: string | null;
  accountName: string | null;
  cycle: BillCycle;
  startDate: string; // ISO string
};

export type BillAccount = {
  id: string;
  name: string;
  category: AccountCategory;
};

export type BillsClientProps = {
  bills: BillItem[];
  accounts: BillAccount[];
  currency: string;
};
