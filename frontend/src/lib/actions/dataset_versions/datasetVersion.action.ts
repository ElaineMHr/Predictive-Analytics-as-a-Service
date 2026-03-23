import {
  DatasetVersionSchema,
  type DatasetVersionInput,
} from "@/components/dataset_versions";
import {
  DatasetVersionUpdateSchema,
  type DatasetVersionUpdateInput,
} from "@/components/dataset_versions/datasetVersion.schema";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

export type DatasetVersion = {
  id: string;
  name: string;
  created_at: string;
  uri: string;
  filename: string;
  profile_json: string;
};

export type DatasetVersionListResponse = {
  items: DatasetVersion[];
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

export type DatasetVersionQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  id?: string;
  name?: string;
};

export async function get_dataset_versions(
  dataset_id: string,
  params: DatasetVersionQueryParams = {},
): Promise<DatasetVersionListResponse> {
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
    ? `${API_URL}/datasetVersions/${dataset_id}?${queryString}`
    : `${API_URL}/datasetVersions/${dataset_id}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset_versions: ${res.status}`);
  }
  const data = await res.json();
  // console.log(`dataset_versions of ${dataset_id}:`, data);
  return data;
}

export async function get_dataset_version(
  dataset_version_id: string,
): Promise<DatasetVersion> {
  const res = await fetch(`${API_URL}/datasetVersion/${dataset_version_id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset_version: ${res.status}`);
  }
  const data = await res.json();
  // console.log("dataset_version:", data);
  return data;
}

type CreateDatasetVersion = { ok: true } | { ok: false; error: string };

export async function create_dataset_version(
  req: unknown,
): Promise<CreateDatasetVersion> {
  const parsed = DatasetVersionSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid parameters to create a dataset version.",
    };
  }

  const data: DatasetVersionInput = parsed.data;

  // "file_id" feature currently unavailable
  if (!data.file) {
    return { ok: false, error: "Please upload a CSV file." };
  }

  const form = new FormData();
  form.append("dataset_id", data.dataset_id);
  form.append("name", data.name ?? "unknown name");
  form.append("file", data.file);

  const url = `${API_URL}/datasetVersion`;

  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Create dataset version request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while creating dataset version.",
    };
  }
}

export async function get_dataset_version_csv(uri: string): Promise<{
  column_names: string[];
  rows: Record<string, unknown>[];
}> {
  const res = await fetch(`${API_URL}/csv/${encodeURIComponent(uri)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch csv: ${res.status}`);
  }
  const data = await res.json();
  // console.log("csv:", data);
  return data;
}

type UpdateDatasetVersionResponse = { ok: true } | { ok: false; error: string };

export async function update_dataset_version(
  dataset_version_id: string,
  req: unknown,
): Promise<UpdateDatasetVersionResponse> {
  const parsed = DatasetVersionUpdateSchema.safeParse(req);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid parameters to update a dataset version.",
    };
  }

  const data: DatasetVersionUpdateInput = parsed.data;

  const qs = new URLSearchParams({
    name: data.name,
  });

  const url = `${API_URL}/datasetVersion/${dataset_version_id}?${qs}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update dataset version request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating dataset version.",
    };
  }
}

type Exclude = { exclude: string[] };

export async function update_exclude_suggestions(
  dataset_version_id: string,
  req: Exclude,
): Promise<UpdateDatasetVersionResponse> {
  const url = `${API_URL}/datasetVersion/${dataset_version_id}/exclude_suggestions`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update profile request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating profile.",
    };
  }
}

export async function calculate_profile(
  dataset_version_id: string,
): Promise<UpdateDatasetVersionResponse> {
  const url = `${API_URL}/datasetVersion/${dataset_version_id}/profile`;

  try {
    const res = await fetch(url, {
      method: "POST",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Update profile request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while updating profile.",
    };
  }
}

type DeleteDatasetVersionResponse = { ok: true } | { ok: false; error: string };

export async function delete_dataset_version(
  dataset_version_id: string,
): Promise<DeleteDatasetVersionResponse> {
  const url = `${API_URL}/datasetVersion/${dataset_version_id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Delete dataset version request failed (status ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error while deleting dataset version.",
    };
  }
}

export type DatasetVersionJoined = DatasetVersion & {
  dataset_id: string;
  dataset_name: string;
};

export type DatasetVersionAllListResponse = {
  items: DatasetVersionJoined[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
  sort: string;
  dir: "asc" | "desc";
  q: string | null;
  dataset_name: string | null;
  name: string | null;
};

export type DatasetVersionAllQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  q?: string;
  dataset_name?: string;
  name?: string;
};

export async function get_dataset_versions_all(
  params: DatasetVersionAllQueryParams = {},
): Promise<DatasetVersionAllListResponse> {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  if (params.sort !== undefined) search.set("sort", String(params.sort));
  if (params.dir !== undefined) search.set("dir", String(params.dir));
  if (params.q !== undefined) search.set("q", String(params.q));
  if (params.dataset_name !== undefined)
    search.set("dataset_name", String(params.dataset_name));
  if (params.name !== undefined) search.set("name", String(params.name));

  const queryString = search.toString();

  const url = queryString
    ? `${API_URL}/datasetVersionsAll?${queryString}`
    : `${API_URL}/datasetVersionsAll`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset_versions_all: ${res.status}`);
  }
  return await res.json();
}
