import { z } from "zod";
import { payCycleEnum, splitTypeEnum } from "@/db/schema";

export const createIncomeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  amount: z.number().finite().positive("Amount must be positive"),
  cycle: z.enum(payCycleEnum.enumValues),
  lastPaidAt: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date").nullable().optional(),
});

export const splitSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(splitTypeEnum.enumValues),
  value: z.number().finite().positive(),
});

export const updateSplitsSchema = z.object({
  splits: z.array(splitSchema),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type SplitInput = z.infer<typeof splitSchema>;
export type UpdateSplitsInput = z.infer<typeof updateSplitsSchema>;
