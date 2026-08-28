import { cn } from "@/lib/utils";

export interface SpinnerProps {
  className?: string;
  /** When set, the spinner is announced to assistive tech with this label. */
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <svg
      className={cn("size-4 shrink-0 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
