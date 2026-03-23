import type { Profile } from "@/pages/dashboard/dataset_versions/DatasetVersionDetailPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import StatCard from "../ui/stat-card";
import ColumnBadges from "../ui/column-badges";
import { Button } from "../ui/button";
import ColumnsDetailsTable from "./column_details/ColumnsDetailsTable";
import { AlertTriangle } from "lucide-react";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Controller, useForm } from "react-hook-form";
import Combobox from "../ui/combobox";
import {
  calculate_profile,
  update_exclude_suggestions,
} from "@/lib/actions/dataset_versions/datasetVersion.action";
import { toast } from "sonner";
import Reset from "../ui/reset";

type Props = {
  datasetVersionId: string;
  profile: Profile;
  onRefresh: () => Promise<void>;
};

const DatasetVersionDetails = ({
  datasetVersionId,
  profile,
  onRefresh,
}: Props) => {
  const [tabValue, setTabValue] = useState("summary");
  const [editing, setEditing] = useState(false);
  const [openReset, setOpenReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const nCols = profile.summary?.n_cols ?? 0;
  const nRows = profile.summary?.n_rows ?? 0;
  const missingPct = profile.summary?.missing_pct ?? 0;
  const missingValues = (missingPct * 100).toFixed(2).toString() + "%";
  const idCandidates = Object.entries(profile?.id_candidates) ?? [];
  // const excludeSuggestions = Object.entries(profile?.exclude_suggestions ?? {});
  // const leakageColumns = Object.entries(profile?.leakage_columns) ?? [];
  const warnings: string[] = Object.entries(profile.columns)
    .filter(([, meta]) => meta?.warning)
    .map(([col]) => col);

  const columnNames = Object.keys(profile.columns);

  const excludeDefaults = Object.values(profile?.exclude_suggestions ?? {});

  type ExclusionsForm = {
    columns: string[];
  };

  async function onSave(data: ExclusionsForm) {
    if (!datasetVersionId || !data) return;
    const res = await update_exclude_suggestions(datasetVersionId, {
      exclude: data.columns,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Profile updated");
    await onRefresh();
    setEditing(false);
    reset(data);
  }

  const onReset = async () => {
    if (!datasetVersionId) return;
    setResetting(true);
    const res = await calculate_profile(datasetVersionId);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Profile updated");
    await onRefresh();
    setEditing(false);
    setOpenReset(false);
    setResetting(false);
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExclusionsForm>({
    defaultValues: {
      columns: excludeDefaults,
    },
  });

  return (
    <div>
      <Tabs className="w-full" value={tabValue} onValueChange={setTabValue}>
        <TabsList className="w-full items-center justify-start gap-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="columns">Columns</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <section>
            <h3 className="mt-8 mb-4 text-sm font-medium text-muted-foreground">
              Dataset Version Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <StatCard label="Columns" value={nCols} />
              <StatCard label="Rows" value={nRows} />
              <StatCard label="Missing values" value={missingValues} />
            </div>
          </section>
          <section>
            <div className="mt-8 mb-4 flex items-center gap-6">
              <h3 className="text-sm font-medium text-muted-foreground">
                Column Analysis
              </h3>
              <Button
                className="h-6 px-2 py-0 text-xs"
                variant={"default"}
                onClick={() => setOpenReset(true)}
              >
                Reset to default
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
              <Card className="w-full h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between text-foreground">
                    <CardTitle>Suggested Exclusions</CardTitle>
                    {!editing ? (
                      <Button
                        className="h-6 px-2 py-0 text-xs"
                        variant={"default"}
                        onClick={() => setEditing(true)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          className="h-6 min-w-[52px] px-2 py-0 text-xs"
                          variant={"default"}
                          type="submit"
                          form="update-exclusions"
                          disabled={isSubmitting}
                        >
                          Save
                        </Button>
                        <Button
                          className="h-6 min-w-[52px] px-2 py-0 text-xs"
                          variant={"secondary"}
                          onClick={() => {
                            reset({
                              columns: excludeDefaults,
                            });
                            setEditing(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription className="font-normal italic text-xs">
                    Columns that are excluded by default when creating ML
                    problems.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col text-sm">
                  {!editing ? (
                    <ColumnBadges items={excludeDefaults} />
                  ) : (
                    <form
                      id="update-exclusions"
                      onSubmit={handleSubmit(onSave)}
                    >
                      <Controller
                        name="columns"
                        control={control}
                        render={({ field }) => (
                          <Field data-invalid={!!errors.columns}>
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
                                errors.columns ? [errors.columns] : undefined
                              }
                            />
                          </Field>
                        )}
                      />
                    </form>
                  )}
                </CardContent>
              </Card>
              <Card className="w-full h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between text-foreground">
                    <CardTitle>Identifier Columns</CardTitle>
                    <div className="h-6" />
                  </div>
                  <CardDescription className="font-normal italic text-xs">
                    Columns likely to act as unique identifiers and should
                    usually be excluded.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col text-sm">
                  <ColumnBadges items={idCandidates} />
                </CardContent>
              </Card>
              <Card className="w-full h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between text-foreground">
                    <CardTitle className="inline-flex items-center gap-2">
                      Warnings <AlertTriangle className="h-5 w-5" />
                    </CardTitle>
                    <div className="h-6" />
                  </div>
                  <CardDescription className="font-normal italic text-xs">
                    Columns that contain many distinct values and may require
                    special handling when used in a model.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col text-sm">
                  <ColumnBadges items={warnings} />
                </CardContent>
              </Card>
              {/* <Card className="w-full h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between text-foreground">
                    <CardTitle>Potential Data Leakage (manual)</CardTitle>
                    <Button
                      className="h-6 px-2 py-0 text-xs"
                      variant={"default"}
                    >
                      Edit
                    </Button>
                  </div>
                  <CardDescription className="font-normal italic text-xs">
                    Columns that may leak future information into the model.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col text-sm">
                  <ColumnBadges items={leakageColumns} />
                </CardContent>
              </Card> */}
            </div>
            <Reset
              target={datasetVersionId}
              open={openReset}
              onOpenChange={setOpenReset}
              onConfirm={onReset}
              resetting={resetting}
              parent="Profile"
            />
          </section>
        </TabsContent>
        <TabsContent value="columns">
          <ColumnsDetailsTable columns={Object.entries(profile?.columns)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatasetVersionDetails;
