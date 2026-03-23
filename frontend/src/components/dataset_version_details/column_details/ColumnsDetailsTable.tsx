import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { Metadata } from "@/pages/dashboard/dataset_versions/DatasetVersionDetailPage";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import Filterbar from "./Filterbar";
import { useSearchParams } from "react-router-dom";
import { PageSize, Pagination } from "@/components/table";

type Props = {
  columns: [string, Metadata][];
};

const ColumnsDetailsTable = ({ columns }: Props) => {
  const [selected, setSelected] = useState<{
    name: string;
    metadata: Metadata;
  } | null>(null);
  const [openTechnical, setOpenTechnical] = useState(false);

  const [searchParams] = useSearchParams();

  const page = Number(searchParams.get("colPage") ?? 1);
  const size = Number(searchParams.get("colSize") ?? 20);

  const colName = searchParams.get("colName") ?? "";
  const colSemantic = searchParams.get("colSemantic") ?? "";
  const colRecommendation = searchParams.get("colRecommendation") ?? "";
  const colSuggested_analysis = searchParams.get("colSuggested_analysis") ?? "";

  const filteredColumns = columns.filter(([name, meta]) => {
    if (colName && !name.toLowerCase().includes(colName.toLowerCase()))
      return false;

    if (colSemantic && colSemantic !== meta.semantic_type) return false;

    if (colRecommendation === "include" && meta.exclude_for_analysis)
      return false;
    if (colRecommendation === "exclude" && !meta.exclude_for_analysis)
      return false;

    if (
      colSuggested_analysis &&
      colSuggested_analysis !== meta.suggested_analysis
    )
      return false;

    return true;
  });

  const totalRows = filteredColumns.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / size));
  const offset = (page - 1) * size;
  const pageRows = filteredColumns.slice(offset, offset + size);

  const warnings: string[] = columns
    .filter(([, meta]) => meta?.warning)
    .map(([col]) => col);

  function pct_string(value?: number, decimals: number = 2) {
    if (value == null) return "—";
    const valuePct = value * 100;
    return valuePct.toFixed(decimals) + "%";
  }

  function round(value?: number) {
    if (value == null) return "—";
    return Math.round(value * 100) / 100;
  }

  return (
    <div>
      <Filterbar />
      <Table>
        <TableCaption>List of Column Details</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Semantic</TableHead>
            <TableHead>Cardinality</TableHead>
            <TableHead>Missing</TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead>Suggested Analysis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map(([name, metadata]) => (
            <TableRow
              key={name}
              onClick={() => {
                setSelected({ name, metadata });
              }}
              className="cursor-pointer"
            >
              {warnings.includes(name) ? (
                <TableCell className="font-medium text-muted-foreground inline-flex items-center gap-1">
                  {name} <AlertTriangle className="h-4 w-4" />
                </TableCell>
              ) : (
                <TableCell className="font-medium">{name}</TableCell>
              )}
              <TableCell className="capitalize">
                {metadata.semantic_type}
              </TableCell>
              <TableCell>{metadata.cardinality}</TableCell>
              <TableCell>{pct_string(metadata.missing_pct)}</TableCell>
              <TableCell>
                {metadata?.exclude_for_analysis ? (
                  <Badge
                    variant={"destructive"}
                    className="w-[88px] flex items-center justify-center"
                  >
                    Exclude
                  </Badge>
                ) : (
                  <Badge
                    variant={"default"}
                    className="w-[88px] flex items-center justify-center"
                  >
                    Include
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {metadata.suggested_analysis !== "none" ? (
                  <span className="capitalize">
                    {metadata.suggested_analysis}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>Total</TableCell>
            <TableCell className="text-right">{columns.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="mt-2 grid grid-cols-3 items-center">
        <div />
        {totalPages > 1 ? (
          <div className="flex justify-center">
            <Pagination totalPages={totalPages} pageParam="colPage" />
          </div>
        ) : (
          <div />
        )}
        <div className="flex justify-end">
          <PageSize size={size} sizeParam="colSize" pageParam="colPage" />
        </div>
      </div>
      {selected && (
        <div>
          <Sheet
            open={!!selected}
            onOpenChange={(v) => !v && setSelected(null)}
          >
            <SheetContent
              className="flex h-full flex-col"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <SheetHeader className="border-b-2 pb-6">
                <SheetTitle className="text-2xl pb-2">
                  <div className="flex items-center justify-between">
                    <div>{selected.name}</div>
                    <span className="capitalize text-xs text-muted-foreground">
                      {selected.metadata.semantic_type}
                    </span>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.metadata.exclude_for_analysis ? (
                      <Badge
                        variant={"destructive"}
                        className="flex items-center justify-center"
                      >
                        Exclude
                      </Badge>
                    ) : (
                      <Badge
                        variant={"default"}
                        className="flex items-center justify-center"
                      >
                        Include
                      </Badge>
                    )}
                    {selected.metadata.suggested_analysis && (
                      <Badge
                        variant={"secondary"}
                        className="capitalize flex items-center justify-center"
                      >
                        {selected.metadata.suggested_analysis}
                      </Badge>
                    )}
                    {selected.metadata.missing_pct > 0 && (
                      <Badge
                        variant={"secondary"}
                        className="flex items-center justify-center"
                      >
                        Missing {pct_string(selected.metadata.missing_pct)}
                      </Badge>
                    )}
                  </div>
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-3">
                <section className="border-b-2 pb-4">
                  <div className="font-semibold text-lg pb-4">Quick Stats</div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">
                        Cardinality:{" "}
                      </span>
                      {selected.metadata.cardinality}
                    </div>
                  </div>
                  {selected.metadata.semantic_type === "numeric" && (
                    <div className="grid grid-cols-2 text-sm gap-1 pt-1">
                      <div>
                        <span className="text-muted-foreground">Min: </span>
                        {round(selected.metadata?.min)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max: </span>
                        {round(selected.metadata?.max)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mean: </span>
                        {round(selected.metadata?.mean)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Std: </span>
                        {round(selected.metadata?.std)}
                      </div>
                    </div>
                  )}
                  {selected.metadata.semantic_type === "categorical" && (
                    <div className="text-sm space-y-1 pt-1">
                      <div>
                        <span className="text-muted-foreground">
                          Prevalent value:{" "}
                        </span>
                        {selected.metadata?.top_value}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Value prevalence:{" "}
                        </span>
                        {pct_string(selected.metadata?.top_freq_ratio, 0)}
                      </div>
                    </div>
                  )}
                  {selected.metadata.semantic_type === "boolean" && (
                    <div className="text-sm space-y-1 pt-1">
                      <div>
                        true_pct: {pct_string(selected.metadata?.true_pct)}
                      </div>
                      <div>
                        false_pct: {pct_string(selected.metadata?.false_pct)}
                      </div>
                    </div>
                  )}
                  {selected.metadata.semantic_type === "datetime" && (
                    <div className="text-sm space-y-1 pt-1">
                      <div>
                        earliest_date: {selected.metadata?.earliest_date}
                      </div>
                      <div>latest_date: {selected.metadata?.latest_date}</div>
                    </div>
                  )}
                </section>
                <section className="border-b-2 pb-4">
                  {selected.metadata?.warning ? (
                    <div>
                      <div className="font-semibold text-lg pb-4 inline-flex items-center gap-2">
                        Warning <AlertTriangle className="h-5 w-5" />
                      </div>
                      {selected.metadata?.warning === "high_cardinality" && (
                        <div className="text-muted-foreground text-sm">
                          Column contains many distinct values and may require
                          special handling when used in a model.
                        </div>
                      )}
                      <div className="border-b-2 pb-4" />
                      <div className="font-semibold text-lg pt-3 pb-4">
                        Suggested Analysis
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Not recommended as a prediction target due to high
                        cardinality.
                      </div>
                    </div>
                  ) : selected.metadata?.exclusion_reason ? (
                    <div>
                      <div className="font-semibold text-lg pb-4">
                        Exclusion Reason
                      </div>
                      {selected.metadata?.exclusion_reason === "empty" && (
                        <div className="text-muted-foreground text-sm">
                          Column is entirely missing.
                        </div>
                      )}
                      {selected.metadata?.exclusion_reason === "constant" && (
                        <div className="text-muted-foreground text-sm">
                          Column has no variance.
                        </div>
                      )}
                      {selected.metadata?.exclusion_reason === "id_like" && (
                        <div className="text-muted-foreground text-sm">
                          Column appears to be an identifier (unique per row)
                          and is unlikely to be predictive.
                        </div>
                      )}
                      {selected.metadata?.exclusion_reason ===
                        "high_cardinality" && (
                        <div className="text-muted-foreground text-sm">
                          Column contains many distinct values and is likely
                          unstructured or noise.
                        </div>
                      )}
                      {selected.metadata?.exclusion_reason === "datetime" && (
                        <div className="text-muted-foreground text-sm">
                          Datetime columns are excluded by default from
                          classification and regression.
                        </div>
                      )}
                      {selected.metadata?.exclusion_reason ===
                        "unsupported_dtype" && (
                        <div className="text-muted-foreground text-sm">
                          Column uses an unsupported data type.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-lg pb-4">
                        Suggested Analysis
                      </div>
                      {selected.metadata?.suggested_analysis ===
                      "regression" ? (
                        <div className="text-muted-foreground text-sm">
                          Continuous numeric values are best modeled using
                          regression.
                        </div>
                      ) : (
                        <>
                          {selected.metadata?.semantic_type === "numeric" && (
                            <div className="text-muted-foreground text-sm">
                              Discrete numeric values with few distinct outcomes
                              are best modeled using classification.
                            </div>
                          )}
                          {selected.metadata?.semantic_type ===
                            "categorical" && (
                            <div className="text-muted-foreground text-sm">
                              Categorical values with limited distinct
                              categories are best modeled using classification.
                            </div>
                          )}
                          {selected.metadata?.semantic_type === "boolean" && (
                            <div className="text-muted-foreground text-sm">
                              Binary values are best modeled using
                              classification.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </section>
                <section>
                  <div>
                    <Button
                      variant={"ghost"}
                      className="-ml-3 font-semibold text-lg flex items-center justify-center"
                      size="sm"
                      onClick={() => {
                        setOpenTechnical((v) => !v);
                      }}
                    >
                      Technical Information{" "}
                      {openTechnical ? <ChevronDown /> : <ChevronUp />}
                    </Button>
                  </div>
                  {openTechnical && (
                    <div>
                      <div className="text-sm space-y-1 pt-4">
                        <div>
                          <span className="text-muted-foreground">
                            Datatype:{" "}
                          </span>
                          {selected.metadata.dtype_raw}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Cardinality ratio:{" "}
                          </span>
                          {selected.metadata.cardinality_ratio.toFixed(2)}
                        </div>
                      </div>
                      <div className="py-2 font-semibold text-sm">Flags</div>
                      <div className="pl-3 space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            is_unique:{" "}
                          </span>
                          {selected.metadata.is_unique ? "True" : "False"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            is_constant:{" "}
                          </span>
                          {selected.metadata.is_constant ? "True" : "False"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            is_constant:{" "}
                          </span>
                          {selected.metadata.is_empty ? "True" : "False"}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
              <SheetFooter className="mt-auto">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    onClick={() => setSelected(null)}
                    className="w-20 hover:scale-105 active:scale-95"
                  >
                    Close
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
            <SheetOverlay className="bg-black/30 backdrop-blur-sm" />
          </Sheet>
        </div>
      )}
    </div>
  );
};

export default ColumnsDetailsTable;
