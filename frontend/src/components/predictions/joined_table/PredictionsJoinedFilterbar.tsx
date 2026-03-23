import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "react-use";

const PredictionsJoinedFilterbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  const initial = {
    q: searchParams.get("q") ?? "",
    dataset_name: searchParams.get("dataset_name") ?? "",
    dataset_version_name: searchParams.get("dataset_version_name") ?? "",
    problem_name: searchParams.get("problem_name") ?? "",
    model_name: searchParams.get("model_name") ?? "",
    name: searchParams.get("name") ?? "",
    status: searchParams.get("status") ?? "",
  };

  const [filters, setFilters] = useState({ ...initial });

  useDebounce(
    () => {
      const params = new URLSearchParams(searchParams);

      const current = {
        q: searchParams.get("q") ?? "",
        dataset_name: searchParams.get("dataset_name") ?? "",
        dataset_version_name: searchParams.get("dataset_version_name") ?? "",
        problem_name: searchParams.get("problem_name") ?? "",
        model_name: searchParams.get("model_name") ?? "",
        name: searchParams.get("name") ?? "",
        status: searchParams.get("status") ?? "",
      };

      const next = {
        q: filters.q.trim(),
        dataset_name: filters.dataset_name.trim(),
        dataset_version_name: filters.dataset_version_name.trim(),
        problem_name: filters.problem_name.trim(),
        model_name: filters.model_name.trim(),
        name: filters.name.trim(),
        status: filters.status.trim(),
      };

      const isChanged =
        current.q !== next.q ||
        current.dataset_name !== next.dataset_name ||
        current.dataset_version_name !== next.dataset_version_name ||
        current.problem_name !== next.problem_name ||
        current.model_name !== next.model_name ||
        current.name !== next.name ||
        current.status !== next.status;

      if (filters.q) params.set("q", filters.q);
      else params.delete("q");

      if (filters.dataset_name)
        params.set("dataset_name", filters.dataset_name);
      else params.delete("dataset_name");

      if (filters.dataset_version_name)
        params.set("dataset_version_name", filters.dataset_version_name);
      else params.delete("dataset_version_name");

      if (filters.problem_name)
        params.set("problem_name", filters.problem_name);
      else params.delete("problem_name");

      if (filters.model_name) params.set("model_name", filters.model_name);
      else params.delete("model_name");

      if (filters.name) params.set("name", filters.name);
      else params.delete("name");

      if (filters.status) params.set("status", filters.status);
      else params.delete("status");

      if (isChanged) params.delete("page");

      if (params.toString() !== searchParams.toString()) {
        setSearchParams(params, { replace: true });
      }
    },
    500,
    [filters],
  );

  const resetFilters = () => {
    setFilters({
      q: "",
      dataset_name: "",
      dataset_version_name: "",
      problem_name: "",
      model_name: "",
      name: "",
      status: "",
    });

    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("dataset_name");
    params.delete("dataset_version_name");
    params.delete("problem_name");
    params.delete("model_name");
    params.delete("name");
    params.delete("status");

    setSearchParams(params, { replace: true });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          className="shadow border rounded-md px-2 py-1 w-60"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            onClick={resetFilters}
            className="hover:scale-105 active:scale-95"
          >
            Reset
          </Button>
          <Button
            onClick={() => setOpen((v) => !v)}
            className={`hover:scale-105 active:scale-95 ${
              open ? "bg-zinc-100 text-black hover:bg-zinc-200" : ""
            }`}
          >
            {open ? "- Advanced Filters" : "+ Advanced Filters"}
          </Button>
        </div>
      </div>
      {open && (
        <div className="flex flex-row flex-wrap gap-2 mt-2">
          <Input
            placeholder="Prediction name"
            value={filters.name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, name: e.target.value }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          />
          <Input
            placeholder="Model name"
            value={filters.model_name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, model_name: e.target.value }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          />
          <Input
            placeholder="ML problem name"
            value={filters.problem_name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, problem_name: e.target.value }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          />
          <Input
            placeholder="Dataset version name"
            value={filters.dataset_version_name}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                dataset_version_name: e.target.value,
              }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          />
          <Input
            placeholder="Dataset name"
            value={filters.dataset_name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dataset_name: e.target.value }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          />
          {/* <Input
            placeholder="Status"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          /> */}
        </div>
      )}
    </div>
  );
};

export default PredictionsJoinedFilterbar;
