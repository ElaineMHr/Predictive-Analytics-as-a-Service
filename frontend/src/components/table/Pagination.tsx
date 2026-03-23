import { useSearchParams } from "react-router-dom";
import { Button } from "../ui/button";

type Props = {
  totalPages: number;
  // size shows how many pages to show in total. Default 9 -> +- 4 from current page
  size?: number;
  pageParam?: string;
};

const Pagination = ({ totalPages, size = 9, pageParam = "page" }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = searchParams.get(pageParam);
  const current =
    Number.isFinite(Number(rawPage)) && Number(rawPage) > 0
      ? Math.floor(Number(rawPage))
      : 1;

  const goto = (page: number) => {
    const normPage = page < 1 ? 1 : page > totalPages ? totalPages : page;
    const params = new URLSearchParams(searchParams);
    if (normPage === 1) params.delete(pageParam);
    else params.set(pageParam, normPage.toString());

    setSearchParams(params, { replace: true });
  };

  const half_size = Math.floor(size / 2);
  const lastStart = totalPages - size + 1; // lastStart shows the last possible value for start
  let start: number;
  let end: number;

  if (size > totalPages) {
    start = 1;
    end = totalPages;
  } else {
    start = current - half_size > 1 ? current - half_size : 1;
    if (start > lastStart) start = lastStart;
    end = start + size - 1;
  }

  const canPrev = current > 1;
  const canNext = current < totalPages;

  return (
    <nav className={"mt-3 flex items-center gap-1.5"} aria-label="Pagination">
      {/* Prev */}

      <Button
        variant="outline"
        size="sm"
        disabled={!canPrev}
        onClick={() => goto(current - 1)}
        className="shadow border rounded-md px-3 py-1 text-sm hover:scale-105 active:bg-zinc-100 active:scale-95"
        aria-label="Previous page"
      >
        Prev
      </Button>

      {/* Page number window */}
      {totalPages > 1 &&
        Array.from(
          { length: Math.max(0, end - start + 1) },
          (_, i) => start + i,
        ).map((p) =>
          p === current ? (
            <Button variant="default" size="sm" key={p} className="scale-110">
              {p}
            </Button>
          ) : (
            <Button
              key={p}
              variant="outline"
              size="sm"
              onClick={() => goto(p)}
              className="shadow border rounded-md px-3 py-1 text-sm hover:scale-105 active:bg-zinc-100 active:scale-95"
              aria-label={`Go to page ${p}`}
            >
              {p}
            </Button>
          ),
        )}

      {/* Next */}

      <Button
        onClick={() => goto(current + 1)}
        variant="outline"
        size="sm"
        disabled={!canNext}
        className="shadow border rounded-md px-3 py-1 text-sm hover:scale-105 active:bg-zinc-100 active:scale-95"
        aria-label="Next page"
      >
        Next
      </Button>
    </nav>
  );
};

export default Pagination;
