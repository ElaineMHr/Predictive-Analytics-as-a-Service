import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "react-use";

const MLPredictionsJoinedFilterbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  const initial = {
    q: searchParams.get("predq") ?? "",
    model_name: searchParams.get("predmodel_name") ?? "",
    name: searchParams.get("predname") ?? "",
  };

  const [filters, setFilters] = useState({ ...initial });

  useDebounce(
    () => {
      const params = new URLSearchParams(searchParams);

      const current = {
        q: searchParams.get("predq") ?? "",
        model_name: searchParams.get("predmodel_name") ?? "",
        name: searchParams.get("predname") ?? "",
      };

      const next = {
        q: filters.q.trim(),
        model_name: filters.model_name.trim(),
        name: filters.name.trim(),
      };

      const isChanged =
        current.q !== next.q ||
        current.model_name !== next.model_name ||
        current.name !== next.name;

      if (filters.q) params.set("predq", filters.q);
      else params.delete("predq");

      if (filters.model_name) params.set("predmodel_name", filters.model_name);
      else params.delete("predmodel_name");

      if (filters.name) params.set("predname", filters.name);
      else params.delete("predname");

      if (isChanged) params.delete("predpage");

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
      model_name: "",
      name: "",
    });

    const params = new URLSearchParams(searchParams);
    params.delete("predq");
    params.delete("predmodel_name");
    params.delete("predname");

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
        </div>
      )}
    </div>
  );
};

export default MLPredictionsJoinedFilterbar;
