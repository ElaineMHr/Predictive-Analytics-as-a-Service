import { z } from "zod";

export const ModelUpdateSchema = z.object({
  name: z.string().trim().min(1, "Model name is required"),
});

export type ModelUpdateInput = z.infer<typeof ModelUpdateSchema>;
