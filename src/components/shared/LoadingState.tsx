import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  /** Accessible status text. Callers pass translated copy (i18n arrives in Layer 18). */
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Loading…", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3 p-8 text-center", className)}
    >
      <span
        aria-hidden="true"
        className="border-border border-t-primary size-6 animate-spin rounded-full border-2"
      />
      <span className="text-muted text-sm">{label}</span>
    </div>
  );
}
