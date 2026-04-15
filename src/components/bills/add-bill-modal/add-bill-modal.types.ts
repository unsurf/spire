import type { BillAccount, BillItem } from "../bills-client/bills-client.types";

export type AddBillModalProps = {
  accounts: BillAccount[];
  currency: string;
  bill?: BillItem | null;
  onClose: () => void;
  onSaved: (bill: BillItem) => void;
  onDeleted?: (id: string) => void;
};
