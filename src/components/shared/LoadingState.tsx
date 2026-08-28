import { Spinner } from "@/components/ui/spinner";
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
      <Spinner className="text-muted size-6" />
      <span className="text-muted text-sm">{label}</span>
    </div>
  );
}
