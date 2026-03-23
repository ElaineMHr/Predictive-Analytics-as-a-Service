import {
  PredictFormSchema,
  type PredictFormInput,
} from "@/components/ml/predict/predictForm.schema";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

type PredictResponse = { ok: true } | { ok: false; error: string };

export async function post_predict(req: unknown): Promise<PredictResponse> {
  const parsed = PredictFormSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid predict parameters.",
    };
  }

  const data: PredictFormInput = parsed.data;

  const form = new FormData();
  if (data.problem_id) form.append("problem_id", data.problem_id);
  if (data.model_id) form.append("model_id", data.model_id);
  form.append("name", data.name ?? "unknown name");
  if (data.input_csv) form.append("input_csv", data.input_csv);
  if (data.input_json) form.append("input_json", data.input_json);
  if (data.input_uri) form.append("input_uri", data.input_uri);

  const url = `${API_URL}/predict`;

  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Prediction request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error while starting prediction." };
  }
}
