import type { BillItem, BillAccount } from "../bills-client/bills-client.types";

export type BillsOverviewClientProps = {
  bills: BillItem[];
  accounts: BillAccount[];
  currency: string;
};
