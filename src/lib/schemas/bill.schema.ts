import { z } from "zod";
import { billCycleEnum, billCategoryEnum, billSubcategoryEnum } from "@/db/schema";

export const createBillSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  amount: z.number().positive().nullable().optional(),
  accountId: z.string().nullable().optional(),
  cycle: z.enum(billCycleEnum.enumValues),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  category: z.enum(billCategoryEnum.enumValues).nullable().optional(),
  subcategory: z.enum(billSubcategoryEnum.enumValues).nullable().optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export const updateBillSchema = createBillSchema;
export type UpdateBillInput = CreateBillInput;
