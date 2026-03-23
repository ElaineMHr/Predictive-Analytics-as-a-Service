import { MLProblemSchema, type MLProblemInput } from "@/components/ml_problems";
import {
  MLProblemUpdateSchema,
  type MLProblemUpdateInput,
} from "@/components/ml_problems/ml_problem.schema";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

export type MLProblem = {
  id: string;
  name: string;
  task: string;
  target: string;
  feature_strategy_json: string;
  semantic_types: string;
  created_at: string;
};

export type MLProblemListResponse = {
  items: MLProblem[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  sort: string;
  dir: "asc" | "desc";
  q: string | null;
  id: string | null;
  task: string | null;
  target: string | null;
  name: string | null;
};

export type MLProblemQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  id?: string;
  task?: string;
  target?: string;
  name?: string;
};

export async function get_ml_problems(
  dataset_version_id: string,
  params: MLProblemQueryParams = {},
): Promise<MLProblemListResponse> {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  if (params.sort !== undefined) search.set("sort", String(params.sort));
  if (params.dir !== undefined) search.set("dir", String(params.dir));
  if (params.q !== undefined) search.set("q", String(params.q));
  if (params.id !== undefined) search.set("id", String(params.id));
  if (params.task !== undefined) search.set("task", String(params.task));
  if (params.target !== undefined) search.set("target", String(params.target));
  if (params.name !== undefined) search.set("name", String(params.name));

  const queryString = search.toString();

  const url = queryString
    ? `${API_URL}/datasetVersionProblems/${dataset_version_id}?${queryString}`
    : `${API_URL}/datasetVersionProblems/${dataset_version_id}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ml_problems: ${res.status}`);
  }
  const data = await res.json();
  // console.log(`ml_problems of ${dataset_version_id}:`, data);
  return data;
}

export async function get_ml_problem(problem_id: string): Promise<MLProblem> {
  const res = await fetch(`${API_URL}/problem/${problem_id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ml_problem: ${res.status}`);
  }
  const data = await res.json();
  // console.log("ml_problem:", data);
  return data;
}

type CreateMLProblem = { ok: true } | { ok: false; error: string };

export async function create_ml_problem(
  req: unknown,
): Promise<CreateMLProblem> {
  const parsed = MLProblemSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid parameters to create an ML problem.",
    };
  }

  const data: MLProblemInput = parsed.data;

  const qs = new URLSearchParams({
    name: data.name ?? "unknown name",
    dataset_version_id: data.dataset_version_id,
    task: data.task,
    target: data.target,
  });

  const url = `${API_URL}/problem?${qs}`;

  try {
    const res = await fetch(url, {
      method: "POST",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Create ML problem request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error while creating ML Problem." };
  }
}

type UpdateMLProblemResponse = { ok: true } | { ok: false; error: string };

export async function update_ml_problem(
  ml_problem_id: string,
  req: unknown,
): Promise<UpdateMLProblemResponse> {
  const parsed = MLProblemUpdateSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid parameters to update an ML problem.",
    };
  }

  const data: MLProblemUpdateInput = parsed.data;

  const qs = new URLSearchParams({
    name: data.name,
  });

  const url = `${API_URL}/problem/${ml_problem_id}?${qs}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update ML problem request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating ML problem.",
    };
  }
}

type FeatureStrategy = { include?: string[]; exclude?: string[] };

export async function update_feature_strategy(
  ml_problem_id: string,
  req: FeatureStrategy,
): Promise<UpdateMLProblemResponse> {
  const url = `${API_URL}/problem/${ml_problem_id}/feature_strategy`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update feature strategy request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating feature strategy.",
    };
  }
}

export async function reset_feature_strategy(
  ml_problem_id: string,
): Promise<UpdateMLProblemResponse> {
  const url = `${API_URL}/problem/${ml_problem_id}/feature_strategy/reset`;

  try {
    const res = await fetch(url, {
      method: "POST",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update feature strategy request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating feature strategy.",
    };
  }
}

type DeleteMLProblemResponse = { ok: true } | { ok: false; error: string };

export async function delete_ml_problem(
  ml_problem_id: string,
): Promise<DeleteMLProblemResponse> {
  const url = `${API_URL}/problem/${ml_problem_id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Delete ML problem request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error while deleting ML problem." };
  }
}

export type MLProblemJoined = MLProblem & {
  dataset_id: string;
  dataset_name: string;
  dataset_version_id: string;
  dataset_version_name: string | null;
};

export type MLProblemAllListResponse = {
  items: MLProblemJoined[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  sort: string;
  dir: "asc" | "desc";
  q: string | null;
  dataset_name: string | null;
  dataset_version_name: string | null;
  name: string | null;
  task: string | null;
  target: string | null;
};

export type MLProblemAllQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  dataset_name?: string;
  dataset_version_name?: string;
  name?: string;
  task?: string;
  target?: string;
};

export async function get_ml_problems_all(
  params: MLProblemAllQueryParams = {},
): Promise<MLProblemAllListResponse> {
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
  if (params.name !== undefined) search.set("name", String(params.name));
  if (params.task !== undefined) search.set("task", String(params.task));
  if (params.target !== undefined) search.set("target", String(params.target));

  const qs = search.toString();
  const url = qs
    ? `${API_URL}/mlProblemsAll?${qs}`
    : `${API_URL}/mlProblemsAll`;

  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to fetch ml_problems_all: ${res.status}`);
  return await res.json();
}
