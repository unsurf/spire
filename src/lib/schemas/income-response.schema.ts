/**
 * Client-safe response schemas for income API endpoints.
 *
 * Uses z.enum() string literals instead of z.nativeEnum() so this file
 * does NOT import the Prisma runtime — safe to use in Client Components.
 */
import { z } from "zod";

export const incomeSplitResponseSchema = z.object({
  id: z.string(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.string(),
  account: z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum([
      "CHEQUE",
      "SAVINGS",
      "HIGH_GROWTH",
      "EMERGENCY",
      "INVESTMENT",
      "CRYPTO",
      "ASSET",
      "OTHER",
    ]),
  }),
});

export const incomeItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.coerce.string(),
  cycle: z.enum([
    "WEEKLY",
    "FORTNIGHTLY",
    "TWICE_MONTHLY",
    "MONTHLY",
    "QUARTERLY",
    "ANNUALLY",
  ]),
  lastPaidAt: z.string().nullable(),
  splits: z.array(incomeSplitResponseSchema),
});

export const updateSplitsResponseSchema = z.array(incomeSplitResponseSchema);
