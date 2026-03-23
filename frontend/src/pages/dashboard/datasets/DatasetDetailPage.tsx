import { useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  delete_dataset_version,
  get_dataset_versions,
  update_dataset_version,
  type DatasetVersion,
  type DatasetVersionListResponse,
} from "../../../lib/actions/dataset_versions/datasetVersion.action";
import {
  get_dataset,
  type Dataset,
} from "../../../lib/actions/datasets/dataset.action";
import {
  DatasetVersionCreate,
  DatasetVersionDelete,
  DatasetVersionsFilterbar,
  DatasetVersionsTable,
  DatasetVersionUpdate,
  type DeleteTarget,
  type UpdateTarget,
} from "@/components/dataset_versions";
import { PageSize, Pagination } from "@/components/table";
import Loading from "@/components/loading/Loading";
import NotFound from "@/components/errors/not_found/NotFound";
import { Fox } from "@/components/watermark/Fox";
import { toast } from "sonner";
import type { DatasetVersionUpdateInput } from "@/components/dataset_versions/datasetVersion.schema";
import NavBarBreadcrumb from "@/components/ui/NavBarBreadcrumb";
// import { Edit } from "lucide-react";

const DatasetIdPage = () => {
  const params = useParams<{ datasetId: string }>();
  if (!params.datasetId) {
    throw new Error("datasetId param missing");
  }
  const datasetId = params.datasetId;

  const menu = [
    { label: "Home", href: "/dashboard" },
    { label: "Datasets", href: "/dashboard/datasets" },
  ];

  const [datasetVersions, setDatasetVersions] = useState<DatasetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [dataset, setDataset] = useState<Dataset | null>(null);
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
  const id = searchParams.get("id") || "";
  const name = searchParams.get("name") || "";

  const hasActiveFilters =
    Boolean(q?.trim()) || Boolean(id?.trim()) || Boolean(name?.trim());

  useEffect(() => {
    async function loadDataset() {
      try {
        const data: Dataset = await get_dataset(datasetId);
        setDataset(data);
      } catch (error) {
        console.log(error);
      }
    }
    loadDataset();
  }, [datasetId]);

  const lastEntry = dataset ? dataset.name : "Versions";

  const loadDatasetVersions = useCallback(async () => {
    try {
      const data: DatasetVersionListResponse = await get_dataset_versions(
        datasetId,
        {
          page,
          size,
          sort,
          dir,
          q: q || undefined,
          id: id || undefined,
          name: name || undefined,
        },
      );
      setDatasetVersions(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [datasetId, page, size, sort, dir, q, id, name]);

  useEffect(() => {
    loadDatasetVersions();
  }, [loadDatasetVersions]);

  const askDelete = (id: string, name?: string) => {
    setDeleteTarget({ id, name });
    setOpenDelete(true);
  };

  const cancelDelete = () => {
    setOpenDelete(false);
    setDeleteTarget(null);
  };

  const onDelete = async (dataset_version_id: string) => {
    if (!dataset_version_id) return;
    setDeleting(true);
    const res = await delete_dataset_version(dataset_version_id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Dataset version deleted");
    await loadDatasetVersions();
    cancelDelete();
    setDeleting(false);
  };

  const askUpdate = (id: string, name?: string) => {
    setUpdateTarget({ id, name });
    setOpenUpdate(true);
  };

  const cancelUpdate = () => {
    setOpenUpdate(false);
    setUpdateTarget(null);
  };

  const onUpdate = async (
    dataset_version_id: string,
    data: DatasetVersionUpdateInput,
  ) => {
    if (!dataset_version_id || !data) return;

    const res = await update_dataset_version(dataset_version_id, data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Dataset version updated");
    await loadDatasetVersions();
    cancelUpdate();
  };

  if (loading) {
    return <Loading />;
  }

  if (!dataset) return <NotFound name="Dataset" />;

  return (
    <div className="w-full pl-4 pt-8">
      <div className="mx-auto w-full px-6">
        {/* <div className="flex flex-inline items-center gap-2">
          <h1>Dataset details: {dataset?.name ?? "Unknown Dataset"}</h1>
        </div>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Manage all dataset versions of {dataset?.name ?? "Unknown Dataset"}.
        </p> */}
        <p className="text-sm text-muted-foreground">Dataset details</p>
        <h1 className="text-3xl font-bold tracking-tight pb-3">
          {dataset?.name ?? "Unknown Dataset"}
        </h1>
        <NavBarBreadcrumb menu={menu} lastEntry={lastEntry} />
        <div
          className={
            datasetVersions.length > 0 || hasActiveFilters
              ? "flex justify-between"
              : "hidden"
          }
        >
          <div className="relative">
            <DatasetVersionsFilterbar />
          </div>
          <DatasetVersionCreate
            onCreate={loadDatasetVersions}
            datasetId={datasetId}
          />
        </div>
        {datasetVersions.length > 0 || hasActiveFilters ? (
          <div>
            <DatasetVersionsTable
              datasetVersions={datasetVersions}
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
              <DatasetVersionDelete
                target={deleteTarget}
                open={openDelete}
                onConfirm={onDelete}
                onCancel={cancelDelete}
                deleting={deleting}
              />
            )}
            {updateTarget && (
              <DatasetVersionUpdate
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
              <p className="text-base font-semibold">No Dataset Versions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a dataset version to activate this tab.
              </p>
              <div className="mt-5">
                <DatasetVersionCreate
                  onCreate={loadDatasetVersions}
                  datasetId={datasetId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetIdPage;
