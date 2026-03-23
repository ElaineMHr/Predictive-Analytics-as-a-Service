import { useCallback, useEffect, useState } from "react";
import {
  delete_dataset,
  get_datasets,
  update_dataset,
  type Dataset,
  type DatasetListResponse,
} from "../../../lib/actions/datasets/dataset.action";
import { useSearchParams } from "react-router-dom";
import {
  DatasetCreate,
  DatasetDelete,
  DatasetsFilterbar,
  DatasetsTable,
  DatasetUpdate,
  type DatasetInput,
  type DeleteTarget,
  type UpdateTarget,
} from "@/components/datasets";
import { PageSize, Pagination } from "@/components/table";
import Loading from "@/components/loading/Loading";
import { Fox } from "@/components/watermark/Fox";
import { toast } from "sonner";
import NavBarBreadcrumb from "@/components/ui/NavBarBreadcrumb";

const DatasetsPage = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
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

  const menu = [{ label: "Home", href: "/dashboard" }];
  const lastEntry = "Datasets";

  const loadDatasets = useCallback(async () => {
    try {
      const data: DatasetListResponse = await get_datasets({
        page,
        size,
        sort,
        dir,
        q: q || undefined,
        id: id || undefined,
        name: name || undefined,
      });
      setDatasets(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [page, size, sort, dir, q, id, name]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const askDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setOpenDelete(true);
  };

  const cancelDelete = () => {
    setOpenDelete(false);
    setDeleteTarget(null);
  };

  const onDelete = async (dataset_id: string) => {
    if (!dataset_id) return;
    setDeleting(true);
    const res = await delete_dataset(dataset_id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Dataset deleted");
    await loadDatasets();
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

  const onUpdate = async (dataset_id: string, data: DatasetInput) => {
    if (!dataset_id || !data) return;

    const res = await update_dataset(dataset_id, data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Dataset updated");
    await loadDatasets();
    cancelUpdate();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="w-full pl-4 pt-8">
      <div className="mx-auto w-full px-6">
        <h1>Datasets</h1>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Browse and manage all datasets.
        </p>
        <NavBarBreadcrumb menu={menu} lastEntry={lastEntry} />
        <div
          className={
            datasets.length > 0 || hasActiveFilters
              ? "flex justify-between"
              : "hidden"
          }
        >
          <div className="relative">
            <DatasetsFilterbar />
          </div>
          <DatasetCreate onCreate={loadDatasets} />
        </div>
        {datasets.length > 0 || hasActiveFilters ? (
          <div>
            <DatasetsTable
              datasets={datasets}
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
              <DatasetDelete
                target={deleteTarget}
                open={openDelete}
                onConfirm={onDelete}
                onCancel={cancelDelete}
                deleting={deleting}
              />
            )}
            {updateTarget && (
              <DatasetUpdate
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
              <p className="text-base font-semibold">No Datasets found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a dataset to activate this page.
              </p>
              <div className="mt-5">
                <DatasetCreate onCreate={loadDatasets} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetsPage;
