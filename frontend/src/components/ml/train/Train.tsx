import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrainFormSchema, type TrainFormInput } from "./trainForm.schema";
import { toast } from "sonner";
import {
  Sheet,
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { Switch } from "@/components/ui/switch";
import { post_train } from "@/lib/actions/ml/train.action";
import {
  get_ml_problem,
  type MLProblem,
} from "@/lib/actions/mlProblems/mlProblem.action";
import { get_presets_list } from "@/lib/actions/presets";

type Props = {
  problemId?: string;
  task?: string;
  onCreate: () => Promise<void> | void;
};

const Train = ({ problemId, task, onCreate }: Props) => {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(problemId ?? "");
  const [presets, setPresets] = useState<string[]>([]);

  useEffect(() => {
    async function loadPresets() {
      try {
        if (task) {
          const data: string[] = await get_presets_list(task);
          setPresets(data);
          return;
        }
        if (!id || id.length !== 36) {
          setPresets([]);
          return;
        }
        const mlProblem: MLProblem = await get_ml_problem(id);
        const data: string[] = await get_presets_list(mlProblem.task);
        setPresets(data);
      } catch (error) {
        console.log(error);
        setPresets([]);
      }
    }
    loadPresets();
  }, [id, task]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TrainFormInput>({
    resolver: zodResolver(TrainFormSchema),
    defaultValues: {
      problem_id: problemId ?? "",
      name: "",
      algorithm: "auto",
      train_mode: "balanced",
      evaluation_strategy: "cv",
      explanation: true,
    },
  });

  async function onSubmit(data: TrainFormInput) {
    const res = await post_train(data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Training started");
    await onCreate();
    setOpen(false);
    reset({
      problem_id: problemId ?? "",
      name: "",
      algorithm: "auto",
      train_mode: "balanced",
      evaluation_strategy: "cv",
      explanation: true,
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="hover:scale-105 active:scale-95">Train Model</Button>
      </SheetTrigger>
      <SheetContent
        className="flex h-full flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Train Model</SheetTitle>
        </SheetHeader>

        <form
          id="train_form"
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-6"
        >
          <FieldSet>
            <FieldGroup>
              {/* Problem id */}
              <Field data-invalid={!!errors.problem_id}>
                <FieldLabel htmlFor="problem_id">Problem id</FieldLabel>
                <Input
                  id="problem_id"
                  disabled={!!problemId}
                  aria-invalid={!!errors.problem_id}
                  readOnly={!!problemId}
                  defaultValue={problemId ?? ""}
                  {...register("problem_id", {
                    onChange: (e) => {
                      setId(e.target.value);
                    },
                  })}
                />
                <FieldError
                  errors={errors.problem_id ? [errors.problem_id] : undefined}
                />
              </Field>
              {/* Model name */}
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Model name</FieldLabel>
                <Input
                  id="name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
              {/* Algorithm */}
              <Controller
                name="algorithm"
                control={control}
                render={({ field }) => (
                  <Field data-invalid={!!errors.algorithm}>
                    <FieldLabel htmlFor="algorithm">Algorithm</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        aria-invalid={!!errors.algorithm}
                        className="h-9 w-full justify-between text-left border rounded-md text-sm pl-3 capitalize"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {presets.map((preset: string) => (
                          <SelectItem
                            key={preset}
                            value={preset}
                            className="capitalize"
                          >
                            {preset.replaceAll("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={errors.algorithm ? [errors.algorithm] : undefined}
                    />
                    <FieldDescription>
                      Use "Auto" for the default.
                    </FieldDescription>
                  </Field>
                )}
              />
              {/* Train Mode */}
              <Controller
                name="train_mode"
                control={control}
                render={({ field }) => (
                  <Field data-invalid={!!errors.train_mode}>
                    <FieldLabel htmlFor="train_mode">Train Mode</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        aria-invalid={!!errors.train_mode}
                        className="h-9 w-full justify-between text-left border rounded-md text-sm pl-3"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="accurate">Accurate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={
                        errors.train_mode ? [errors.train_mode] : undefined
                      }
                    />
                  </Field>
                )}
              />
              {/* Evaluation Strategy */}
              <Controller
                name="evaluation_strategy"
                control={control}
                render={({ field }) => (
                  <Field data-invalid={!!errors.evaluation_strategy}>
                    <FieldLabel htmlFor="evaluation_strategy">
                      Evaluation Strategy
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className="h-9 w-full justify-between text-left border rounded-md text-sm pl-3"
                        aria-invalid={!!errors.evaluation_strategy}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cv">Cross Validation</SelectItem>
                        <SelectItem value="holdout">Holdout</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={
                        errors.evaluation_strategy
                          ? [errors.evaluation_strategy]
                          : undefined
                      }
                    />
                  </Field>
                )}
              />
              {/* Explanation */}
              <Controller
                name="explanation"
                control={control}
                render={({ field }) => (
                  <Field data-invalid={!!errors.explanation}>
                    <div className="flex items-center justify-start gap-4">
                      <FieldLabel htmlFor="explanation">Explain</FieldLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="shrink-0 w-9"
                      />
                      <FieldLabel className="font-normal text-muted-foreground">
                        {field.value ? "Yes" : "No"}
                      </FieldLabel>
                    </div>
                    <FieldError
                      errors={
                        errors.explanation ? [errors.explanation] : undefined
                      }
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
        </form>
        <SheetFooter className="mt-auto">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-20 hover:scale-105 active:scale-95"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="train_form"
            disabled={isSubmitting}
            className="w-20 hover:scale-105 active:scale-95"
          >
            {isSubmitting ? "Sending..." : "Train"}
          </Button>
        </SheetFooter>
      </SheetContent>
      <SheetOverlay className="bg-black/30 backdrop-blur-sm" />
    </Sheet>
  );
};

export default Train;
