import { z } from "zod";
import { BillCycle } from "@/generated/prisma/client";

export const createBillSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  amount: z.number().positive().nullable().optional(),
  accountId: z.string().nullable().optional(),
  cycle: z.nativeEnum(BillCycle),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export const updateBillSchema = createBillSchema;
export type UpdateBillInput = CreateBillInput;
