import { Fox } from "@/components/watermark/Fox";
import { cn } from "@/lib/utils";

type Props = {
  name?: string;
  bypass?: string;
  className?: string;
};

const NotFound = ({ name, bypass, className }: Props) => {
  const text = bypass ?? `${name ?? "File"} was not found.`;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-background flex items-center justify-center",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Fox
          aria-hidden
          size="80%"
          className="opacity-[0.12]"
          style={{ color: "hsl(var(--sidebar-foreground))" }}
          nodeFill="hsl(var(--sidebar-foreground))"
        />
      </div>
      <p className="relative z-10 text-xl font-semibold">{text}</p>
    </div>
  );
};

export default NotFound;
