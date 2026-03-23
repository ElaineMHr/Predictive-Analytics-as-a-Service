import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MLProblemSchema, type MLProblemInput } from "./ml_problem.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type {
  ColumnDetails,
  Profile,
} from "@/pages/dashboard/dataset_versions/DatasetVersionDetailPage";
import { create_ml_problem } from "@/lib/actions/mlProblems/mlProblem.action";
import {
  get_dataset_version,
  type DatasetVersion,
} from "@/lib/actions/dataset_versions";
import { useDebounce } from "react-use";

type Props = {
  onCreate: () => Promise<void> | void;
  datasetVersionId?: string;
  columnsDetails?: ColumnDetails[];
};

const MLProblemCreate = ({
  onCreate,
  datasetVersionId,
  columnsDetails,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(datasetVersionId ?? "");
  const [columnsFilter, setColumnsFilter] = useState("");
  const [suggestedAnalysis, setSuggestedAnalysis] = useState("");
  const [datasetVersion, setDatasetVersion] = useState<DatasetVersion | null>(
    null,
  );
  const [debouncedFilter, setDebouncedFilter] = useState("");

  useDebounce(
    () => {
      setDebouncedFilter(columnsFilter);
    },
    500,
    [columnsFilter],
  );

  useEffect(() => {
    async function loadDatasetVersion() {
      if (!id || id.length !== 36) return;
      try {
        const data: DatasetVersion = await get_dataset_version(id);
        setDatasetVersion(data);
      } catch (error) {
        console.log(error);
      }
    }
    loadDatasetVersion();
  }, [id]);

  const profileDetails: ColumnDetails[] = useMemo(() => {
    if (!datasetVersion?.profile_json) return [];
    try {
      const profile: Profile = JSON.parse(datasetVersion.profile_json);
      const details = Object.entries(profile.columns).map(
        ([name, metadata]) => ({
          name: name,
          analysis: metadata.suggested_analysis,
        }),
      );
      return details;
    } catch (error) {
      console.log(error);
      return [];
    }
  }, [datasetVersion]);

  const details = columnsDetails ?? profileDetails;

  const q = debouncedFilter.trim().toLowerCase();
  const filteredColumns = !q
    ? details
    : details.filter((c) => c.name.toLowerCase().includes(q));

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<MLProblemInput>({
    resolver: zodResolver(MLProblemSchema),
    defaultValues: {
      dataset_version_id: datasetVersionId ?? "",
      name: "",
      target: "",
      task: suggestedAnalysis ?? "",
    },
  });

  async function onSubmit(data: MLProblemInput) {
    const res = await create_ml_problem(data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("ML Problem created");
    await onCreate();
    setOpen(false);
    reset({
      name: "",
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="hover:scale-105 active:scale-95">Create</Button>
      </SheetTrigger>
      <SheetContent
        className="flex h-full flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Create ML Problem</SheetTitle>
        </SheetHeader>

        <form
          id="create-mlProblem-form"
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-6"
        >
          <FieldSet>
            <FieldGroup>
              {/* Dataset version id */}
              <Field data-invalid={!!errors.dataset_version_id}>
                <FieldLabel htmlFor="dataset_version_id">
                  Dataset version id
                </FieldLabel>
                <Input
                  id="dataset_version_id"
                  disabled={!!datasetVersionId}
                  aria-invalid={!!errors.dataset_version_id}
                  readOnly={!!datasetVersionId}
                  defaultValue={datasetVersionId ?? ""}
                  {...register("dataset_version_id", {
                    onChange: (e) => {
                      setId(e.target.value);
                    },
                  })}
                />
                <FieldError
                  errors={
                    errors.dataset_version_id
                      ? [errors.dataset_version_id]
                      : undefined
                  }
                />
              </Field>
              {/* ML problem name */}
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="create_name">ML problem name</FieldLabel>
                <Input
                  id="create_name"
                  placeholder="Choose an ML problem name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
              {id && (
                <div>
                  {/* Target Column */}
                  <Controller
                    name="target"
                    control={control}
                    render={({ field }) => (
                      <Field data-invalid={!!errors.target}>
                        <FieldLabel htmlFor="target">Target Column</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const column = details?.find(
                              (c) => c.name === value,
                            );
                            if (column) {
                              setSuggestedAnalysis(column.analysis);
                              setValue("task", column.analysis);
                            }
                          }}
                        >
                          <SelectTrigger
                            aria-invalid={!!errors.target}
                            className="h-9 w-full justify-between text-left border rounded-md text-sm pl-3"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="sticky top-0 z-10 pb-1 border-b bg-popover">
                              <Input
                                placeholder="Filter columns"
                                value={columnsFilter}
                                onChange={(e) =>
                                  setColumnsFilter(e.target.value)
                                }
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                            {filteredColumns.map((c) => (
                              <SelectItem key={c.name} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!field.value ? null : suggestedAnalysis ? (
                          <p className="text-xs text-muted-foreground">
                            Suggested analysis: {suggestedAnalysis}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No suggested analysis for this column
                          </p>
                        )}
                        <FieldError
                          errors={errors.target ? [errors.target] : undefined}
                        />
                      </Field>
                    )}
                  />
                </div>
              )}
              {id && (
                <div>
                  {/* Task */}
                  <Controller
                    name="task"
                    control={control}
                    render={({ field }) => (
                      <Field data-invalid={!!errors.task}>
                        <FieldLabel htmlFor="task">Task</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            aria-invalid={!!errors.task}
                            className="h-9 w-full justify-between text-left border rounded-md text-sm pl-3"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classification">
                              Classification
                            </SelectItem>
                            <SelectItem value="regression">
                              Regression
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError
                          errors={errors.task ? [errors.task] : undefined}
                        />
                      </Field>
                    )}
                  />
                </div>
              )}
            </FieldGroup>
          </FieldSet>
        </form>
        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-20 hover:scale-105 active:scale-95"
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            form="create-mlProblem-form"
            type="submit"
            disabled={isSubmitting}
            className="w-20 hover:scale-105 active:scale-95"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </SheetFooter>
      </SheetContent>
      <SheetOverlay className="bg-black/30 backdrop-blur-sm" />
    </Sheet>
  );
};

export default MLProblemCreate;
