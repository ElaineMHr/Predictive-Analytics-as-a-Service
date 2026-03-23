import {
  DatasetSchema,
  type DatasetInput,
} from "@/components/datasets/dataset.schema";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

export type Dataset = {
  id: string;
  name: string;
  created_at: string;
};

export type DatasetListResponse = {
  items: Dataset[];
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

export type DatasetQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  id?: string;
  name?: string;
};

export async function get_datasets(
  params: DatasetQueryParams = {}
): Promise<DatasetListResponse> {
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
    ? `${API_URL}/datasets?${queryString}`
    : `${API_URL}/datasets`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch datasets: ${res.status}`);
  }
  const data = await res.json();
  return data;
}

export async function get_dataset(dataset_id: string): Promise<Dataset> {
  const url = `${API_URL}/dataset/${dataset_id}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset: ${res.status}`);
  }
  const data = await res.json();
  // console.log("dataset:", data);
  return data;
}

type CreateDatasetResponse = { ok: true } | { ok: false; error: string };

export async function create_dataset(
  req: unknown
): Promise<CreateDatasetResponse> {
  const parsed = DatasetSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid parameters to create a dataset.",
    };
  }

  const data: DatasetInput = parsed.data;

  const qs = new URLSearchParams({
    name: data.name,
  });

  const url = `${API_URL}/dataset?${qs}`;

  try {
    const res = await fetch(url, {
      method: "POST",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Create dataset request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error while creating dataset." };
  }
}

type UpdateDatasetResponse = { ok: true } | { ok: false; error: string };

export async function update_dataset(
  dataset_id: string,
  req: unknown
): Promise<UpdateDatasetResponse> {
  const parsed = DatasetSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid parameters to update a dataset.",
    };
  }

  const data: DatasetInput = parsed.data;

  const qs = new URLSearchParams({
    name: data.name,
  });

  const url = `${API_URL}/dataset/${dataset_id}?${qs}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update dataset request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error while updating dataset." };
  }
}

type DeleteDatasetResponse = { ok: true } | { ok: false; error: string };

export async function delete_dataset(
  dataset_id: string
): Promise<DeleteDatasetResponse> {
  const url = `${API_URL}/dataset/${dataset_id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Delete dataset request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error while deleting dataset." };
  }
}
