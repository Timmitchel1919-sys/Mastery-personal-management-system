import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  /** Short metric name — rendered as an uppercase label. */
  label: string;
  /** The metric itself. Use "—" for "no data yet"; never a fabricated number. */
  value: ReactNode;
  /** Caption under the value — units, timeframe, or a "not tracked yet" note. */
  hint?: string;
  /** Leading icon (already sized ~16px). */
  icon?: ReactNode;
  /** Period-over-period change, e.g. "+12%". Pair with `trend` for arrow + colour. */
  change?: string;
  trend?: "up" | "down" | "flat";
  /** When an upward trend is the good outcome (default). Set false to flip the
   * colour semantics — e.g. a rising "overdue" count. Ignored for `trend="flat"`. */
  trendPositiveIsGood?: boolean;
  /** Trailing slot — typically a <StatusBadge />. */
  status?: ReactNode;
  /** "card" (default) sits on its own surface; "plain" is a bare label/value pair
   * for use inside an existing card. */
  variant?: "card" | "plain";
  className?: string;
}

const TREND_ICON = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
} as const;

/**
 * Canonical Mastery metric. One implementation for every "label + big number"
 * tile across the dashboard, execution tracker, weekly summaries, and reports.
 * Change indicators carry an arrow and a sign, never colour alone.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon,
  change,
  trend,
  trendPositiveIsGood = true,
  status,
  variant = "card",
  className,
}: MetricCardProps) {
  const TrendIcon = trend ? TREND_ICON[trend] : null;
  const good = trend === "flat" ? null : trend === "up" ? trendPositiveIsGood : !trendPositiveIsGood;
  const trendColor =
    good === null ? "text-muted" : good ? "text-success" : "text-danger";

  return (
    <div
      className={cn(
        variant === "card" && "mastery-card p-4",
        "flex flex-col gap-1",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted text-xs font-medium tracking-wide uppercase">{label}</p>
        {icon ? (
          <span aria-hidden="true" className="text-subtle shrink-0">
            {icon}
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "text-foreground font-semibold tabular-nums",
          variant === "plain" ? "text-lg" : "text-2xl",
        )}
      >
        {value}
      </p>

      {change ? (
        <p className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
          {TrendIcon ? <TrendIcon className="size-3.5" aria-hidden="true" /> : null}
          <span>{change}</span>
        </p>
      ) : null}

      {hint ? <p className="text-subtle text-xs">{hint}</p> : null}

      {status ? <div className="mt-1">{status}</div> : null}
    </div>
  );
}
