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
  target: { id: string; name: string };
  open: boolean;
  onConfirm: (id: string) => Promise<void>;
  onCancel: () => void;
  setting: boolean;
};

export type SetProdTarget = {
  id: string;
  name: string;
};

const SetModelProduction = ({
  target,
  open,
  onConfirm,
  onCancel,
  setting,
}: Props) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Model to Production</DialogTitle>
          <DialogDescription className="sr-only">
            Setting model {target.name} to "production" will demote any other
            "production" model to "archived".
          </DialogDescription>
          <div className="text-sm">
            Set <b>{target.name}</b> as the active production model?
          </div>
          <div className="text-sm">
            The current production model will be archived.
          </div>
        </DialogHeader>
        <form
          id="stp-model-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (setting) return;
            onConfirm(target.id);
          }}
          className="grid gap-4"
        ></form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="stp-model-form" className="min-w-[78px]">
            {setting ? "Updating…" : "Set"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <DialogOverlay className="bg-black/30 backdrop-blur-sm" />
    </Dialog>
  );
};

export default SetModelProduction;
