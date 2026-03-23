import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "react-use";

const DatasetVersionsFilterbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  const initial = {
    q: searchParams.get("q") ?? "",
    dataset_name: searchParams.get("dataset_name") ?? "",
    dataset_version_name: searchParams.get("dataset_version_name") ?? "",
  };

  const [filters, setFilters] = useState(initial);

  useDebounce(
    () => {
      const params = new URLSearchParams(searchParams);

      const current = {
        q: searchParams.get("q") ?? "",
        dataset_name: searchParams.get("dataset_name") ?? "",
        dataset_version_name: searchParams.get("dataset_version_name") ?? "",
      };

      const next = {
        q: filters.q.trim(),
        dataset_name: filters.dataset_name.trim(),
        dataset_version_name: filters.dataset_version_name.trim(),
      };

      const isChanged =
        current.q !== next.q ||
        current.dataset_name !== next.dataset_name ||
        current.dataset_version_name !== next.dataset_version_name;

      if (next.q) params.set("q", next.q);
      else params.delete("q");

      if (next.dataset_name) params.set("dataset_name", next.dataset_name);
      else params.delete("dataset_name");

      if (next.dataset_version_name)
        params.set("dataset_version_name", next.dataset_version_name);
      else params.delete("dataset_version_name");

      if (isChanged) params.delete("page");

      if (params.toString() !== searchParams.toString()) {
        setSearchParams(params, { replace: true });
      }
    },
    500,
    [filters],
  );

  const resetFilters = () => {
    setFilters({ q: "", dataset_name: "", dataset_version_name: "" });

    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("dataset_name");
    params.delete("dataset_version_name");

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
            type="button"
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
        <div className="flex flex-row gap-2 mt-2">
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
        </div>
      )}
    </div>
  );
};

export default DatasetVersionsFilterbar;
