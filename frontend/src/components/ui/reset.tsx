import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";

type Props = {
  target: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
  resetting: boolean;
  parent: string;
};

const Reset = ({
  target,
  open,
  onOpenChange,
  onConfirm,
  resetting,
  parent,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset {parent}</DialogTitle>
          <DialogDescription className="sr-only">
            Are you sure you want to reset {parent}?
          </DialogDescription>
          <div className="text-sm">
            Are you sure you want to reset <b>{parent}</b>?
          </div>
        </DialogHeader>
        <form
          id={parent + "-reset-form"}
          onSubmit={(e) => {
            e.preventDefault();
            if (resetting) return;
            onConfirm(target);
          }}
          className="grid gap-4"
        ></form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            form={parent + "-reset-form"}
            className="min-w-[78px]"
          >
            {resetting ? "Resetting…" : "Reset"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <DialogOverlay className="bg-black/30 backdrop-blur-sm" />
    </Dialog>
  );
};

export default Reset;
