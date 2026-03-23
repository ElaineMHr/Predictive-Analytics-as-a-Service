import { z } from "zod";

export const DatasetVersionSchema = z
  .object({
    name: z.string().trim().min(1, "Dataset version name is required"),
    dataset_id: z.string().trim().min(1, "Dataset id is required"),
    file: z.instanceof(File).optional(),
    file_id: z.string().optional(),
  })
  .refine((v) => !!v.file || !!v.file_id, {
    message: "Data file is required.",
    path: ["file"],
  })
  .refine((v) => !!v.file || !!v.file_id, {
    message: "Data file is required.",
    path: ["file_id"],
  });

export type DatasetVersionInput = z.infer<typeof DatasetVersionSchema>;

export const DatasetVersionUpdateSchema = z.object({
  name: z.string().trim().min(1, "Dataset version name is required"),
});

export type DatasetVersionUpdateInput = z.infer<
  typeof DatasetVersionUpdateSchema
>;
