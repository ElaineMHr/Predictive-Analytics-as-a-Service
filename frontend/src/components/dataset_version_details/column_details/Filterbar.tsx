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
import { useDebounce } from "react-use";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

const SEMANTIC_TYPES = [
  { value: "boolean", label: "Boolean" },
  { value: "numeric", label: "Numeric" },
  { value: "categorical", label: "Categorical" },
  { value: "datetime", label: "Datetime" },
];

const RECOMMENDATIONS = [
  { value: "include", label: "Include" },
  { value: "exclude", label: "Exclude" },
];

const SUGGESTED_ANALYSES = [
  { value: "classification", label: "Classification" },
  { value: "regression", label: "Regression" },
  { value: "none", label: "—" },
];

const Filterbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = {
    name: searchParams.get("colName") ?? "",
    semantic_type: searchParams.get("colSemantic") ?? "",
    recommendation: searchParams.get("colRecommendation") ?? "",
    suggested_analysis: searchParams.get("colSuggested_analysis") ?? "",
  };
  const [filters, setFilters] = useState({
    name: initial.name,
    semantic_type: initial.semantic_type,
    recommendation: initial.recommendation,
    suggested_analysis: initial.suggested_analysis,
  });

  useDebounce(
    () => {
      const params = new URLSearchParams(searchParams);

      const current = {
        name: searchParams.get("colName") ?? "",
        semantic_type: searchParams.get("colSemantic") ?? "",
        recommendation: searchParams.get("colRecommendation") ?? "",
        suggested_analysis: searchParams.get("colSuggested_analysis") ?? "",
      };
      const next = {
        name: filters.name.trim(),
        semantic_type: filters.semantic_type.trim(),
        recommendation: filters.recommendation.trim(),
        suggested_analysis: filters.suggested_analysis.trim(),
      };

      const isChanged =
        current.name !== next.name ||
        current.semantic_type !== next.semantic_type ||
        current.recommendation !== next.recommendation ||
        current.suggested_analysis !== next.suggested_analysis;

      if (filters.name) params.set("colName", filters.name);
      else params.delete("colName");

      if (filters.semantic_type)
        params.set("colSemantic", filters.semantic_type);
      else params.delete("colSemantic");

      if (filters.recommendation)
        params.set("colRecommendation", filters.recommendation);
      else params.delete("colRecommendation");

      if (filters.suggested_analysis)
        params.set("colSuggested_analysis", filters.suggested_analysis);
      else params.delete("colSuggested_analysis");

      if (isChanged) params.delete("colPage");

      if (params.toString() !== searchParams.toString()) {
        setSearchParams(params, { replace: true }); // replace: true -> update the URL by replacing the current history entry
      }
    },
    500,
    [filters],
  );

  const resetFilters = () => {
    setFilters({
      name: "",
      semantic_type: "",
      recommendation: "",
      suggested_analysis: "",
    });

    const params = new URLSearchParams(searchParams);
    params.delete("colName");
    params.delete("colSemantic");
    params.delete("colRecommendation");
    params.delete("colSuggested_analysis");

    setSearchParams(params, { replace: true });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Name"
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
          className="shadow border rounded-md px-2 py-1 w-60"
        />
        <div className="flex items-center gap-1">
          <Select
            value={filters.semantic_type}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, semantic_type: value }))
            }
          >
            <SelectTrigger
              className={
                filters.semantic_type
                  ? "h-9 w-52 justify-between text-left border rounded-md text-sm pl-3"
                  : "h-9 w-60 justify-between text-left border rounded-md text-sm pl-3"
              }
            >
              <SelectValue placeholder="Semantic Type" />
            </SelectTrigger>
            <SelectContent className="shadow border rounded-md px-2 py-1 w-60">
              {SEMANTIC_TYPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!!filters.semantic_type && (
            <Button
              type="button"
              variant={"outline"}
              size="icon"
              className=""
              onClick={() => setFilters((f) => ({ ...f, semantic_type: "" }))}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Select
            value={filters.recommendation}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, recommendation: value }))
            }
          >
            <SelectTrigger
              className={
                filters.recommendation
                  ? "h-9 w-52 justify-between text-left border rounded-md text-sm pl-3"
                  : "h-9 w-60 justify-between text-left border rounded-md text-sm pl-3"
              }
            >
              <SelectValue placeholder="Recommendation" />
            </SelectTrigger>
            <SelectContent className="shadow border rounded-md px-2 py-1 w-60">
              {RECOMMENDATIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!!filters.recommendation && (
            <Button
              type="button"
              variant={"outline"}
              size="icon"
              className=""
              onClick={() => setFilters((f) => ({ ...f, recommendation: "" }))}
              aria-label="Clear train mode"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Select
            value={filters.suggested_analysis}
            onValueChange={(value) =>
              setFilters((f) => ({
                ...f,
                suggested_analysis: value,
              }))
            }
          >
            <SelectTrigger
              className={
                filters.suggested_analysis
                  ? "h-9 w-52 justify-between text-left border rounded-md text-sm pl-3"
                  : "h-9 w-60 justify-between text-left border rounded-md text-sm pl-3"
              }
            >
              <SelectValue placeholder="Suggested Analysis" />
            </SelectTrigger>
            <SelectContent className="shadow border rounded-md px-2 py-1 w-60">
              {SUGGESTED_ANALYSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!!filters.suggested_analysis && (
            <Button
              type="button"
              variant={"outline"}
              size="icon"
              className=""
              onClick={() =>
                setFilters((f) => ({ ...f, suggested_analysis: "" }))
              }
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            onClick={resetFilters}
            className="hover:scale-105 active:scale-95"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Filterbar;
