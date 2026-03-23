import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  predicting: "bg-zinc-700/85 text-white",
  completed: "bg-green-600/85 text-white",
  failed: "bg-red-600/85 text-white",
};

type Props = {
  status: string;
  className?: string;
};

const PredictionStatusBadge = ({ status, className }: Props) => {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "w-[88px] rounded-full px-2.5 py-0.5 text-xs font-medium flex justify-center items-center",
        STATUS_CLASSES?.[status] ?? "",
        className,
      )}
    >
      {status}
    </Badge>
  );
};

export default PredictionStatusBadge;
