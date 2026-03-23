import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { get_dataset_version_csv } from "@/lib/actions/dataset_versions/datasetVersion.action";
import { useEffect, useState } from "react";
import Loading from "../loading/Loading";
import NotFound from "../errors/not_found/NotFound";
import { useSearchParams } from "react-router-dom";
import { PageSize, Pagination, SortableHeader } from "../table";

type Props = {
  uri: string;
};

const DatasetVersionDataTable = ({ uri }: Props) => {
  const [datasetVersionCSV, setDatasetVersionCSV] = useState<{
    column_names: string[];
    rows: Record<string, unknown>[];
  }>({ column_names: [], rows: [] });
  const [csvLoading, setCsvLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort");
  const dir: "asc" | "desc" =
    searchParams.get("dir") === "asc" ? "asc" : "desc";

  useEffect(() => {
    async function loadCSV() {
      if (!uri) return;
      try {
        const data: {
          column_names: string[];
          rows: Record<string, unknown>[];
        } = await get_dataset_version_csv(uri);
        setDatasetVersionCSV(data);
        setCsvLoading(false);
        console.log(data);
      } catch (error) {
        console.log(error);
      } finally {
        setCsvLoading(false);
      }
    }
    loadCSV();
  }, [uri]);

  const columnNames: string[] = datasetVersionCSV.column_names;
  const rows: Record<string, unknown>[] = datasetVersionCSV.rows;
  const colSpan = columnNames.length - 1;
  const total = rows.length;

  const sortedRows =
    !sort || !columnNames.includes(sort)
      ? rows
      : [...rows].sort((rowa, rowb) => {
          const a = rowa[sort];
          const b = rowb[sort];

          // numeric cell sorting
          if (typeof a === "number" && typeof b === "number") {
            return dir === "desc" ? b - a : a - b;
          }

          // string / mixed cell sorting
          return (
            String(a ?? "").localeCompare(String(b ?? ""), undefined, {
              // undefined (no locale specified) -> needed to add "options for localeCompare otherwise function error"
              numeric: true, // numeric option to handle numeric strings correctly
              sensitivity: "base", // base sensitivity -> the comparison is more lenient: eg. a = A
            }) * (dir === "desc" ? -1 : 1)
          );
        });

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / size));
  const offset = (page - 1) * size;
  const filteredRows = sortedRows.slice(offset, offset + size);

  // helper function for stability
  function renderCell(value: unknown): React.ReactNode {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "string") return value;
    // fallback in case everything else fails
    return JSON.stringify(value);
  }

  return (
    <div className="w-full h-full min-h-0">
      {csvLoading ? (
        <div className="h-full flex items-center justify-center">
          <Loading />
        </div>
      ) : rows.length > 0 ? (
        <div>
          <Table>
            <TableCaption>Dataset Version Data</TableCaption>
            <TableHeader>
              <TableRow>
                {columnNames.map((name) => (
                  <TableHead key={name}>
                    <SortableHeader field={name} label={name} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row, i) => (
                <TableRow key={i}>
                  {columnNames.map((col) => (
                    <TableCell key={col}>{renderCell(row[col])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={colSpan}>Total</TableCell>
                <TableCell className="text-right">{total}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
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
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <NotFound name="Dataset Version CSV" />
        </div>
      )}
    </div>
  );
};

export default DatasetVersionDataTable;
