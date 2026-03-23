import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { useState } from "react";

type Props = {
  label: string;
  value: number | string;
  description?: string;
  secondaryValue?: number | string;
  tooltip?: string;
  className?: string;
};

const StatCard = ({
  label,
  value,
  description,
  secondaryValue,
  tooltip,
  className,
}: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip open={open} onOpenChange={setOpen}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="inline-flex items-center"
                >
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="whitespace-pre-line">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="mt-1 flex items-center gap-4">
        <div className="text-2xl font-semibold">{value}</div>
        {secondaryValue && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {secondaryValue}
          </span>
        )}
      </div>
      {description && (
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );
};

export default StatCard;
