import { useParams, useSearchParams } from "react-router-dom";
import Predict from "@/components/ml/predict/Predict";
import {
  PredictionDelete,
  PredictionsFilterbar,
  PredictionsTable,
  type DeleteTarget,
  type UpdateTarget,
} from "@/components/predictions";
import { get_model, type Model } from "@/lib/actions/models/model.action";
import {
  type Prediction,
  type PredictionListResponse,
  get_predictions,
} from "@/lib/actions/predictions";
import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageSize, Pagination } from "@/components/table";
import Loading from "@/components/loading/Loading";
import ModelDetails from "@/components/model_details/ModelDetails";
import {
  get_ml_problem,
  type MLProblem,
} from "@/lib/actions/mlProblems/mlProblem.action";
import { Fox } from "@/components/watermark/Fox";
import NotFound from "@/components/errors/not_found/NotFound";
import Explainability from "@/components/model_explainability/Explainability";
import { toast } from "sonner";
import {
  delete_prediction,
  update_prediction,
} from "@/lib/actions/predictions/prediction.action";
import type { PredictionUpdateInput } from "@/components/predictions/prediction.schema";
import PredictionUpdate from "@/components/predictions/PredictionUpdate";
import NavBarBreadcrumb from "@/components/ui/NavBarBreadcrumb";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

const ModelDetailPage = () => {
  const params = useParams<{
    datasetId: string;
    datasetVersionId: string;
    problemId: string;
    modelId: string;
  }>();
  if (!params.datasetId) {
    throw new Error("datasetId param missing");
  }
  if (!params.problemId) {
    throw new Error("problemId param missing");
  }
  if (!params.datasetVersionId) {
    throw new Error("datasetVersionId param missing");
  }
  if (!params.modelId) {
    throw new Error("modelId param missing");
  }
  const datasetId = params.datasetId;
  const datasetVersionId = params.datasetVersionId;
  const problemId = params.problemId;
  const modelId = params.modelId;

  const menu = [
    { label: "Home", href: "/dashboard/" },
    { label: "Datasets", href: "/dashboard/datasets/" },
    { label: "Versions", href: `/dashboard/datasets/${datasetId}` },
    {
      label: "ML Problems",
      href: `/dashboard/datasets/${datasetId}/${datasetVersionId}`,
    },
    {
      label: "Models",
      href: `/dashboard/datasets/${datasetId}/${datasetVersionId}/${problemId}`,
    },
  ];

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [model, setModel] = useState<Model | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<UpdateTarget | null>(null);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [tabValue, setTabValue] = useState("predictions");
  const [mlProblem, setMLProblem] = useState<MLProblem | null>(null);

  const page = Number(searchParams.get("page") ?? 1);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "created_at";
  const dir: "asc" | "desc" =
    searchParams.get("dir") === "asc" ? "asc" : "desc";
  const q = searchParams.get("q") || "";
  const id = searchParams.get("id") || "";
  const name = searchParams.get("name") || "";

  const hasActiveFilters =
    Boolean(q?.trim()) || Boolean(id?.trim()) || Boolean(name?.trim());

  const loadModel = useCallback(async () => {
    try {
      const data: Model = await get_model(modelId);
      setModel(data);
    } catch (error) {
      console.log(error);
    }
  }, [modelId]);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  const lastEntry = model ? model.name : "Predictions";

  useEffect(() => {
    async function loadMLProblem() {
      try {
        const data: MLProblem = await get_ml_problem(problemId);
        setMLProblem(data);
      } catch (error) {
        console.log(error);
      }
    }
    loadMLProblem();
  }, [problemId]);

  const metadata = model?.metadata_json
    ? JSON.parse(model?.metadata_json)
    : null;

  const explanation_summary = model?.explanation_json
    ? JSON.parse(model?.explanation_json)
    : null;

  const loadPredictions = useCallback(async () => {
    try {
      const data: PredictionListResponse = await get_predictions(modelId, {
        page,
        size,
        sort,
        dir,
        q: q || undefined,
        id: id || undefined,
        name: name || undefined,
      });
      setPredictions(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [modelId, page, size, sort, dir, q, id, name]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/events/stream`);

    const refreshOnPredict = (e: MessageEvent) => {
      const payload = JSON.parse(e.data);
      if (payload.job?.type !== "predict") return;
      if (payload.job.model_id !== modelId) return;
      if (payload.job.status === "completed") {
        toast.success("Prediction finished successfully");
      } else if (payload.job.status === "failed") {
        toast.error("Prediction failed");
      }
      loadPredictions();
    };

    eventSource.addEventListener("job.completed", refreshOnPredict);
    eventSource.addEventListener("job.failed", refreshOnPredict);

    return () => {
      eventSource.removeEventListener("job.completed", refreshOnPredict);
      eventSource.removeEventListener("job.failed", refreshOnPredict);
      eventSource.close();
    };
  }, [loadPredictions, modelId]);

  const askDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setOpenDelete(true);
  };

  const cancelDelete = () => {
    setOpenDelete(false);
    setDeleteTarget(null);
  };

  const onDelete = async (prediction_id: string) => {
    if (!prediction_id) return;
    setDeleting(true);
    const res = await delete_prediction(prediction_id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Prediction deleted");
    await loadPredictions();
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

  const onUpdate = async (
    prediction_id: string,
    data: PredictionUpdateInput,
  ) => {
    if (!prediction_id || !data) return;

    const res = await update_prediction(prediction_id, data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Prediction updated");
    await loadPredictions();
    cancelUpdate();
  };

  if (loading) {
    return <Loading />;
  }

  if (!model) return <NotFound name="Model" />;

  return (
    <div className="w-full pl-4 pt-8">
      <div className="mx-auto w-full px-6">
        {/* <h1>Model details: {model?.name ?? "Unknown Model"}</h1>
        {tabValue === "predictions" && (
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Manage all predictions of {model?.name ?? "Unknown Model"}.
          </p>
        )}
        {tabValue === "details" && (
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Details of {model?.name ?? "Unknown Model"}.
          </p>
        )}
        {tabValue === "explainability" && (
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Explain {model?.name ?? "Unknown Model"}.
          </p>
        )} */}
        <p className="text-sm text-muted-foreground">Model details</p>
        <h1 className="text-3xl font-bold tracking-tight pb-3">
          {model?.name ?? "Unknown Model"}
        </h1>
        <NavBarBreadcrumb menu={menu} lastEntry={lastEntry} />
        <Tabs className="w-full" value={tabValue} onValueChange={setTabValue}>
          <TabsList className="w-full items-center justify-start gap-2">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="explainability">Explainability</TabsTrigger>
          </TabsList>
          <TabsContent value="predictions">
            <div
              className={
                predictions.length > 0 || hasActiveFilters
                  ? "flex justify-between"
                  : "hidden"
              }
            >
              <div className="relative">
                <PredictionsFilterbar />
              </div>
              <Predict
                problemId={problemId}
                modelId={modelId}
                onCreate={loadPredictions}
              />
            </div>
            {predictions.length > 0 || hasActiveFilters ? (
              <div>
                <PredictionsTable
                  predictions={predictions}
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
                  <PredictionDelete
                    target={deleteTarget}
                    open={openDelete}
                    onConfirm={onDelete}
                    onCancel={cancelDelete}
                    deleting={deleting}
                  />
                )}
                {updateTarget && (
                  <PredictionUpdate
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
                  <p className="text-base font-semibold">No Predictions yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Run a prediction to activate this tab.
                  </p>
                  <div className="mt-5">
                    <Predict
                      problemId={problemId}
                      modelId={modelId}
                      onCreate={loadPredictions}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="details">
            {model && (
              <ModelDetails
                status={model?.status}
                datasetId={datasetId}
                datasetVersionId={datasetVersionId}
                mlProblemId={problemId}
                mlProblemName={mlProblem?.name}
                created_at={model.created_at}
                metadata={metadata}
                onRefresh={loadModel}
              />
            )}
          </TabsContent>
          <TabsContent value="explainability">
            {explanation_summary?.task ? (
              <Explainability summary={explanation_summary} />
            ) : (
              <div>No explainability data available for this model.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModelDetailPage;
