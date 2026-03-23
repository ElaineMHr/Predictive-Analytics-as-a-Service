import {
  reset_feature_strategy,
  update_feature_strategy,
  type MLProblem,
} from "@/lib/actions/mlProblems/mlProblem.action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { FeatureStrategy } from "@/pages/dashboard/ml_problems/MLProblemDetailPage";
import ColumnBadges from "../ui/column-badges";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import Combobox from "../ui/combobox";
import { toast } from "sonner";
import Reset from "../ui/reset";

type Props = {
  datasetId: string;
  datasetVersionId: string;
  datasetVersionName?: string;
  mlProblem: MLProblem;
  featureStrategy: FeatureStrategy;
  columnNames: string[];
  prodModelName?: string;
  prodModelId?: string;
  configured?: boolean;
  onRefresh: () => Promise<void>;
};

const MLProblemDetails = ({
  datasetId,
  datasetVersionId,
  datasetVersionName,
  mlProblem,
  featureStrategy,
  columnNames,
  prodModelName,
  prodModelId,
  configured = false,
  onRefresh,
}: Props) => {
  const [openTechnical, setOpenTechnical] = useState(false);
  const [editingIncludes, setEditingIncludes] = useState(false);
  const [editingExcludes, setEditingExcludes] = useState(false);
  const [openReset, setOpenReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const semanticTypesJSON = JSON.parse(mlProblem.semantic_types);
  const semanticTypes: [string, string[]][] = Object.entries(semanticTypesJSON);

  type IncludesForm = { columns: string[] };
  type ExcludesForm = { columns: string[] };

  const includeDefaults = featureStrategy.include ?? [];
  const excludeDefaults = featureStrategy.exclude ?? [];

  const onSaveIncludes = async (data: IncludesForm) => {
    if (!mlProblem.id || !data) return;
    const res = await update_feature_strategy(mlProblem.id, {
      include: data.columns,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Feature strategy updated");
    await onRefresh();
    setEditingIncludes(false);
    resetInclude(data);
  };

  const onSaveExcludes = async (data: ExcludesForm) => {
    if (!mlProblem.id || !data) return;
    const res = await update_feature_strategy(mlProblem.id, {
      exclude: data.columns,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Feature strategy updated");
    await onRefresh();
    setEditingExcludes(false);
    resetExclude(data);
  };

  const onReset = async () => {
    if (!mlProblem.id) return;
    setResetting(true);
    const res = await reset_feature_strategy(mlProblem.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Feature strategy updated");
    await onRefresh();
    setEditingIncludes(false);
    setEditingExcludes(false);
    setOpenReset(false);
    setResetting(false);
  };

  const {
    control: includeControl,
    handleSubmit: handleIncludeSubmit,
    formState: { errors: includeErrors, isSubmitting: includeSubmitting },
    reset: resetInclude,
  } = useForm<IncludesForm>({
    defaultValues: { columns: includeDefaults },
  });

  const {
    control: excludeControl,
    handleSubmit: handleExcludeSubmit,
    formState: { errors: excludeErrors, isSubmitting: excludeSubmitting },
    reset: resetExclude,
  } = useForm<ExcludesForm>({
    defaultValues: { columns: excludeDefaults },
  });

  return (
    <div>
      <section>
        <h3 className="mt-8 mb-4 text-sm font-medium text-muted-foreground">
          ML Problem Summary
        </h3>
        <Card className="w-full h-full flex flex-col text-foreground">
          <CardHeader>
            <CardTitle>{mlProblem.name ?? "Unknown ML Problem"}</CardTitle>
          </CardHeader>
          <CardDescription />
          <CardContent className="flex flex-1 flex-col text-sm">
            <div>
              <span className="text-muted-foreground/80">Task: </span>
              <span className="capitalize">{mlProblem.task}</span>
            </div>
            <div>
              <span className="text-muted-foreground/80">Target: </span>
              <span>{mlProblem.target}</span>
            </div>
            <div>
              <span className="text-muted-foreground/80">
                Dataset Version:{" "}
              </span>
              <Link
                to={`../datasets/${datasetId}/${datasetVersionId}`}
                aria-label="View dataset version"
                className="inline-flex items-center gap-1 group"
              >
                <span>{datasetVersionName ?? "Unknown Dataset Version"}</span>
                <FileText className="w-3 h-3 group-hover:text-sky-400 group-hover:scale-105 active:scale-95" />
              </Link>
            </div>
            <div>
              <span className="text-muted-foreground/80">Created: </span>
              <span className="capitalize">{mlProblem.created_at}</span>
            </div>
            {prodModelId && (
              <div>
                <span className="text-muted-foreground/80">
                  Production Model:{" "}
                </span>
                <Link
                  to={`${prodModelId}`}
                  aria-label="View dataset version"
                  className="inline-flex items-center gap-1 group"
                >
                  <span>{prodModelName ?? "Unknown Model"}</span>
                  <FileText className="w-3 h-3 group-hover:text-sky-400 group-hover:scale-105 active:scale-95" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      <section>
        <div className="mt-8 mb-4 flex items-center gap-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Feature Strategy
          </h3>
          {!configured ? (
            <Button
              className="h-6 px-2 py-0 text-xs"
              variant={"default"}
              onClick={() => setOpenReset(true)}
            >
              Reset to default
            </Button>
          ) : (
            <div className="text-muted-foreground text-sm">
              <i>(Feature strategy can only be changed when no model exists)</i>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Card className="w-full h-full flex flex-col text-foreground">
            <CardHeader>
              <div className="flex items-center justify-between text-foreground">
                <CardTitle>Include</CardTitle>
                {!configured &&
                  (!editingIncludes ? (
                    <Button
                      className="h-6 px-2 py-0 text-xs"
                      variant="default"
                      onClick={() => setEditingIncludes(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        className="h-6 min-w-[52px] px-2 py-0 text-xs"
                        variant="default"
                        type="submit"
                        form="update-includes"
                        disabled={includeSubmitting}
                      >
                        Save
                      </Button>
                      <Button
                        className="h-6 min-w-[52px] px-2 py-0 text-xs"
                        variant="secondary"
                        onClick={() => {
                          resetInclude({ columns: includeDefaults });
                          setEditingIncludes(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
              </div>
            </CardHeader>
            <CardDescription />
            <CardContent className="flex flex-1 flex-col text-sm">
              {!editingIncludes ? (
                <ColumnBadges
                  items={featureStrategy.include}
                  className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  empty="Auto"
                />
              ) : (
                <form
                  id="update-includes"
                  onSubmit={handleIncludeSubmit(onSaveIncludes)}
                >
                  <Controller
                    name="columns"
                    control={includeControl}
                    render={({ field }) => (
                      <Field data-invalid={!!includeErrors.columns}>
                        <FieldLabel />
                        <Combobox
                          options={columnNames}
                          value={field.value ?? []}
                          onChange={field.onChange}
                          placeholder="Select columns to include"
                          searchPlaceholder="Filter columns"
                        />
                        <FieldError
                          errors={
                            includeErrors.columns
                              ? [includeErrors.columns]
                              : undefined
                          }
                        />
                      </Field>
                    )}
                  />
                </form>
              )}
            </CardContent>
          </Card>
          <Card className="w-full h-full flex flex-col text-foreground">
            <CardHeader>
              <div className="flex items-center justify-between text-foreground">
                <CardTitle>Exclude</CardTitle>
                {!configured &&
                  (!editingExcludes ? (
                    <Button
                      className="h-6 px-2 py-0 text-xs"
                      variant="default"
                      onClick={() => setEditingExcludes(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        className="h-6 min-w-[52px] px-2 py-0 text-xs"
                        variant="default"
                        type="submit"
                        form="update-excludes"
                        disabled={excludeSubmitting}
                      >
                        Save
                      </Button>
                      <Button
                        className="h-6 min-w-[52px] px-2 py-0 text-xs"
                        variant="secondary"
                        onClick={() => {
                          resetExclude({ columns: excludeDefaults });
                          setEditingExcludes(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
              </div>
            </CardHeader>
            <CardDescription />
            <CardContent className="flex flex-1 flex-col text-sm">
              {!editingExcludes ? (
                <ColumnBadges
                  items={featureStrategy.exclude}
                  className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  empty="None"
                />
              ) : (
                <form
                  id="update-excludes"
                  onSubmit={handleExcludeSubmit(onSaveExcludes)}
                >
                  <Controller
                    name="columns"
                    control={excludeControl}
                    render={({ field }) => (
                      <Field data-invalid={!!excludeErrors.columns}>
                        <FieldLabel />
                        <Combobox
                          options={columnNames}
                          value={field.value ?? []}
                          onChange={field.onChange}
                          placeholder="Select columns to exclude"
                          searchPlaceholder="Filter columns"
                        />
                        <FieldError
                          errors={
                            excludeErrors.columns
                              ? [excludeErrors.columns]
                              : undefined
                          }
                        />
                      </Field>
                    )}
                  />
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      <section>
        <Button
          variant={"ghost"}
          className="mt-7 mb-3.5 -ml-3 font-semibold text-lg flex items-center justify-center"
          size="sm"
          onClick={() => {
            setOpenTechnical((v) => !v);
          }}
        >
          <h3 className="text-sm font-medium text-muted-foreground">
            Technical Information
          </h3>
          {openTechnical ? <ChevronDown /> : <ChevronUp />}
        </Button>
        {openTechnical && (
          <Card className="w-full h-full flex flex-col text-foreground">
            <CardHeader>
              <CardTitle>Training features</CardTitle>
            </CardHeader>
            <CardDescription />
            <CardContent className="flex flex-1 flex-col text-sm space-y-4">
              {semanticTypes.map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <div className="capitalize text-muted-foreground font-semibold text-sm">
                    {group} features ({items.length})
                  </div>
                  <ColumnBadges
                    items={items}
                    className="grid-cols-3 sm:grid-cols-5 lg:grid-cols-8"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
      <Reset
        target={mlProblem.id}
        open={openReset}
        onOpenChange={setOpenReset}
        onConfirm={onReset}
        resetting={resetting}
        parent="Feature Strategy"
      />
    </div>
  );
};

export default MLProblemDetails;
