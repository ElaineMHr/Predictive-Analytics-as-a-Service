import { useState } from "react";
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Props = {
  target: { id: string; name: string };
  open: boolean;
  onConfirm: (id: string) => Promise<void>;
  onCancel: () => void;
  deleting: boolean;
};

export type DeleteTarget = {
  id: string;
  name: string;
};

const ModelDelete = ({
  target,
  open,
  onConfirm,
  onCancel,
  deleting,
}: Props) => {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText.trim().toLowerCase() === "delete";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Model</DialogTitle>
          <DialogDescription className="sr-only">
            Deleting the model with name {target.name} will permanently deletes
            all associated predictions. Type delete to confirm.
          </DialogDescription>
          <div className="text-sm">
            Are you sure you want to delete model: <b>{target.name}?</b>
          </div>
          <div className="text-muted-foreground text-sm">
            <i>id: {target.id}</i>
          </div>
          <div className="text-sm">
            Deleting this model will permanently delete all associated
            predictions.
          </div>
        </DialogHeader>
        <form
          id="delete-model-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canDelete || deleting) return;
            onConfirm(target.id);
          }}
          className="grid gap-4"
        >
          <div className="grid gap-3">
            <Label htmlFor="delete">Type "delete" to confirm</Label>
            <Input
              id="delete"
              name="delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            type="submit"
            form="delete-model-form"
            disabled={!canDelete || deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <DialogOverlay className="bg-black/30 backdrop-blur-sm" />
    </Dialog>
  );
};

export default ModelDelete;
