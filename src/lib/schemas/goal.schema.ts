import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().positive("Target must be positive"),
  accountId: z.string().nullable().optional(),
  deadline: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date")
    .nullable()
    .optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = createGoalSchema;
export type UpdateGoalInput = CreateGoalInput;
