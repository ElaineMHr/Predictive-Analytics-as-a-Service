import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  delete_dataset_version,
  get_dataset_versions_all,
  update_dataset_version,
  type DatasetVersionJoined,
  type DatasetVersionAllListResponse,
} from "../../../lib/actions/dataset_versions/datasetVersion.action";
import {
  DatasetVersionCreate,
  DatasetVersionDelete,
  DatasetVersionUpdate,
  type DeleteTarget,
  type UpdateTarget,
} from "@/components/dataset_versions";
import { PageSize, Pagination } from "@/components/table";
import Loading from "@/components/loading/Loading";
import { Fox } from "@/components/watermark/Fox";
import { toast } from "sonner";
import type { DatasetVersionUpdateInput } from "@/components/dataset_versions/datasetVersion.schema";
import DatasetVersionsJoinedFilterbar from "@/components/dataset_versions/joined_table/DatasetVersionsJoinedFilterbar";
import DatasetVersionsJoinedTable from "@/components/dataset_versions/joined_table/DatasetVersionsJoinedTable";
import NavBarBreadcrumb from "@/components/ui/NavBarBreadcrumb";

const DatasetVersionsPage = () => {
  const menu = [{ label: "Home", href: "/dashboard/" }];
  const lastEntry = "Versions";

  const [datasetVersions, setDatasetVersions] = useState<
    DatasetVersionJoined[]
  >([]);
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
  const dataset_name = searchParams.get("dataset_name") || "";
  const name = searchParams.get("name") || "";

  const hasActiveFilters =
    Boolean(q?.trim()) ||
    Boolean(dataset_name?.trim()) ||
    Boolean(name?.trim());

  const loadDatasetVersions = useCallback(async () => {
    try {
      const data: DatasetVersionAllListResponse =
        await get_dataset_versions_all({
          page,
          size,
          sort,
          dir,
          q: q || undefined,
          dataset_name: dataset_name || undefined,
          name: name || undefined,
        });
      setDatasetVersions(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [page, size, sort, dir, q, dataset_name, name]);

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
      setDeleting(false);
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

  if (loading) return <Loading />;

  return (
    <div className="w-full pl-4 pt-8">
      <div className="mx-auto w-full px-6">
        <div className="flex flex-inline items-center gap-2">
          <h1>Dataset Versions</h1>
        </div>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Browse and manage dataset versions across all datasets.
        </p>
        <NavBarBreadcrumb menu={menu} lastEntry={lastEntry} />
        <div
          className={
            datasetVersions.length > 0 || hasActiveFilters
              ? "flex justify-between"
              : "hidden"
          }
        >
          <div className="relative">
            <DatasetVersionsJoinedFilterbar />
          </div>
          <DatasetVersionCreate onCreate={loadDatasetVersions} />
        </div>
        {datasetVersions.length > 0 || hasActiveFilters ? (
          <div>
            <DatasetVersionsJoinedTable
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
              <p className="text-base font-semibold">
                No Dataset Versions found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a dataset version to activate this page.
              </p>
              <div className="mt-5">
                <DatasetVersionCreate onCreate={loadDatasetVersions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetVersionsPage;
