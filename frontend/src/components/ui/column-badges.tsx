import { cn } from "@/lib/utils";
import { Badge } from "./badge";

type Item = string | [string, string];

type Props = {
  items: Item[];
  className?: string;
  empty?: string;
};

const ColumnBadges = ({ items, className, empty }: Props) => {
  if (items.length === 0) {
    return (
      <div className="mt-auto text-sm text-muted-foreground">
        {empty ?? "None"}
      </div>
    );
  }
  const normalizedItems: [string, string][] = items.map((item) =>
    typeof item === "string" ? [item, item] : item,
  );

  return (
    <div
      className={cn(
        "mt-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 overflow-hidden",
        className,
      )}
    >
      {normalizedItems.map(([id, label]) => (
        <Badge
          className="flex items-center justify-center w-full min-w-0"
          key={id}
          variant={"secondary"}
        >
          <span className="truncate">{label}</span>
        </Badge>
      ))}
    </div>
  );
};

export default ColumnBadges;
