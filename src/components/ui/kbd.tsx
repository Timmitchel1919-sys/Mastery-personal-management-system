import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "border-border bg-surface text-muted inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[0.6875rem] font-medium",
        className,
      )}
      {...props}
    />
  );
}
