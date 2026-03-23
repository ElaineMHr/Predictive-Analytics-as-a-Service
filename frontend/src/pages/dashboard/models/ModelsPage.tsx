import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  delete_model,
  update_model,
  type ModelJoined,
} from "@/lib/actions/models/model.action";
import {
  get_models_all,
  type ModelAllListResponse,
} from "@/lib/actions/models/model.action";
import type { DeleteTarget, UpdateTarget } from "@/components/models";
import Train from "@/components/ml/train/Train";
import Predict from "@/components/ml/predict/Predict";
import { Pagination, PageSize } from "@/components/table";
import ModelDelete from "@/components/models/ModelDelete";
import ModelUpdate from "@/components/models/ModelUpdate";
import Loading from "@/components/loading/Loading";
import { Fox } from "@/components/watermark/Fox";
import { toast } from "sonner";
import type { ModelUpdateInput } from "@/components/models/model.schema";
import ModelsJoinedFilterbar from "@/components/models/joined_table/ModelsJoinedFilterbar";
import ModelsJoinedTable from "@/components/models/joined_table/ModelsJoinedTable";
import NavBarBreadcrumb from "@/components/ui/NavBarBreadcrumb";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

const ModelsPage = () => {
  const menu = [{ label: "Home", href: "/dashboard/" }];
  const lastEntry = "Models";

  const [models, setModels] = useState<ModelJoined[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [updateTarget, setUpdateTarget] = useState<UpdateTarget | null>(null);
  const [openUpdate, setOpenUpdate] = useState(false);

  const page = Number(searchParams.get("page") ?? 1);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "created_at";
  const dir: "asc" | "desc" =
    searchParams.get("dir") === "asc" ? "asc" : "desc";

  const q = searchParams.get("q") || "";
  const name = searchParams.get("name") || "";
  const algorithm = searchParams.get("algorithm") || "";
  const train_mode = searchParams.get("train_mode") || "";
  const evaluation_strategy = searchParams.get("evaluation_strategy") || "";
  const status = searchParams.get("status") || "";
  const dataset_name = searchParams.get("dataset_name") || "";
  const dataset_version_name = searchParams.get("dataset_version_name") || "";
  const problem_name = searchParams.get("problem_name") || "";

  const hasActiveFilters =
    Boolean(q?.trim()) ||
    Boolean(name?.trim()) ||
    Boolean(algorithm?.trim()) ||
    Boolean(train_mode?.trim()) ||
    Boolean(evaluation_strategy?.trim()) ||
    Boolean(status?.trim()) ||
    Boolean(dataset_name?.trim()) ||
    Boolean(dataset_version_name?.trim()) ||
    Boolean(problem_name?.trim());

  const loadModels = useCallback(async () => {
    try {
      const data: ModelAllListResponse = await get_models_all({
        page,
        size,
        sort,
        dir,
        q: q || undefined,
        name: name || undefined,
        algorithm: algorithm || undefined,
        train_mode: train_mode || undefined,
        evaluation_strategy: evaluation_strategy || undefined,
        status: status || undefined,
        dataset_name: dataset_name || undefined,
        dataset_version_name: dataset_version_name || undefined,
        problem_name: problem_name || undefined,
      });

      setModels(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    size,
    sort,
    dir,
    q,
    name,
    algorithm,
    train_mode,
    evaluation_strategy,
    status,
    dataset_name,
    dataset_version_name,
    problem_name,
  ]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/events/stream`);

    const refreshOnTrain = (e: MessageEvent) => {
      const payload = JSON.parse(e.data);
      if (payload.job?.type === "train") {
        if (payload.job?.status === "completed")
          toast.success("Training finished successfully");
      } else if (payload.job?.status === "failed") {
        toast.error("Training failed");
      }
      loadModels();
    };

    eventSource.addEventListener("job.completed", refreshOnTrain);
    eventSource.addEventListener("job.failed", refreshOnTrain);

    return () => {
      eventSource.removeEventListener("job.completed", refreshOnTrain);
      eventSource.removeEventListener("job.failed", refreshOnTrain);
      eventSource.close();
    };
  }, [loadModels]);

  const askDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setOpenDelete(true);
  };

  const cancelDelete = () => {
    setOpenDelete(false);
    setDeleteTarget(null);
  };

  const onDelete = async (model_id: string) => {
    if (!model_id) return;
    setDeleting(true);
    const res = await delete_model(model_id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Model deleted");
    await loadModels();
    cancelDelete();
    setDeleting(false);
  };

  const askUpdate = (id: string, name: string) => {
    setUpdateTarget({ id, name });
    setOpenUpdate(true);
  };

  const cancelUpdate = () => {
    setOpenUpdate(false);
    setUpdateTarget(null);
  };

  const onUpdate = async (model_id: string, data: ModelUpdateInput) => {
    if (!model_id || !data) return;
    const res = await update_model(model_id, data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Model updated");
    await loadModels();
    cancelUpdate();
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full pl-4 pt-8">
      <div className="mx-auto w-full px-6">
        <h1>Models</h1>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Browse and manage models across all datasets.
        </p>
        <NavBarBreadcrumb menu={menu} lastEntry={lastEntry} />
        <div
          className={
            models.length > 0 || hasActiveFilters
              ? "flex justify-between"
              : "hidden"
          }
        >
          <div className="relative">
            <ModelsJoinedFilterbar />
          </div>
          <div className="flex gap-2">
            <Train onCreate={loadModels} />
            <Predict onCreate={() => {}} />
          </div>
        </div>
        {models.length > 0 || hasActiveFilters ? (
          <div>
            <ModelsJoinedTable
              models={models}
              askDelete={askDelete}
              askUpdate={askUpdate}
            />

            <div className="mt-2 grid grid-cols-3 items-center">
              <div />
              {totalPages > 1 ? (
                <div className="flex justify-center">
                  <Pagination totalPages={totalPages} />
                </div>
              ) : (
                <div />
              )}
              <div className="flex justify-end">
                <PageSize size={size} />
              </div>
            </div>

            {deleteTarget && (
              <ModelDelete
                target={deleteTarget}
                open={openDelete}
                onConfirm={onDelete}
                onCancel={cancelDelete}
                deleting={deleting}
              />
            )}

            {updateTarget && (
              <ModelUpdate
                target={updateTarget}
                open={openUpdate}
                onConfirm={onUpdate}
                onCancel={cancelUpdate}
              />
            )}
          </div>
        ) : (
          <div className="relative min-h-[80vh] bg-background">
            <div className="flex items-center">
              <Fox
                aria-hidden
                size="80%"
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] m-auto"
                style={{ color: "hsl(var(--sidebar-foreground))" }}
                nodeFill="hsl(var(--sidebar-foreground))"
              />
            </div>
            <div>
              <p className="text-base font-semibold">No Models found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Train a model to activate this page.
              </p>
              <div className="mt-5">
                <Train onCreate={loadModels} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelsPage;
