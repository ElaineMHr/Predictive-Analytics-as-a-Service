import { Fox } from "@/components/watermark/Fox";
import { TypewriterText } from "../app/Typewriter";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

const Loading = ({ className }: Props) => {
  const [reverse, setReverse] = useState(false);
  const handleReverse = useCallback(() => {
    setReverse((v) => !v);
  }, []);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-background flex items-center justify-center",
        className,
      )}
    >
      <div className="flex items-center">
        <Fox
          aria-hidden
          size="80%"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] m-auto"
          style={{ color: "hsl(var(--sidebar-foreground))" }}
          nodeFill="hsl(var(--sidebar-foreground))"
        />
      </div>
      <div className="relative z-10 h-full flex items-center justify-center flex-col select-none">
        <div className="font-mono text-4xl md:text-6xl text-muted-foreground tracking-tight">
          <TypewriterText
            text="< Loading... />"
            reverse={reverse}
            onDone={() => setTimeout(handleReverse, 3000)}
            keepCursor={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Loading;
