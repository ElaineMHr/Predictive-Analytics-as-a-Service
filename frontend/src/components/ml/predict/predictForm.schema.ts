import { z } from "zod";

export const PredictFormSchema = z
  .object({
    name: z.string().trim().min(1, "Prediction name is required"),
    input_csv: z.instanceof(File).optional(),
    input_json: z.string().trim().optional(),
    input_uri: z.string().trim().optional(),
    problem_id: z.string().trim().optional(),
    model_id: z.string().trim().optional(),
  })
  .refine((v) => !!v.input_csv || !!v.input_json || !!v.input_uri, {
    message: "Either an input json or an input uri must be provided.",
    path: ["input_json"],
  })
  .refine((v) => !!v.input_csv || !!v.input_json || !!v.input_uri, {
    message: "Either an input json or an input uri must be provided.",
    path: ["input_uri"],
  })
  .refine((v) => !!v.input_csv || !!v.input_json || !!v.input_uri, {
    message: "Either an input json or an input uri must be provided.",
    path: ["input_csv"],
  })
  .refine(
    (v) => !!v.problem_id || (v.model_id ?? "production") !== "production",
    {
      message: "Either a problem id or a model id must be provided.",
      path: ["problem_id"],
    }
  );

export type PredictFormInput = z.infer<typeof PredictFormSchema>;
