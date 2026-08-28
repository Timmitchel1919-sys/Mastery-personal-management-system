import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Visually hides content while keeping it available to assistive technology. */
export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("sr-only", className)} {...props} />;
}
