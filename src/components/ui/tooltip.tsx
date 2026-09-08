"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "bg-foreground text-background z-50 max-w-xs rounded-md px-2.5 py-1.5 text-xs font-medium shadow-md",
          "data-[state=delayed-open]:animate-[mastery-pop-in_var(--duration-instant)_var(--ease-out)] data-[state=instant-open]:animate-[mastery-pop-in_var(--duration-instant)_var(--ease-out)]",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
