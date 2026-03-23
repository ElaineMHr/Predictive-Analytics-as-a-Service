import {
  PredictionUpdateSchema,
  type PredictionUpdateInput,
} from "@/components/predictions/prediction.schema";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

export type Prediction = {
  id: string;
  name: string;
  status: string;
  outputs_json: string;
  created_at: string;
};

export type PredictionListResponse = {
  items: Prediction[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  sort: string;
  dir: "asc" | "desc";
  q: string | null;
  id: string | null;
  name: string | null;
};

export type PredictionQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  id?: string;
  name?: string;
};

export async function get_predictions(
  model_id: string,
  params: PredictionQueryParams = {},
): Promise<PredictionListResponse> {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  if (params.sort !== undefined) search.set("sort", String(params.sort));
  if (params.dir !== undefined) search.set("dir", String(params.dir));
  if (params.q !== undefined) search.set("q", String(params.q));
  if (params.id !== undefined) search.set("id", String(params.id));
  if (params.name !== undefined) search.set("name", String(params.name));

  const queryString = search.toString();

  const url = queryString
    ? `${API_URL}/modelPredictions/${model_id}?${queryString}`
    : `${API_URL}/modelPredictions/${model_id}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch predictions: ${res.status}`);
  }
  const data = await res.json();
  // console.log(`predictions of ${model_id}:`, data);
  return data;
}

export async function get_prediction(
  prediction_id: string,
): Promise<Prediction> {
  const res = await fetch(`${API_URL}/prediction/${prediction_id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prediction: ${res.status}`);
  }
  const data = await res.json();
  // console.log("prediction:", data);
  return data;
}

type UpdatePredictionResponse = { ok: true } | { ok: false; error: string };

export async function update_prediction(
  prediction_id: string,
  req: unknown,
): Promise<UpdatePredictionResponse> {
  const parsed = PredictionUpdateSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid parameters to update a prediction.",
    };
  }

  const data: PredictionUpdateInput = parsed.data;

  const qs = new URLSearchParams({
    name: data.name,
  });

  const url = `${API_URL}/prediction/${prediction_id}?${qs}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update prediction request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating prediction.",
    };
  }
}

type DeletePredictionResponse = { ok: true } | { ok: false; error: string };

export async function delete_prediction(
  prediction_id: string,
): Promise<DeletePredictionResponse> {
  const url = `${API_URL}/prediction/${prediction_id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Delete prediction request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error while deleting prediction." };
  }
}

export type PredictionJoined = Prediction & {
  model_id: string;
  model_name: string | null;
  problem_id: string;
  problem_name: string | null;
  dataset_version_id: string;
  dataset_version_name: string | null;
  dataset_id: string;
  dataset_name: string;
};

export type PredictionAllListResponse = {
  items: PredictionJoined[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  sort: string;
  dir: "asc" | "desc";
  q: string | null;
  name: string | null;
  dataset_name: string | null;
  dataset_version_name: string | null;
  problem_name: string | null;
  model_name: string | null;
  id: string | null;
};

export type PredictionAllQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  name?: string;
  dataset_name?: string;
  dataset_version_name?: string;
  problem_name?: string;
  model_name?: string;
  // status?: string;
  id?: string;
};

export async function get_predictions_all(
  params: PredictionAllQueryParams = {},
): Promise<PredictionAllListResponse> {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  if (params.sort !== undefined) search.set("sort", String(params.sort));
  if (params.dir !== undefined) search.set("dir", String(params.dir));
  if (params.q !== undefined) search.set("q", String(params.q));
  if (params.name !== undefined) search.set("name", String(params.name));
  if (params.dataset_name !== undefined)
    search.set("dataset_name", String(params.dataset_name));
  if (params.dataset_version_name !== undefined)
    search.set("dataset_version_name", String(params.dataset_version_name));
  if (params.problem_name !== undefined)
    search.set("problem_name", String(params.problem_name));
  if (params.model_name !== undefined)
    search.set("model_name", String(params.model_name));

  if (params.id !== undefined) search.set("id", String(params.id));

  const qs = search.toString();
  const url = qs
    ? `${API_URL}/predictionsAll?${qs}`
    : `${API_URL}/predictionsAll`;

  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to fetch predictions_all: ${res.status}`);
  return await res.json();
}

export type MLPredictionJoined = Prediction & {
  model_id: string;
  model_name: string | null;
};

export type MLPredictionAllListResponse = {
  items: MLPredictionJoined[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  sort: string;
  dir: "asc" | "desc";
  q: string | null;
  name: string | null;
  model_name: string | null;
};

export type MLPredictionAllQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  name?: string;
  model_name?: string;
};

export async function get_ml_predictions_all(
  problem_id: string,
  params: MLPredictionAllQueryParams = {},
): Promise<MLPredictionAllListResponse> {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  if (params.sort !== undefined) search.set("sort", String(params.sort));
  if (params.dir !== undefined) search.set("dir", String(params.dir));
  if (params.q !== undefined) search.set("q", String(params.q));
  if (params.name !== undefined) search.set("name", String(params.name));

  if (params.model_name !== undefined)
    search.set("model_name", String(params.model_name));

  const qs = search.toString();
  const url = qs
    ? `${API_URL}/problemPredictions/${problem_id}?${qs}`
    : `${API_URL}/problemPredictions/${problem_id}`;

  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to fetch predictions_all: ${res.status}`);
  return await res.json();
}
