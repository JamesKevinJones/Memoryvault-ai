"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/ui/input";

export type SelectItem = { value: string; label: string };

type SelectProps = {
  items: SelectItem[];
  value?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

export function Select({
  items,
  value,
  placeholder = "Select…",
  onValueChange,
  className,
  ...aria
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      items={items}
      value={value ?? null}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange(next);
      }}
    >
      <SelectPrimitive.Trigger
        className={cn(fieldClass, "h-9 flex items-center justify-between gap-2 text-left", className)}
        {...aria}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={6} className="z-50">
          <SelectPrimitive.Popup className="max-h-64 origin-[var(--transform-origin)] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {items.map((item) => (
              <SelectPrimitive.Item
                key={item.value}
                value={item.value}
                className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition-colors duration-100 data-[highlighted]:bg-muted"
              >
                <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check className="size-3.5 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
