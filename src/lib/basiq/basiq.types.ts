import { z } from "zod";

export const basiqTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
});

export const basiqUserResponseSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
});

export const basiqJobStepSchema = z.object({
  title: z.string(),
  status: z.string(),
  result: z.unknown().optional(),
});

export const basiqJobSchema = z.object({
  id: z.string(),
  created: z.string().optional(),
  updated: z.string().optional(),
  steps: z.array(basiqJobStepSchema),
});

export const basiqAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountNo: z.string().optional(),
  currency: z.string().optional(),
  balance: z.number().optional(),
  availableFunds: z.number().optional(),
  class: z.object({
    type: z.string().optional(),
    product: z.string().optional(),
  }).optional(),
  institution: z.string().optional(),
  connection: z.string().optional(),
  status: z.string().optional(),
});

export const basiqAccountsResponseSchema = z.object({
  data: z.array(basiqAccountSchema),
});

export const basiqConnectionSchema = z.object({
  id: z.string(),
  status: z.string(),
  institution: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).optional(),
  lastUsed: z.string().optional(),
});

export const basiqConnectionsResponseSchema = z.object({
  data: z.array(basiqConnectionSchema),
});

export type BasiqTokenResponse = z.infer<typeof basiqTokenResponseSchema>;
export type BasiqUserResponse = z.infer<typeof basiqUserResponseSchema>;
export type BasiqJob = z.infer<typeof basiqJobSchema>;
export type BasiqAccount = z.infer<typeof basiqAccountSchema>;
export type BasiqConnection = z.infer<typeof basiqConnectionSchema>;
