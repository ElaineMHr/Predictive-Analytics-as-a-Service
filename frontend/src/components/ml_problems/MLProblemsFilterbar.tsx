import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "react-use";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { X } from "lucide-react";

const MLProblemsFilterbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const initial = {
    q: searchParams.get("q") ?? "",
    id: searchParams.get("id") ?? "",
    name: searchParams.get("name") ?? "",
    task: searchParams.get("task") ?? "",
    target: searchParams.get("target") ?? "",
  };
  const [filters, setFilters] = useState({
    q: initial.q,
    id: initial.id,
    name: initial.name,
    task: initial.task,
    target: initial.target,
  });

  const TASKS = [
    { value: "classification", label: "Classification" },
    { value: "regression", label: "Regression" },
  ];

  useDebounce(
    () => {
      const params = new URLSearchParams(searchParams);

      const current = {
        q: searchParams.get("q") ?? "",
        id: searchParams.get("id") ?? "",
        name: searchParams.get("name") ?? "",
        task: searchParams.get("task") ?? "",
        target: searchParams.get("target") ?? "",
      };
      const next = {
        q: filters.q.trim(),
        id: filters.id.trim(),
        name: filters.name.trim(),
        task: filters.task.trim(),
        target: filters.target.trim(),
      };

      const isChanged =
        current.q !== next.q ||
        current.id !== next.id ||
        current.name !== next.name ||
        current.task !== next.task ||
        current.target !== next.target;

      if (filters.q) params.set("q", filters.q);
      else params.delete("q");

      if (filters.id) params.set("id", filters.id);
      else params.delete("id");

      if (filters.name) params.set("name", filters.name);
      else params.delete("name");

      if (filters.task) params.set("task", filters.task);
      else params.delete("task");

      if (filters.target) params.set("target", filters.target);
      else params.delete("target");

      if (isChanged) params.delete("page");

      if (params.toString() !== searchParams.toString()) {
        setSearchParams(params, { replace: true }); // replace: true -> update the URL by replacing the current history entry
      }
    },
    500,
    [filters],
  );

  const resetFilters = () => {
    setFilters({ q: "", id: "", name: "", task: "", target: "" });

    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("id");
    params.delete("name");
    params.delete("task");
    params.delete("target");

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
        <div className="flex flex-row gap-2 mt-2">
          <Input
            placeholder="id"
            value={filters.id}
            onChange={(e) => setFilters((f) => ({ ...f, id: e.target.value }))}
            className="shadow border rounded-md px-2 py-1 w-60"
          />
          <Input
            placeholder="ML problem name"
            value={filters.name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, name: e.target.value }))
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

export default MLProblemsFilterbar;
