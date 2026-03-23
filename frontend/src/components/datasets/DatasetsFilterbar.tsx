import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "react-use";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const DatasetsFilterbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const initial = {
    q: searchParams.get("q") ?? "",
    id: searchParams.get("id") ?? "",
    name: searchParams.get("name") ?? "",
  };
  const [filters, setFilters] = useState({
    q: initial.q,
    id: initial.id,
    name: initial.name,
  });

  useDebounce(
    () => {
      const params = new URLSearchParams(searchParams);

      const current = {
        q: searchParams.get("q") ?? "",
        id: searchParams.get("id") ?? "",
        name: searchParams.get("name") ?? "",
      };
      const next = {
        q: filters.q.trim(),
        id: filters.id.trim(),
        name: filters.name.trim(),
      };

      const isChanged =
        current.q !== next.q ||
        current.id !== next.id ||
        current.name !== next.name;

      if (filters.q) params.set("q", filters.q);
      else params.delete("q");

      if (filters.id) params.set("id", filters.id);
      else params.delete("id");

      if (filters.name) params.set("name", filters.name);
      else params.delete("name");

      if (isChanged) params.delete("page");

      if (params.toString() !== searchParams.toString()) {
        setSearchParams(params, { replace: true }); // replace: true -> update the URL by replacing the current history entry
      }
    },
    500,
    [filters],
  );

  const resetFilters = () => {
    setFilters({ q: "", id: "", name: "" });

    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("id");
    params.delete("name");

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
              open ? "bg-secondary-foreground" : ""
            }`}
          >
            {open ? "- Advanced Filters" : "+ Advanced Filters"}
          </Button>
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
            placeholder="Dataset name"
            value={filters.name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, name: e.target.value }))
            }
            className="shadow border rounded-md px-2 py-1 w-60"
          />
        </div>
      )}
    </div>
  );
};

export default DatasetsFilterbar;
