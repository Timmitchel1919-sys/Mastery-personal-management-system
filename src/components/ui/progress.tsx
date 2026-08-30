import { cn } from "@/lib/utils";

export interface ProgressProps {
  /** Current value, 0..max. */
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

/** Non-interactive progress bar. */
export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("bg-surface h-2 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className="bg-primary h-full rounded-full transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
