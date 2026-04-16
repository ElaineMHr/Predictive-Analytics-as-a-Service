import {
  TrainFormSchema,
  type TrainFormInput,
} from "@/components/ml/train/trainForm.schema";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

type TrainResponse = { ok: true; job_id: string } | { ok: false; error: string };

export async function post_train(req: unknown): Promise<TrainResponse> {
  const parsed = TrainFormSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid training parameters.",
    };
  }

  const data: TrainFormInput = parsed.data;

  const qs = new URLSearchParams({
    problem_id: data.problem_id,
    name: data.name,
    algorithm: data.algorithm,
    train_mode: data.train_mode,
    evaluation_strategy: data.evaluation_strategy,
    explanation: String(data.explanation),
  });

  const url = `${API_URL}/train?${qs}`;

  try {
    const res = await fetch(url, {
      method: "POST",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Training request failed (status ${res.status}).`,
      };
    }
    let job_id = "";
    try {
      const json = await res.json();
      job_id = json.job_id ?? "";
    } catch { /* ignore parse errors */ }
    return { ok: true, job_id };
  } catch {
    return { ok: false, error: "Network error while starting training." };
  }
}
