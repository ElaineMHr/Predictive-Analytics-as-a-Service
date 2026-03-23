import { z } from "zod";

export const MLProblemSchema = z.object({
  name: z.string().trim().min(1, "ML problem name is required"),
  dataset_version_id: z
    .string()
    .trim()
    .min(1, "Dataset version id is required"),
  task: z.string().trim().min(1, "Task definition is required"),
  target: z.string().trim().min(1, "Target column is required"),
});

export type MLProblemInput = z.infer<typeof MLProblemSchema>;

export const MLProblemUpdateSchema = z.object({
  name: z.string().trim().min(1, "ML problem name is required"),
});

export type MLProblemUpdateInput = z.infer<typeof MLProblemUpdateSchema>;
