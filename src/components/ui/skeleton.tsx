import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-surface animate-pulse rounded-md motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
