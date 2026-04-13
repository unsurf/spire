import type { AccountCategory, PayCycle, SplitType } from "@/generated/prisma/client";

export type SplitEditorSplit = {
  id: string;
  type: SplitType;
  value: string;
  account: { id: string; name: string; category: AccountCategory };
};

export type SplitEditorDraft = {
  _id: string;
  accountId: string;
  type: SplitType;
  value: string;
};

export type SplitEditorIncome = {
  id: string;
  amount: string;
  cycle: PayCycle;
  splits: SplitEditorSplit[];
};

export type SplitEditorAccount = {
  id: string;
  name: string;
  category: AccountCategory;
};

export type SplitEditorProps = {
  income: SplitEditorIncome;
  accounts: SplitEditorAccount[];
  currency: string;
  onSaved: (splits: SplitEditorSplit[]) => void;
};
