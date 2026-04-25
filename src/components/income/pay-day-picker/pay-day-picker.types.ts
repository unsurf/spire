import type { PayCycle } from "@/db/schema";

export type PayDayPickerProps = {
  cycle: PayCycle;
  payDay: string;
  payDay2: string;
  onPayDayChange: (val: string) => void;
  onPayDay2Change: (val: string) => void;
};
