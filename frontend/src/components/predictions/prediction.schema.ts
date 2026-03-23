import { z } from "zod";

export const PredictionUpdateSchema = z.object({
  name: z.string().trim().min(1, "Dataset version name is required"),
});

export type PredictionUpdateInput = z.infer<typeof PredictionUpdateSchema>;
