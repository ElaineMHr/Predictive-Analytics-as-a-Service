import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

const ThemeSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      `${checked ? "bg-primary" : "bg-input"}`,
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "group pointer-events-none relative block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
        `${checked ? "translate-x-4" : "translate-x-0"}`
      )}
    >
      {/* Sun when unchecked */}
      <Moon
        className={`absolute inset-0 m-auto h-3 w-3 text-foreground ${
          checked ? "hidden" : ""
        }`}
      />

      {/* Moon when checked */}
      <Sun
        className={`absolute inset-0 m-auto h-3 w-3 text-foreground ${
          checked ? "block" : "hidden"
        }`}
      />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
ThemeSwitch.displayName = SwitchPrimitives.Root.displayName;

export { ThemeSwitch };
