import { z } from "zod";
import { accountCategoryEnum, payCycleEnum, splitTypeEnum } from "@/db/schema";

const splitSchema = z.object({
  accountId: z.string(),
  type: z.enum(splitTypeEnum.enumValues),
  value: z.number(),
});

const incomeSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  cycle: z.enum(payCycleEnum.enumValues),
  lastPaidAt: z.string().nullable().optional(),
  payDay: z.number().nullable().optional(),
  payDay2: z.number().nullable().optional(),
  splits: z.array(splitSchema),
});

const accountSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(accountCategoryEnum.enumValues),
});

export const onboardingSchema = z.object({
  country: z.string().min(1).max(10),
  currency: z.string().min(1).max(10),
  incomes: z.array(incomeSchema),
  accounts: z.array(accountSchema).min(1),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
