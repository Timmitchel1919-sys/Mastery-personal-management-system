"use client";

import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-2 p-8 text-center", className)}
    >
      <h2 className="text-danger text-base font-medium">{title}</h2>
      {description ? <p className="text-muted max-w-sm text-sm">{description}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="border-border hover:bg-surface mt-3 rounded-md border px-3 py-1.5 text-sm"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
