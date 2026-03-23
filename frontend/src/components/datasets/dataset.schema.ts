import { z } from "zod";

export const DatasetSchema = z.object({
  name: z.string().trim().min(1, "Dataset name is required"),
});

export type DatasetInput = z.infer<typeof DatasetSchema>;
