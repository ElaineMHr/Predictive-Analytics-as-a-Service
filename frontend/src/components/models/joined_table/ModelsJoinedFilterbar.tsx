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

const TRAIN_MODES = [
  { value: "fast", label: "Fast" },
  { value: "balanced", label: "Balanced" },
  { value: "accurate", label: "Accurate" },
];

const EVALUATION_STRATEGIES = [
  { value: "cv", label: "Cross Validation" },
  { value: "holdout", label: "Holdout" },
];

const STATUSES = [
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
  { value: "archived", label: "Archived" },
];

const ModelsJoinedFilterbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  const initial = {
    q: searchParams.get("q") ?? "",
    name: searchParams.get("name") ?? "",
    algorithm: searchParams.get("algorithm") ?? "",
    train_mode: searchParams.get("train_mode") ?? "",
    evaluation_strategy: searchParams.get("evaluation_strategy") ?? "",
    status: searchParams.get("status") ?? "",

    problem_name: searchParams.get("problem_name") ?? "",
    dataset_version_name: searchParams.get("dataset_version_name") ?? "",
    dataset_name: searchParams.get("dataset_name") ?? "",
  };

  const [filters, setFilters] = useState(initial);

  useDebounce(
    () => {
      const params = new URLSearchParams(searchParams);

      const current = {
        q: searchParams.get("q") ?? "",
        name: searchParams.get("name") ?? "",
        algorithm: searchParams.get("algorithm") ?? "",
        train_mode: searchParams.get("train_mode") ?? "",
        evaluation_strategy: searchParams.get("evaluation_strategy") ?? "",
        status: searchParams.get("status") ?? "",
        problem_name: searchParams.get("problem_name") ?? "",
        dataset_version_name: searchParams.get("dataset_version_name") ?? "",
        dataset_name: searchParams.get("dataset_name") ?? "",
      };

      const next = {
        q: filters.q.trim(),
        name: filters.name.trim(),
        algorithm: filters.algorithm.trim(),
        train_mode: filters.train_mode.trim(),
        evaluation_strategy: filters.evaluation_strategy.trim(),
        status: filters.status.trim(),
        problem_name: filters.problem_name.trim(),
        dataset_version_name: filters.dataset_version_name.trim(),
        dataset_name: filters.dataset_name.trim(),
      };

      const isChanged =
        current.q !== next.q ||
        current.name !== next.name ||
        current.algorithm !== next.algorithm ||
        current.train_mode !== next.train_mode ||
        current.evaluation_strategy !== next.evaluation_strategy ||
        current.status !== next.status ||
        current.problem_name !== next.problem_name ||
        current.dataset_version_name !== next.dataset_version_name ||
        current.dataset_name !== next.dataset_name;

      if (filters.q) params.set("q", filters.q);
      else params.delete("q");

      if (filters.name) params.set("name", filters.name);
      else params.delete("name");

      if (filters.algorithm) params.set("algorithm", filters.algorithm);
      else params.delete("algorithm");

      if (filters.train_mode) params.set("train_mode", filters.train_mode);
      else params.delete("train_mode");

      if (filters.evaluation_strategy)
        params.set("evaluation_strategy", filters.evaluation_strategy);
      else params.delete("evaluation_strategy");

      if (filters.status) params.set("status", filters.status);
      else params.delete("status");

      if (filters.problem_name)
        params.set("problem_name", filters.problem_name);
      else params.delete("problem_name");

      if (filters.dataset_version_name)
        params.set("dataset_version_name", filters.dataset_version_name);
      else params.delete("dataset_version_name");

      if (filters.dataset_name)
        params.set("dataset_name", filters.dataset_name);
      else params.delete("dataset_name");

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
      algorithm: "",
      train_mode: "",
      evaluation_strategy: "",
      status: "",
      problem_name: "",
      dataset_version_name: "",
      dataset_name: "",
    });

    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("name");
    params.delete("algorithm");
    params.delete("train_mode");
    params.delete("evaluation_strategy");
    params.delete("status");
    params.delete("problem_name");
    params.delete("dataset_version_name");
    params.delete("dataset_name");

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
            placeholder="Model name"
            value={filters.name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, name: e.target.value }))
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
          <div className="flex items-center gap-1">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((f) => ({ ...f, status: value }))
              }
            >
              <SelectTrigger
                className={
                  filters.status
                    ? "h-9 w-52 justify-between text-left border rounded-md text-sm pl-3"
                    : "h-9 w-60 justify-between text-left border rounded-md text-sm pl-3"
                }
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="shadow border rounded-md px-2 py-1 w-60">
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!!filters.status && (
              <Button
                type="button"
                variant={"outline"}
                size="icon"
                className=""
                onClick={() => setFilters((f) => ({ ...f, status: "" }))}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Input
            placeholder="Algorithm"
            value={filters.algorithm}
            onChange={(e) =>
              setFilters((f) => ({ ...f, algorithm: e.target.value }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          />
          <div className="flex items-center gap-1">
            <Select
              value={filters.train_mode}
              onValueChange={(value) =>
                setFilters((f) => ({ ...f, train_mode: value }))
              }
            >
              <SelectTrigger
                className={
                  filters.train_mode
                    ? "h-9 w-52 justify-between text-left border rounded-md text-sm pl-3"
                    : "h-9 w-60 justify-between text-left border rounded-md text-sm pl-3"
                }
              >
                <SelectValue placeholder="Train mode" />
              </SelectTrigger>
              <SelectContent className="shadow border rounded-md px-2 py-1 w-60">
                {TRAIN_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!!filters.train_mode && (
              <Button
                type="button"
                variant={"outline"}
                size="icon"
                className=""
                onClick={() => setFilters((f) => ({ ...f, train_mode: "" }))}
                aria-label="Clear train mode"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Select
              value={filters.evaluation_strategy}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  evaluation_strategy: value,
                }))
              }
            >
              <SelectTrigger
                className={
                  filters.evaluation_strategy
                    ? "h-9 w-52 justify-between text-left border rounded-md text-sm pl-3"
                    : "h-9 w-60 justify-between text-left border rounded-md text-sm pl-3"
                }
              >
                <SelectValue placeholder="Evaluation strategy" />
              </SelectTrigger>
              <SelectContent className="shadow border rounded-md px-2 py-1 w-60">
                {EVALUATION_STRATEGIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!!filters.evaluation_strategy && (
              <Button
                type="button"
                variant={"outline"}
                size="icon"
                className=""
                onClick={() =>
                  setFilters((f) => ({ ...f, evaluation_strategy: "" }))
                }
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelsJoinedFilterbar;
