import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DatasetVersionSchema,
  type DatasetVersionInput,
} from "./datasetVersion.schema";
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
import { create_dataset_version } from "@/lib/actions/dataset_versions/datasetVersion.action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Trash } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  datasetId?: string;
  onCreate: () => Promise<void> | void;
};

type Mode = "new" | "existing";

const DatasetVersionCreate = ({ datasetId, onCreate }: Props) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("new");
  const [hasFile, setHasFile] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<DatasetVersionInput>({
    resolver: zodResolver(DatasetVersionSchema),
    defaultValues: {
      dataset_id: datasetId ?? "",
      name: "",
      file: undefined,
      file_id: "",
    },
  });

  function clearInputFile() {
    setValue("file", undefined);
    setHasFile(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onSubmit(data: DatasetVersionInput) {
    const res = await create_dataset_version(data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Dataset Version created");
    await onCreate();
    setOpen(false);
    reset({
      dataset_id: datasetId ?? "",
      name: "",
      file: undefined,
      file_id: "",
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
          <SheetTitle>Create a new Dataset Version</SheetTitle>
        </SheetHeader>

        <form
          id="create-dataset-version-form"
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-6"
        >
          <FieldSet>
            <FieldGroup>
              {/* Dataset id */}
              <Field data-invalid={!!errors.dataset_id}>
                <FieldLabel htmlFor="dataset_id">Dataset id</FieldLabel>
                <Input
                  id="dataset_id"
                  disabled={!!datasetId}
                  aria-invalid={!!errors.dataset_id}
                  readOnly={!!datasetId}
                  defaultValue={datasetId ?? ""}
                  {...register("dataset_id")}
                />
                <FieldError
                  errors={errors.dataset_id ? [errors.dataset_id] : undefined}
                />
              </Field>
              {/* Dataset version name */}
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="create_name">
                  Dataset version name
                </FieldLabel>
                <Input
                  id="create_name"
                  placeholder="Choose a dataset name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
              {/* Data File */}
              <FieldLabel>Data File</FieldLabel>
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  const next = v as Mode;
                  setMode(next);
                  if (next === "new") {
                    setValue("file_id", "");
                  } else {
                    clearInputFile();
                  }
                }}
                className="-mt-4"
              >
                <TabsList>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="existing">Existing</TabsTrigger>
                </TabsList>
                <TabsContent value="new">
                  {/* Upload CSV */}
                  <Field data-invalid={!!errors.file}>
                    <div className="flex gap-2 items-center">
                      <Controller
                        name="file"
                        control={control}
                        render={({ field }) => (
                          <Input
                            ref={inputRef}
                            id="file"
                            type="file"
                            accept=".csv,text/csv"
                            multiple={false}
                            aria-invalid={!!errors.file}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              field.onChange(f);
                              setHasFile(!!f);
                            }}
                            className={cn(
                              "text-sm",
                              "px-3",
                              "text-muted-foreground",
                              "file:mr-1",
                              "file:px-0",
                              "file:h-9",
                              "file:pb-3",
                              "file:rounded-md",
                              "file:border-0",
                              "file:bg-transparent",
                              "file:text-sm",
                              "file:font-medium",
                              "file:text-muted-foreground",
                            )}
                          />
                        )}
                      />
                      {hasFile && (
                        <Button
                          variant={"outline"}
                          onClick={clearInputFile}
                          className="h-9 w-9 shrink-0"
                        >
                          <Trash className="text-red-500" />
                        </Button>
                      )}
                    </div>
                    <FieldError
                      errors={errors.file ? [errors.file] : undefined}
                    />
                  </Field>
                </TabsContent>
                <TabsContent value="existing">
                  {/* Choose existing CSV */}
                  <Controller
                    name="file_id"
                    control={control}
                    render={({ field }) => (
                      <Field data-invalid={!!errors.file_id}>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            aria-invalid={!!errors.file_id}
                            className="h-9 w-full justify-between text-left border rounded-md text-sm pl-3"
                          >
                            <SelectValue placeholder="Choose an existing file" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aaa" disabled={true}>
                              Unavailable Feature!
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError
                          errors={errors.file_id ? [errors.file_id] : undefined}
                        />
                      </Field>
                    )}
                  />
                </TabsContent>
              </Tabs>
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
            form="create-dataset-version-form"
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

export default DatasetVersionCreate;
