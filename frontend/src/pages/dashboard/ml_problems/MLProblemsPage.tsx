import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  delete_ml_problem,
  get_ml_problems_all,
  update_ml_problem,
  type MLProblemJoined,
  type MLProblemAllListResponse,
} from "../../../lib/actions/mlProblems/mlProblem.action";
import {
  MLProblemCreate,
  MLProblemDelete,
  MLProblemUpdate,
  type DeleteTarget,
  type UpdateTarget,
} from "@/components/ml_problems";
import { PageSize, Pagination } from "@/components/table";
import Loading from "@/components/loading/Loading";
import { Fox } from "@/components/watermark/Fox";
import { toast } from "sonner";
import type { MLProblemUpdateInput } from "@/components/ml_problems/ml_problem.schema";
import MLProblemsJoinedTable from "@/components/ml_problems/joined_table/MLProblemsJoinedTable";
import MLProblemsJoinedFilterbar from "@/components/ml_problems/joined_table/MLProblemsJoinedFilterbar";
import NavBarBreadcrumb from "@/components/ui/NavBarBreadcrumb";

const MLProblemsPage = () => {
  const menu = [{ label: "Home", href: "/dashboard/" }];
  const lastEntry = "ML Problems";

  const [mlProblems, setMLProblems] = useState<MLProblemJoined[]>([]);
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
  const task = searchParams.get("task") || "";
  const target = searchParams.get("target") || "";
  const name = searchParams.get("name") || "";
  const dataset_name = searchParams.get("dataset_name") || "";
  const dataset_version_name = searchParams.get("dataset_version_name") || "";

  const hasActiveFilters =
    Boolean(q?.trim()) ||
    Boolean(task?.trim()) ||
    Boolean(target?.trim()) ||
    Boolean(name?.trim()) ||
    Boolean(dataset_name?.trim()) ||
    Boolean(dataset_version_name?.trim());

  const loadMLProblems = useCallback(async () => {
    try {
      const data: MLProblemAllListResponse = await get_ml_problems_all({
        page,
        size,
        sort,
        dir,
        q: q || undefined,
        task: task || undefined,
        target: target || undefined,
        name: name || undefined,
        dataset_name: dataset_name || undefined,
        dataset_version_name: dataset_version_name || undefined,
      });
      setMLProblems(data.items);
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
    task,
    target,
    name,
    dataset_name,
    dataset_version_name,
  ]);

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
      setDeleting(false);
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

  if (loading) return <Loading />;

  return (
    <div className="w-full pl-4 pt-8">
      <div className="mx-auto w-full px-6">
        <h1>ML Problems</h1>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Browse and manage ML problems across all datasets.
        </p>
        <NavBarBreadcrumb menu={menu} lastEntry={lastEntry} />
        <div
          className={
            mlProblems.length > 0 || hasActiveFilters
              ? "flex justify-between"
              : "hidden"
          }
        >
          <div className="relative">
            <MLProblemsJoinedFilterbar />
          </div>
          <MLProblemCreate onCreate={loadMLProblems} />
        </div>
        {mlProblems.length > 0 || hasActiveFilters ? (
          <div>
            <MLProblemsJoinedTable
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
              <p className="text-base font-semibold">No ML Problems found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create an ML problem to activate this page.
              </p>
              <div className="mt-5">
                <MLProblemCreate onCreate={loadMLProblems} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MLProblemsPage;
