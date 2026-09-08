import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ModuleCardProps {
  /** Module name — PLAN, GOALS, FOCUS, ACT, GROW, ANALYTICS. */
  title: string;
  description: string;
  icon: LucideIcon;
  /** When set the whole card is a link; otherwise it renders as a static article. */
  href?: string;
  /** Icon-chip treatment. "gold" for the primary trio, "neutral" otherwise. */
  accent?: "gold" | "neutral";
  /** The current module — draws the gold ring and sets aria-current. */
  active?: boolean;
  /** Optional one-line metric, e.g. "3 / 5 priorities". Real data only. */
  metric?: ReactNode;
  /** Optional completion 0–100 — renders a mini progress bar with a text value. */
  progress?: number;
  /** Optional trailing status — typically a <StatusBadge />. */
  status?: ReactNode;
  className?: string;
}

/**
 * The canonical Mastery module card. One implementation shared by the dashboard
 * constellation and the landing page. Depth (layered shadow, inset highlight,
 * hover/focus lift) is CSS-only via `.mastery-module-card` and honours
 * `prefers-reduced-motion`.
 */
export function ModuleCard({
  title,
  description,
  icon: Icon,
  href,
  accent = "neutral",
  active = false,
  metric,
  progress,
  status,
  className,
}: ModuleCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-xl border transition-colors",
            accent === "gold"
              ? "border-border-gold bg-gold-subtle text-accent"
              : "border-border bg-surface text-muted group-hover:text-accent",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {href ? (
          <ArrowUpRight
            className="text-subtle size-4 transition-colors group-hover:text-accent"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <h3 className="text-foreground mt-3 text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-muted mt-0.5 text-sm leading-snug">{description}</p>

      {metric ? <p className="text-foreground mt-3 text-sm font-medium">{metric}</p> : null}

      {typeof progress === "number" ? (
        <div className="mt-3 space-y-1">
          <Progress value={progress} label={`${title} progress`} className="h-1.5" />
          <p className="text-subtle text-xs tabular-nums">{Math.round(progress)}%</p>
        </div>
      ) : null}

      {status ? <div className="mt-3">{status}</div> : null}
    </>
  );

  const shared = cn(
    "mastery-module-card group p-5",
    active && "border-border-gold",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`${title} — ${description}`}
        aria-current={active ? "page" : undefined}
        data-active={active || undefined}
        className={cn(shared, "focus-visible:ring-ring outline-none focus-visible:ring-2")}
      >
        {body}
      </Link>
    );
  }

  return (
    <article className={shared} data-active={active || undefined}>
      {body}
    </article>
  );
}
