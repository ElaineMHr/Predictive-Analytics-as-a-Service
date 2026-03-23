import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "../ui/sheet";
import {
  FieldSet,
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "../ui/field";
import { ModelUpdateSchema, type ModelUpdateInput } from "./model.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

type Props = {
  target: { id: string; name: string };
  open: boolean;
  onConfirm: (id: string, data: ModelUpdateInput) => Promise<void>;
  onCancel: () => void;
};

export type UpdateTarget = {
  id: string;
  name: string;
};

const ModelUpdate = ({ target, open, onConfirm, onCancel }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ModelUpdateInput>({
    resolver: zodResolver(ModelUpdateSchema),
    defaultValues: {
      name: target.name,
    },
  });

  // this useEffect is only for safety reasons
  useEffect(() => {
    if (open) reset({ name: target.name });
  }, [open, target.id, target.name, reset]);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <SheetContent
        className="flex h-full flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Update Model</SheetTitle>
          <SheetDescription>{target.name}</SheetDescription>
        </SheetHeader>

        <form
          id="update-model-form"
          onSubmit={handleSubmit((data) => onConfirm(target.id, data))}
          className="mt-6 space-y-6"
        >
          <FieldSet>
            <FieldGroup>
              {/* Model Name */}
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="update_name">Model name</FieldLabel>
                <Input
                  id="update_name"
                  placeholder="Choose a model name"
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
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button
            type="submit"
            form="update-model-form"
            disabled={isSubmitting}
            className="w-20 hover:scale-105 active:scale-95"
          >
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </SheetFooter>
      </SheetContent>
      <SheetOverlay className="bg-black/30 backdrop-blur-sm" />
    </Sheet>
  );
};

export default ModelUpdate;
