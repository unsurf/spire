import { z } from "zod";
import { tradeTypeEnum } from "@/db/schema";

export const createTradeSchema = z.object({
  type: z.enum(tradeTypeEnum.enumValues),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  tradedAt: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  note: z.string().max(500).nullable().optional(),
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
