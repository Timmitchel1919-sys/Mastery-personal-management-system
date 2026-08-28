import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "default" | "wide" | "full";
}

const SIZE: Record<NonNullable<PageContainerProps["size"]>, string> = {
  default: "max-w-3xl",
  wide: "max-w-6xl",
  full: "max-w-none",
};

/** Consistent horizontal gutter + max width for page content. */
export function PageContainer({ size = "default", className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 py-6 sm:px-6 sm:py-8", SIZE[size], className)}
      {...props}
    />
  );
}
