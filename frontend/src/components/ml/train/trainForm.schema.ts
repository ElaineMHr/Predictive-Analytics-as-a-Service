import { z } from "zod";

export const TrainFormSchema = z.object({
  problem_id: z.string().trim().min(1, "Problem id is required"),
  name: z.string().trim().min(1, "Model name is required"),
  algorithm: z.string().trim().min(1),
  train_mode: z.enum(["fast", "balanced", "accurate"]),
  evaluation_strategy: z.enum(["cv", "holdout"]),
  explanation: z.boolean(),
});

export type TrainFormInput = z.infer<typeof TrainFormSchema>;
