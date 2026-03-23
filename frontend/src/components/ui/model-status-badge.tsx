import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  training: "bg-zinc-700/85 text-white",
  staging: "bg-sky-600/85 text-white",
  production: "bg-orange-600/85 text-white",
  archived: "bg-amber-400/85 text-zinc-950",
  failed: "bg-red-600/85 text-white",
};

type Props = {
  status: string;
  className?: string;
};

const ModelStatusBadge = ({ status, className }: Props) => {
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

export default ModelStatusBadge;
