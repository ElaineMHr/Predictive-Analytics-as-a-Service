import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "react-use";

const MLProblemsJoinedFilterbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  const initial = {
    q: searchParams.get("q") ?? "",
    name: searchParams.get("name") ?? "",

    task: searchParams.get("task") ?? "",
    target: searchParams.get("target") ?? "",

    dataset_name: searchParams.get("dataset_name") ?? "",
    dataset_version_name: searchParams.get("dataset_version_name") ?? "",
  };

  const [filters, setFilters] = useState(initial);

  const TASKS = [
    { value: "classification", label: "Classification" },
    { value: "regression", label: "Regression" },
  ];

  useDebounce(
    () => {
      const params = new URLSearchParams(searchParams);

      const current = {
        q: searchParams.get("q") ?? "",
        name: searchParams.get("name") ?? "",
        task: searchParams.get("task") ?? "",
        target: searchParams.get("target") ?? "",
        dataset_name: searchParams.get("dataset_name") ?? "",
        dataset_version_name: searchParams.get("dataset_version_name") ?? "",
      };

      const next = {
        q: filters.q.trim(),
        name: filters.name.trim(),
        task: filters.task.trim(),
        target: filters.target.trim(),
        dataset_name: filters.dataset_name.trim(),
        dataset_version_name: filters.dataset_version_name.trim(),
      };

      const isChanged =
        current.q !== next.q ||
        current.name !== next.name ||
        current.task !== next.task ||
        current.target !== next.target ||
        current.dataset_name !== next.dataset_name ||
        current.dataset_version_name !== next.dataset_version_name;

      if (filters.q) params.set("q", filters.q);
      else params.delete("q");

      if (filters.name) params.set("name", filters.name);
      else params.delete("name");

      if (filters.task) params.set("task", filters.task);
      else params.delete("task");

      if (filters.target) params.set("target", filters.target);
      else params.delete("target");

      if (filters.dataset_name)
        params.set("dataset_name", filters.dataset_name);
      else params.delete("dataset_name");

      if (filters.dataset_version_name)
        params.set("dataset_version_name", filters.dataset_version_name);
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
    setFilters({
      q: "",
      name: "",
      task: "",
      target: "",
      dataset_name: "",
      dataset_version_name: "",
    });

    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("name");
    params.delete("task");
    params.delete("target");
    params.delete("dataset_name");
    params.delete("dataset_version_name");

    setSearchParams(params, { replace: true });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
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
      </div>
      {open && (
        <div className="flex flex-row gap-2 mt-2 flex-wrap">
          <Input
            placeholder="ML Problem name"
            value={filters.name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, name: e.target.value }))
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
          <div className="flex items-center gap-1">
            <Select
              value={filters.task}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  task: value,
                }))
              }
            >
              <SelectTrigger
                className={
                  filters.task
                    ? "h-9 w-52 justify-between text-left border rounded-md text-sm pl-3"
                    : "h-9 w-60 justify-between text-left border rounded-md text-sm pl-3"
                }
              >
                <SelectValue placeholder="Task" />
              </SelectTrigger>
              <SelectContent className="shadow border rounded-md px-2 py-1 w-60">
                {TASKS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!!filters.task && (
              <Button
                type="button"
                variant={"outline"}
                size="icon"
                className=""
                onClick={() => setFilters((f) => ({ ...f, task: "" }))}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Input
            placeholder="Target"
            value={filters.target}
            onChange={(e) =>
              setFilters((f) => ({ ...f, target: e.target.value }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          />
        </div>
      )}
    </div>
  );
};

export default MLProblemsJoinedFilterbar;
