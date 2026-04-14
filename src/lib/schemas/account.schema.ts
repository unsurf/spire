import { z } from "zod";
import { AccountCategory } from "@/generated/prisma/client";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.nativeEnum(AccountCategory),
  annualGrowthRate: z.number().min(0).max(100).nullable().optional(),
  coinId: z.string().max(100).nullable().optional(),
  coinSymbol: z.string().max(20).nullable().optional(),
  coinQuantity: z.number().positive().nullable().optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  oracleEnabled: z.boolean().optional(),
  annualGrowthRate: z.number().min(0).max(100).nullable().optional(),
});

export const createBalanceEntrySchema = z.object({
  balance: z.number().finite("Balance must be a finite number"),
  note: z.string().max(500).nullable().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateBalanceEntryInput = z.infer<typeof createBalanceEntrySchema>;
