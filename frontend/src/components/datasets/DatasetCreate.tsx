import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { create_dataset } from "@/lib/actions/datasets/dataset.action";
import { DatasetSchema, type DatasetInput } from "./dataset.schema";

type Props = {
  onCreate: () => Promise<void> | void;
};

const DatasetCreate = ({ onCreate }: Props) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DatasetInput>({
    resolver: zodResolver(DatasetSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(data: DatasetInput) {
    const res = await create_dataset(data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Dataset created");
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
          <SheetTitle>Create a new Dataset</SheetTitle>
        </SheetHeader>

        <form
          id="create-dataset-form"
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-6"
        >
          <FieldSet>
            <FieldGroup>
              {/* Dataset Name */}
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="create_name">Dataset name</FieldLabel>
                <Input
                  id="create_name"
                  placeholder="Choose a dataset name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
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
            form="create-dataset-form"
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

export default DatasetCreate;
