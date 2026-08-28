"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export interface SegmentedControlProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  loop?: boolean;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
}

/**
 * A single-select segmented control built on Radix ToggleGroup (`type="single"`).
 * Good for compact mode switches such as the theme toggle.
 */
export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
  function SegmentedControl({ className, ...props }, ref) {
    return (
      <ToggleGroupPrimitive.Root
        ref={ref}
        type="single"
        className={cn("bg-surface inline-flex items-center gap-1 rounded-lg p-1", className)}
        {...props}
      />
    );
  },
);

export const SegmentedControlItem = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(function SegmentedControlItem({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        "text-muted inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium outline-none transition-colors",
        "hover:text-foreground focus-visible:ring-ring focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=on]:bg-surface-raised data-[state=on]:text-foreground data-[state=on]:shadow-sm",
        "[&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
});
