import { Check, ChevronDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
};

// helper function for toggling Selections on and off -> add/remove from field
function toggle(current: string[], v: string) {
  return current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
}

const Chip = ({ text, onRemove }: { text: string; onRemove: () => void }) => {
  return (
    <Badge
      variant="secondary"
      className="h-6 max-w-full gap-1 rounded-md px-2 pr-1 text-xs"
    >
      <span className="truncate">{text}</span>
      <button
        className="ml-1 inline-flex items-center justify-center rounded-sm opacity-70 hover:opacity-100"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
};

const Combobox = ({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  className,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          className={cn(
            "min-h-8 w-full rounded-md border px-2 py-0.5",
            "border-input bg-background text-foreground",
            "flex items-center gap-2 text-left",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className
          )}
          onClick={() => setOpen(true)}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground text-sm px-1">
                {placeholder}
              </span>
            ) : (
              value.map((v) => (
                <Chip
                  key={v}
                  text={v}
                  onRemove={() => onChange(value.filter((x) => x !== v))}
                />
              ))
            )}
          </div>

          {value.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange([]);
              }}
              title="Clear"
            >
              <X className="h-4 w-4 opacity-70" />
            </Button>
          )}

          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
            className="h-7"
          />

          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty>No results.</CommandEmpty>

            <CommandGroup>
              {options.map((option) => {
                const selected = value.includes(option);

                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => onChange(toggle(value, option))}
                    className="flex items-center pr-2"
                  >
                    <span className="truncate">{option}</span>
                    {selected && (
                      <Check className="ml-auto h-4 w-4 opacity-80" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;
