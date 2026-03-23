import {
  ModelUpdateSchema,
  type ModelUpdateInput,
} from "@/components/models/model.schema";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

export type Model = {
  id: string;
  name: string;
  algorithm: string;
  train_mode: string;
  evaluation_strategy: string;
  status: "staging" | "production" | "archived" | "training" | "failed";
  metrics_json: string;
  metadata_json: string;
  explanation_json: string;
  created_at: string;
};

export type ModelListResponse = {
  items: Model[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  sort: string;
  dir: "asc" | "desc";
  q: string | null;
  id: string | null;
  name: string | null;
  algorithm: string | null;
  train_mode: string | null;
  evaluation_strategy: string | null;
  status: string | null;
};

export type ModelQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  id?: string;
  name?: string;
  algorithm?: string;
  train_mode?: string;
  evaluation_strategy?: string;
  status?: string | null;
};

export async function get_models(
  problem_id: string,
  params: ModelQueryParams = {}
): Promise<ModelListResponse> {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  if (params.sort !== undefined) search.set("sort", String(params.sort));
  if (params.dir !== undefined) search.set("dir", String(params.dir));
  if (params.q !== undefined) search.set("q", String(params.q));
  if (params.id !== undefined) search.set("id", String(params.id));
  if (params.name !== undefined) search.set("name", String(params.name));
  if (params.algorithm !== undefined)
    search.set("algorithm", String(params.algorithm));
  if (params.train_mode !== undefined)
    search.set("train_mode", String(params.train_mode));
  if (params.evaluation_strategy !== undefined)
    search.set("evaluation_strategy", String(params.evaluation_strategy));
  if (params.status !== undefined) search.set("status", String(params.status));

  const queryString = search.toString();

  const url = queryString
    ? `${API_URL}/problemModels/${problem_id}?${queryString}`
    : `${API_URL}/problemModels/${problem_id}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.status}`);
  }
  const data = await res.json();
  // console.log(`models of ${problem_id}:`, data);
  return data;
}

export async function get_model(model_id: string): Promise<Model> {
  const res = await fetch(`${API_URL}/model/${model_id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch model: ${res.status}`);
  }
  const data = await res.json();
  // console.log("model:", data);
  return data;
}

type UpdateModelResponse = { ok: true } | { ok: false; error: string };

export async function update_model(
  model_id: string,
  req: unknown
): Promise<UpdateModelResponse> {
  const parsed = ModelUpdateSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid parameters to update a model.",
    };
  }

  const data: ModelUpdateInput = parsed.data;

  const qs = new URLSearchParams({
    name: data.name,
  });

  const url = `${API_URL}/model/${model_id}?${qs}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update model request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating model.",
    };
  }
}

type DeleteModelResponse = { ok: true } | { ok: false; error: string };

export async function delete_model(
  model_id: string
): Promise<DeleteModelResponse> {
  const url = `${API_URL}/model/${model_id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Delete model request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error while deleting model." };
  }
}

export type ModelJoined = Model & {
  dataset_id: string;
  dataset_name: string;
  dataset_version_id: string;
  dataset_version_name: string | null;
  problem_id: string;
  problem_name: string | null;
};

export type ModelAllListResponse = {
  items: ModelJoined[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  sort: string;
  dir: "asc" | "desc";
  q: string | null;

  dataset_name: string | null;
  dataset_version_name: string | null;
  problem_name: string | null;

  id: string | null;
  name: string | null;
  algorithm: string | null;
  train_mode: string | null;
  evaluation_strategy: string | null;
  status: string | null;
};

export type ModelAllQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;

  dataset_name?: string;
  dataset_version_name?: string;
  problem_name?: string;

  id?: string;
  name?: string;
  algorithm?: string;
  train_mode?: string;
  evaluation_strategy?: string;
  status?: string | null;
};

export async function get_models_all(
  params: ModelAllQueryParams = {}
): Promise<ModelAllListResponse> {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  if (params.sort !== undefined) search.set("sort", String(params.sort));
  if (params.dir !== undefined) search.set("dir", String(params.dir));
  if (params.q !== undefined) search.set("q", String(params.q));

  if (params.dataset_name !== undefined)
    search.set("dataset_name", String(params.dataset_name));
  if (params.dataset_version_name !== undefined)
    search.set("dataset_version_name", String(params.dataset_version_name));
  if (params.problem_name !== undefined)
    search.set("problem_name", String(params.problem_name));

  if (params.id !== undefined) search.set("id", String(params.id));
  if (params.name !== undefined) search.set("name", String(params.name));
  if (params.algorithm !== undefined)
    search.set("algorithm", String(params.algorithm));
  if (params.train_mode !== undefined)
    search.set("train_mode", String(params.train_mode));
  if (params.evaluation_strategy !== undefined)
    search.set("evaluation_strategy", String(params.evaluation_strategy));
  if (params.status !== undefined) search.set("status", String(params.status));

  const qs = search.toString();
  const url = qs ? `${API_URL}/modelsAll?${qs}` : `${API_URL}/modelsAll`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch models_all: ${res.status}`);
  return await res.json();
}

type SetProductionResponse = { ok: true } | { ok: false; error: string };

export async function set_model_to_production(
  model_id: string
): Promise<SetProductionResponse> {
  const url = `${API_URL}/model/${model_id}/set_production`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Setting model to production request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating model.",
    };
  }
}
