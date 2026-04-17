import { z } from "zod";
import { BILL_CYCLE_VALUES } from "@/components/bills/bills-client/bills-client.constants";
import { BILL_CATEGORY_VALUES, BILL_SUBCATEGORY_VALUES } from "@/lib/constants/bills.constants";

export const billItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.string().nullable(),
  accountId: z.string().nullable(),
  accountName: z.string().nullable(),
  cycle: z.enum(BILL_CYCLE_VALUES),
  startDate: z.string(),
  category: z.enum(BILL_CATEGORY_VALUES).nullable(),
  subcategory: z.enum(BILL_SUBCATEGORY_VALUES).nullable(),
});
