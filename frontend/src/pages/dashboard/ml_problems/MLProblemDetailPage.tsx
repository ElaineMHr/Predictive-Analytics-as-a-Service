import { useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  get_ml_problem,
  type MLProblem,
} from "../../../lib/actions/mlProblems/mlProblem.action";
import {
  delete_model,
  get_models,
  set_model_to_production,
  update_model,
  type Model,
  type ModelListResponse,
} from "../../../lib/actions/models/model.action";
import type { DeleteTarget, UpdateTarget } from "@/components/models";
import ModelsTable from "@/components/models/ModelsTable";
import Train from "@/components/ml/train/Train";
import Predict from "@/components/ml/predict/Predict";
import MLProblemDetails from "@/components/ml_problem_details/MLProblemDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModelDelete from "@/components/models/ModelDelete";
import ModelsFilterbar from "@/components/models/ModelsFilterbar";
import ModelUpdate from "@/components/models/ModelUpdate";
import { Pagination, PageSize } from "@/components/table";
import {
  get_dataset_version,
  type DatasetVersion,
} from "@/lib/actions/dataset_versions";
import type { Profile } from "../dataset_versions/DatasetVersionDetailPage";
import Loading from "@/components/loading/Loading";
import NotFound from "@/components/errors/not_found/NotFound";
import { Fox } from "@/components/watermark/Fox";
import { toast } from "sonner";
import type { ModelUpdateInput } from "@/components/models/model.schema";
import type { SetProdTarget } from "@/components/model_details/SetModelProduction";
import SetModelProduction from "@/components/model_details/SetModelProduction";
import {
  delete_prediction,
  get_ml_predictions_all,
  update_prediction,
  type MLPredictionAllListResponse,
  type MLPredictionJoined,
} from "@/lib/actions/predictions/prediction.action";
import MLPredictionsTable from "@/components/ml_predictions/ml_predictions_table/MLPredictionsJoinedTable";
import {
  PredictionDelete,
  type PredictionUpdateInput,
} from "@/components/predictions";
import PredictionUpdate from "@/components/predictions/PredictionUpdate";
import MLPredictionsJoinedFilterbar from "@/components/ml_predictions/ml_predictions_table/MLPredictionsJoinedFilterbar";
import NavBarBreadcrumb from "@/components/ui/NavBarBreadcrumb";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

export type FeatureStrategy = {
  include: string[];
  exclude: string[];
};

const MLProblemDetailPage = () => {
  const params = useParams<{
    datasetId: string;
    datasetVersionId: string;
    problemId: string;
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
  const datasetId = params.datasetId;
  const datasetVersionId = params.datasetVersionId;
  const problemId = params.problemId;

  const menu = [
    { label: "Home", href: "/dashboard/" },
    { label: "Datasets", href: "/dashboard/datasets/" },
    { label: "Versions", href: `/dashboard/datasets/${datasetId}` },
    {
      label: "ML Problems",
      href: `/dashboard/datasets/${datasetId}/${datasetVersionId}`,
    },
  ];

  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [mlProblem, setMLProblem] = useState<MLProblem | null>(null);
  const [datasetVersion, setDatasetVersion] = useState<DatasetVersion | null>(
    null,
  );
  const [predictions, setPredictions] = useState<MLPredictionJoined[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [predTotalPages, setPredTotalPages] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<UpdateTarget | null>(null);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [deleteTargetPred, setDeleteTargetPred] = useState<DeleteTarget | null>(
    null,
  );
  const [openDeletePred, setOpenDeletePred] = useState(false);
  const [deletingPred, setDeletingPred] = useState(false);
  const [updateTargetPred, setUpdateTargetPred] = useState<UpdateTarget | null>(
    null,
  );
  const [openUpdatePred, setOpenUpdatePred] = useState(false);
  const [tabValue, setTabValue] = useState("models");
  const [featureStrategy, setFeatureStrategy] = useState<FeatureStrategy>({
    include: [],
    exclude: [],
  });
  const [setProdTarget, setSetProdTarget] = useState<SetProdTarget | null>(
    null,
  );
  const [setting, setSetting] = useState(false);
  const [openSetProd, setOpenSetProd] = useState(false);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [hasAnyModels, setHasAnyModels] = useState(false);
  const [hasRunnableModel, setHasRunnableModel] = useState(false);

  const page = Number(searchParams.get("page") ?? 1);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "created_at";
  const dir: "asc" | "desc" =
    searchParams.get("dir") === "asc" ? "asc" : "desc";
  const q = searchParams.get("q") || "";
  const id = searchParams.get("id") || "";
  const name = searchParams.get("name") || "";
  const algorithm = searchParams.get("algorithm") || "";
  const train_mode = searchParams.get("train_mode") || "";
  const evaluation_strategy = searchParams.get("evaluation_strategy") || "";
  const status = searchParams.get("status") || "";

  const predpage = Number(searchParams.get("predpage") ?? 1);
  const predsize = Number(searchParams.get("predsize") ?? 20);
  const predsort = searchParams.get("predsort") ?? "created_at";
  const preddir: "asc" | "desc" =
    searchParams.get("preddir") === "asc" ? "asc" : "desc";
  const predq = searchParams.get("predq") || "";
  const predmodel_name = searchParams.get("predmodel_name") || "";
  const predname = searchParams.get("predname") || "";

  const hasActiveFilters =
    Boolean(q?.trim()) ||
    Boolean(id?.trim()) ||
    Boolean(name?.trim()) ||
    Boolean(algorithm?.trim()) ||
    Boolean(train_mode?.trim()) ||
    Boolean(evaluation_strategy?.trim()) ||
    Boolean(status?.trim());

  const hasActiveFiltersPred =
    Boolean(predq?.trim()) ||
    Boolean(predmodel_name?.trim()) ||
    Boolean(predname?.trim());

  const loadMLProblem = useCallback(async () => {
    try {
      const data: MLProblem = await get_ml_problem(problemId);
      setMLProblem(data);
    } catch (error) {
      console.log(error);
    }
  }, [problemId]);

  useEffect(() => {
    loadMLProblem();
  }, [loadMLProblem]);

  const lastEntry = mlProblem ? mlProblem.name : "Models";

  const loadDatasetVersion = useCallback(async () => {
    try {
      const data: DatasetVersion = await get_dataset_version(datasetVersionId);
      setDatasetVersion(data);
    } catch (error) {
      console.log(error);
    }
  }, [datasetVersionId]);

  useEffect(() => {
    loadDatasetVersion();
  }, [loadDatasetVersion]);

  const refreshHasAnyModels = useCallback(async () => {
    const res = await get_models(problemId);
    setHasAnyModels(res.items.length > 0);
    setHasRunnableModel(
      res.items.some((m) => m.status !== "training" && m.status !== "failed"),
    );
  }, [problemId]);

  useEffect(() => {
    refreshHasAnyModels();
  }, [refreshHasAnyModels]);

  const loadModels = useCallback(async () => {
    try {
      const data: ModelListResponse = await get_models(problemId, {
        page,
        size,
        sort,
        dir,
        q: q || undefined,
        id: id || undefined,
        name: name || undefined,
        algorithm: algorithm || undefined,
        train_mode: train_mode || undefined,
        evaluation_strategy: evaluation_strategy || undefined,
        status: status || undefined,
      });
      setModels(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [
    problemId,
    page,
    size,
    sort,
    dir,
    q,
    id,
    name,
    algorithm,
    train_mode,
    evaluation_strategy,
    status,
  ]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const loadPredictions = useCallback(async () => {
    try {
      const data: MLPredictionAllListResponse = await get_ml_predictions_all(
        problemId,
        {
          page: predpage,
          size: predsize,
          sort: predsort,
          dir: preddir,
          q: predq || undefined,
          model_name: predmodel_name || undefined,
          name: predname || undefined,
        },
      );
      setPredictions(data.items);
      setPredTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    }
  }, [
    problemId,
    predpage,
    predsize,
    predsort,
    preddir,
    predq,
    predmodel_name,
    predname,
  ]);

  useEffect(() => {
    if (!hasRunnableModel) return;
    loadPredictions();
  }, [hasRunnableModel, loadPredictions]);

  useEffect(() => {
    if (!mlProblem || !datasetVersion) return;
    const feature_strategy = mlProblem.feature_strategy_json
      ? JSON.parse(mlProblem.feature_strategy_json)
      : "auto";
    const profile: Profile = datasetVersion?.profile_json
      ? JSON.parse(datasetVersion?.profile_json)
      : null;
    if (feature_strategy === "auto") {
      const exclude = Object.values(profile?.exclude_suggestions ?? {});
      setFeatureStrategy({
        include: [],
        exclude: exclude,
      });
    } else {
      const include: string[] = Object.values(feature_strategy?.include ?? {});
      const exclude: string[] = Object.values(
        feature_strategy?.exclude ?? profile?.exclude_suggestions ?? {},
      );
      setFeatureStrategy({
        include: include,
        exclude: exclude,
      });
    }
    const columnNames = Object.keys(profile.columns);
    setColumnNames(columnNames);
  }, [mlProblem, datasetVersion]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/events/stream`);

    const refreshOnEvent = (e: MessageEvent) => {
      const payload = JSON.parse(e.data);

      const job = payload?.job;
      if (!job) return;

      if (job.problem_id !== problemId) return;

      const type = job.type;
      const status = job.status;

      if (type === "train") {
        if (status === "completed")
          toast.success("Training finished successfully");
        if (status === "failed") toast.error("Training failed");
        refreshHasAnyModels();
        loadModels();
      }

      if (type === "predict") {
        if (status === "completed")
          toast.success("Prediction finished successfully");
        if (status === "failed") toast.error("Prediction failed");
        loadPredictions();
      }
    };

    eventSource.addEventListener("job.completed", refreshOnEvent);
    eventSource.addEventListener("job.failed", refreshOnEvent);

    return () => {
      eventSource.removeEventListener("job.completed", refreshOnEvent);
      eventSource.removeEventListener("job.failed", refreshOnEvent);
      eventSource.close();
    };
  }, [loadModels, refreshHasAnyModels, loadPredictions, problemId]);

  const prodModel = models.find((model) => model.status === "production");
  const prodModelName = prodModel?.name;
  const prodModelId = prodModel?.id;

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
    await refreshHasAnyModels();
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

  const askSetProd = (id: string, name: string) => {
    setSetProdTarget({ id, name });
    setOpenSetProd(true);
  };

  const cancelSetProd = () => {
    setOpenSetProd(false);
    setSetProdTarget(null);
  };

  const onSetProd = async (model_id: string) => {
    if (!model_id) return;
    setSetting(true);
    const res = await set_model_to_production(model_id);
    if (!res.ok) {
      toast.error(res.error);
      setSetting(false);
      return;
    }
    toast.success("Model set to production");
    await loadModels();
    cancelSetProd();
    setSetting(false);
  };

  const askDeletePred = (id: string, name: string) => {
    setDeleteTargetPred({ id, name });
    setOpenDeletePred(true);
  };

  const cancelDeletePred = () => {
    setOpenDeletePred(false);
    setDeleteTargetPred(null);
  };

  const onDeletePred = async (prediction_id: string) => {
    if (!prediction_id) return;
    setDeletingPred(true);
    const res = await delete_prediction(prediction_id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Prediction deleted");
    await loadPredictions();
    cancelDeletePred();
    setDeletingPred(false);
  };

  const askUpdatePred = (id: string, name: string) => {
    setUpdateTargetPred({ id, name });
    setOpenUpdatePred(true);
  };

  const cancelUpdatePred = () => {
    setOpenUpdatePred(false);
    setUpdateTargetPred(null);
  };

  const onUpdatePred = async (
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
    cancelUpdatePred();
  };

  if (loading) {
    return <Loading />;
  }

  if (!mlProblem) return <NotFound name="ML Problem" />;

  return (
    <div>
      <div className="w-full pl-4 pt-8">
        <div className="mx-auto w-full px-6">
          {/* <h1>ML problem details: {mlProblem?.name ?? "Unknown ML Problem"}</h1>
          {tabValue === "models" && (
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Manage all models of {mlProblem?.name ?? "Unknown ML Problem"}.
            </p>
          )}
          {tabValue === "configuration" && (
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Manage the configuration of{" "}
              {mlProblem?.name ?? "Unknown ML Problem"}.
            </p>
          )}
          {tabValue === "predictions" && (
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Manage the predictions of{" "}
              {mlProblem?.name ?? "Unknown ML Problem"}.
            </p>
          )} */}
          <p className="text-sm text-muted-foreground">ML problem details</p>
          <h1 className="text-3xl font-bold tracking-tight pb-3">
            {mlProblem?.name ?? "Unknown ML Problem"}
          </h1>
          <NavBarBreadcrumb menu={menu} lastEntry={lastEntry} />
          <Tabs className="w-full" value={tabValue} onValueChange={setTabValue}>
            <TabsList className="w-full items-center justify-start gap-2">
              <TabsTrigger value="models">Models</TabsTrigger>
              {hasAnyModels ? (
                <TabsTrigger value="configuration">Configured</TabsTrigger>
              ) : (
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
              )}
              {hasRunnableModel && (
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="models">
              <div
                className={
                  models.length > 0 || hasActiveFilters
                    ? "flex justify-between"
                    : "hidden"
                }
              >
                <div className="relative">
                  <ModelsFilterbar />
                </div>
                <div className="flex gap-2">
                  <Train
                    problemId={problemId}
                    task={mlProblem.task}
                    onCreate={loadModels}
                  />
                  <Predict problemId={problemId} onCreate={loadPredictions} />
                </div>
              </div>
              {models.length > 0 || hasActiveFilters ? (
                <div>
                  <ModelsTable
                    models={models}
                    askDelete={askDelete}
                    askUpdate={askUpdate}
                    askSetProd={askSetProd}
                    task={mlProblem.task}
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
                    <p className="text-base font-semibold">No Models yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Train a model to activate this Tab.
                    </p>
                    <div className="mt-5">
                      <Train
                        problemId={problemId}
                        task={mlProblem.task}
                        onCreate={() => {
                          refreshHasAnyModels();
                          loadModels();
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="configuration">
              <div>
                <MLProblemDetails
                  datasetId={datasetId}
                  datasetVersionId={datasetVersionId}
                  datasetVersionName={datasetVersion?.name}
                  mlProblem={mlProblem}
                  featureStrategy={featureStrategy}
                  columnNames={columnNames}
                  prodModelName={prodModelName}
                  prodModelId={prodModelId}
                  configured={models.length > 0}
                  onRefresh={loadMLProblem}
                />
              </div>
            </TabsContent>
            <TabsContent value="predictions">
              <div
                className={
                  predictions.length > 0 || hasActiveFiltersPred
                    ? "flex justify-between"
                    : "hidden"
                }
              >
                <div className="relative">
                  <MLPredictionsJoinedFilterbar />
                </div>
                <div className="flex gap-2">
                  <Predict problemId={problemId} onCreate={loadPredictions} />
                </div>
              </div>
              {predictions.length > 0 || hasActiveFiltersPred ? (
                <div>
                  <MLPredictionsTable
                    predictions={predictions}
                    askDelete={askDeletePred}
                    askUpdate={askUpdatePred}
                  />
                  <div className="mt-2 grid grid-cols-3 items-center">
                    <div />
                    {predTotalPages > 1 ? (
                      <div className="flex justify-center">
                        <Pagination totalPages={predTotalPages} />
                      </div>
                    ) : (
                      <div />
                    )}
                    <div className="flex justify-end">
                      <PageSize size={predsize} />
                    </div>
                  </div>
                  {deleteTargetPred && (
                    <PredictionDelete
                      target={deleteTargetPred}
                      open={openDeletePred}
                      onConfirm={onDeletePred}
                      onCancel={cancelDeletePred}
                      deleting={deletingPred}
                    />
                  )}
                  {updateTargetPred && (
                    <PredictionUpdate
                      target={updateTargetPred}
                      open={openUpdatePred}
                      onConfirm={onUpdatePred}
                      onCancel={cancelUpdatePred}
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
                    <p className="text-base font-semibold">
                      No Predictions yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Run a prediction to activate this tab.
                    </p>
                    <div className="mt-5">
                      <Predict
                        problemId={problemId}
                        onCreate={loadPredictions}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {setProdTarget && (
        <SetModelProduction
          target={setProdTarget}
          open={openSetProd}
          onConfirm={onSetProd}
          onCancel={cancelSetProd}
          setting={setting}
        />
      )}
    </div>
  );
};

export default MLProblemDetailPage;
