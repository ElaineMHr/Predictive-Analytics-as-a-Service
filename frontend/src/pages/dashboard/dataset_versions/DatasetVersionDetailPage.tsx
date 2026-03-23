import { useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  delete_ml_problem,
  get_ml_problems,
  update_ml_problem,
  type MLProblem,
  type MLProblemListResponse,
} from "../../../lib/actions/mlProblems/mlProblem.action";
import {
  get_dataset_version,
  type DatasetVersion,
} from "../../../lib/actions/dataset_versions/datasetVersion.action";
import MLProblemsTable from "@/components/ml_problems/MLProblemsTable";
import {
  MLProblemCreate,
  MLProblemDelete,
  MLProblemUpdate,
  type DeleteTarget,
  type UpdateTarget,
} from "@/components/ml_problems";
import MLProblemsFilterbar from "@/components/ml_problems/MLProblemsFilterbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageSize, Pagination } from "@/components/table";
import DatasetVersionDetails from "@/components/dataset_version_details/DatasetVersionDetails";
import Loading from "@/components/loading/Loading";
import NotFound from "@/components/errors/not_found/NotFound";
import { Fox } from "@/components/watermark/Fox";
import DatasetVersionDataTable from "@/components/dataset_version_data/DatasetVersionDataTable";
import { toast } from "sonner";
import type { MLProblemUpdateInput } from "@/components/ml_problems/ml_problem.schema";
import NavBarBreadcrumb from "@/components/ui/NavBarBreadcrumb";

export type ColumnDetails = { name: string; analysis: string };
export type Metadata = {
  dtype_raw: string;
  semantic_type: string;
  missing_pct: number;
  cardinality: number;
  cardinality_ratio: number;
  is_empty: boolean;
  is_constant: boolean;
  is_unique: boolean;
  exclude_for_analysis: boolean;
  suggested_analysis: string;
  exclusion_reason?: string;
  warning?: string;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  top_value?: string;
  top_count?: number;
  top_freq_ratio?: number;
  coverage_top3?: number;
  true_pct?: number;
  false_pct?: number;
  earliest_date?: string;
  latest_date?: string;
};

export type Profile = {
  summary: { n_cols: number; n_rows: number; missing_pct: number };
  columns: Record<string, Metadata>;
  id_candidates: Record<string, string>;
  exclude_suggestions: Record<string, string>;
  leakage_columns: Record<string, string>;
};

const DatasetVersionDetailPage = () => {
  const params = useParams<{ datasetId: string; datasetVersionId: string }>();
  if (!params.datasetVersionId) {
    throw new Error("datasetVersionId param missing");
  }
  if (!params.datasetId) {
    throw new Error("datasetId param missing");
  }
  const datasetVersionId = params.datasetVersionId;
  const datasetId = params.datasetId;

  const menu = [
    { label: "Home", href: "/dashboard/" },
    { label: "Datasets", href: "/dashboard/datasets/" },
    { label: "Versions", href: `/dashboard/datasets/${datasetId}` },
  ];

  const [mlProblems, setMLProblems] = useState<MLProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [datasetVersion, setDatasetVersion] = useState<DatasetVersion | null>(
    null,
  );
  const [totalPages, setTotalPages] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<UpdateTarget | null>(null);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [tabValue, setTabValue] = useState("ml_problems");
  const [columnsDetails, setColumnsDetails] = useState<
    ColumnDetails[] | undefined
  >(undefined);

  const page = Number(searchParams.get("page") ?? 1);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "created_at";
  const dir: "asc" | "desc" =
    searchParams.get("dir") === "asc" ? "asc" : "desc";
  const q = searchParams.get("q") || "";
  const id = searchParams.get("id") || "";
  const task = searchParams.get("task") || "";
  const target = searchParams.get("target") || "";
  const name = searchParams.get("name") || "";

  const hasActiveFilters =
    Boolean(q?.trim()) ||
    Boolean(id?.trim()) ||
    Boolean(name?.trim()) ||
    Boolean(task?.trim()) ||
    Boolean(target?.trim());

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

  const lastEntry = datasetVersion ? datasetVersion.name : "ML Problems";

  useEffect(() => {
    if (!datasetVersion?.profile_json) return;
    try {
      const profile: Profile = JSON.parse(datasetVersion.profile_json);
      const details = Object.entries(profile.columns).map(
        ([name, metadata]) => ({
          name: name,
          analysis: metadata.suggested_analysis,
        }),
      );
      setColumnsDetails(details);
    } catch (error) {
      console.log(error);
      setColumnsDetails(undefined);
    }
  }, [datasetVersion]);

  const profile: Profile = datasetVersion?.profile_json
    ? JSON.parse(datasetVersion?.profile_json)
    : null;

  const loadMLProblems = useCallback(async () => {
    try {
      const data: MLProblemListResponse = await get_ml_problems(
        datasetVersionId,
        {
          page,
          size,
          sort,
          dir,
          q: q || undefined,
          id: id || undefined,
          task: task || undefined,
          target: target || undefined,
          name: name || undefined,
        },
      );
      setMLProblems(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [datasetVersionId, page, size, sort, dir, q, id, task, target, name]);

  useEffect(() => {
    loadMLProblems();
  }, [loadMLProblems]);

  const askDelete = (id: string, name?: string) => {
    setDeleteTarget({ id, name });
    setOpenDelete(true);
  };

  const cancelDelete = () => {
    setOpenDelete(false);
    setDeleteTarget(null);
  };

  const onDelete = async (ml_problem_id: string) => {
    if (!ml_problem_id) return;
    setDeleting(true);
    const res = await delete_ml_problem(ml_problem_id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("ML problem deleted");
    await loadMLProblems();
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
    ml_problem_id: string,
    data: MLProblemUpdateInput,
  ) => {
    if (!ml_problem_id || !data) return;

    const res = await update_ml_problem(ml_problem_id, data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("ML Problem updated");
    await loadMLProblems();
    cancelUpdate();
  };

  if (loading) {
    return <Loading />;
  }

  if (!datasetVersion) return <NotFound name="Dataset Version" />;

  return (
    <div className="w-full pl-4 pt-8 h-screen flex flex-col">
      <div className="mx-auto w-full px-6 flex flex-col flex-1 min-h-0">
        <p className="text-sm text-muted-foreground">Dataset version details</p>
        <h1 className="text-3xl font-bold tracking-tight pb-3">
          {datasetVersion?.name ?? "Unknown Dataset Version"}
        </h1>
        {/* {tabValue === "ml_problems" && (
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Manage all ML problems of{" "}
            {datasetVersion?.name ?? "Unknown Dataset Version"}.
          </p>
        )}
        {tabValue === "overview" && (
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Manage the details of{" "}
            {datasetVersion?.name ?? "Unknown Dataset Version"}.
          </p>
        )}
        {tabValue === "data" && (
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Data overview of {datasetVersion?.name ?? "Unknown Dataset Version"}
            .
          </p>
        )} */}
        <NavBarBreadcrumb menu={menu} lastEntry={lastEntry} />
        <Tabs
          className="flex flex-col flex-1 min-h-0 w-full"
          value={tabValue}
          onValueChange={setTabValue}
        >
          <TabsList className="w-full items-center justify-start gap-2">
            <TabsTrigger value="ml_problems">ML Problems</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
          <TabsContent value="ml_problems" className="flex-1 min-h-0">
            <div
              className={
                mlProblems.length > 0 || hasActiveFilters
                  ? "flex justify-between"
                  : "hidden"
              }
            >
              <div className="relative">
                <MLProblemsFilterbar />
              </div>
              <MLProblemCreate
                onCreate={loadMLProblems}
                datasetVersionId={datasetVersionId}
                columnsDetails={columnsDetails}
              />
            </div>
            {mlProblems.length > 0 || hasActiveFilters ? (
              <div>
                <MLProblemsTable
                  mlProblems={mlProblems}
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
                  <MLProblemDelete
                    target={deleteTarget}
                    open={openDelete}
                    onConfirm={onDelete}
                    onCancel={cancelDelete}
                    deleting={deleting}
                  />
                )}
                {updateTarget && (
                  <MLProblemUpdate
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
                  <p className="text-base font-semibold">No ML Problems yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create an ML problem to activate this tab.
                  </p>
                  <div className="mt-5">
                    <MLProblemCreate
                      onCreate={loadMLProblems}
                      datasetVersionId={datasetVersionId}
                      columnsDetails={columnsDetails}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="overview" className="flex-1 min-h-0">
            <div>
              {profile ? (
                <DatasetVersionDetails
                  datasetVersionId={datasetVersionId}
                  profile={profile}
                  onRefresh={loadDatasetVersion}
                />
              ) : (
                <div>
                  No profile was found. Run the profiler to activate this tab.
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="data" className="w-full flex-1 min-h-0">
            <DatasetVersionDataTable uri={datasetVersion.uri} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DatasetVersionDetailPage;
