import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Lightbulb } from "lucide-react";
import { GlassCard } from "@/components/mastery";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { KeyInsight } from "../analytics-insights";

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight } as const;

/**
 * The prominent "what changed and does it matter" card. Copy and numbers come
 * straight from `deriveKeyInsight` — when there's no real movement it shows
 * "No clear pattern yet." rather than inventing a conclusion.
 */
export function InsightCard({ insight }: { insight: KeyInsight }) {
  const TrendIcon = TREND_ICON[insight.direction];
  const toneClass =
    insight.positive === null
      ? "text-muted"
      : insight.positive
        ? "text-success"
        : "text-danger";

  return (
    <GlassCard variant="gold-accent" className="space-y-3">
      <p className="text-eyebrow flex items-center gap-1.5">
        <Lightbulb className="size-3.5" aria-hidden="true" />
        Personal insight
      </p>

      <p className="text-foreground text-lg font-semibold tracking-tight text-balance">
        {insight.headline}
      </p>

      {insight.changePct !== null ? (
        <p className={cn("flex items-center gap-1 text-sm font-medium", toneClass)}>
          <TrendIcon className="size-4" aria-hidden="true" />
          <span>
            {insight.metricLabel} {insight.direction === "up" ? "+" : ""}
            {insight.changePct}% vs previous period
          </span>
        </p>
      ) : null}

      {insight.detail ? (
        <p className="text-muted text-sm leading-relaxed">{insight.detail}</p>
      ) : null}

      {insight.positive === false ? (
        <Button asChild size="sm" variant="secondary">
          <Link href="/focus/time-blocking">
            Schedule a protected focus block
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
    </GlassCard>
  );
}
