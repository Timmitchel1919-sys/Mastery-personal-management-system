"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Sparkles, X } from "lucide-react";
import { Button, GlassCard, IconButton } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Qualitative strength — never a fabricated percentage. */
export type InsightSignal = "strong" | "moderate" | "limited";

const SIGNAL_META: Record<InsightSignal, { label: string; className: string }> = {
  strong: { label: "Strong signal", className: "text-success" },
  moderate: { label: "Moderate signal", className: "text-primary" },
  limited: { label: "Limited data", className: "text-muted" },
};

export interface AIInsightCardProps {
  title: string;
  /** FACT — exactly what the data shows. */
  fact: string;
  /** INTERPRETATION — why it might matter. Kept separate from fact on purpose. */
  interpretation: string;
  /** RECOMMENDATION — what the user could consider. Never imperative. */
  recommendation: string;
  signal: InsightSignal;
  /** Concise supporting evidence — the numbers behind the read, not hidden reasoning. */
  evidence?: string[];
  /** A navigational CTA only — the user acts, the app never auto-applies. */
  action?: { label: string; href: string };
  timestamp?: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * The canonical Mastery intelligence card. Presents an insight as three clearly
 * separated parts — FACT, INTERPRETATION, RECOMMENDATION — with a qualitative
 * signal strength (no invented confidence %), optional evidence disclosure, and
 * an optional navigational action. It never mutates data; consequential changes
 * stay behind an explicit user step (human-in-the-loop).
 */
export function AIInsightCard({
  title,
  fact,
  interpretation,
  recommendation,
  signal,
  evidence,
  action,
  timestamp,
  onDismiss,
  className,
}: AIInsightCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const meta = SIGNAL_META[signal];

  return (
    <GlassCard variant="gold-accent" className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-eyebrow flex items-center gap-1.5">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Mastery Intelligence
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <span className={cn("text-xs font-medium", meta.className)}>{meta.label}</span>
          {onDismiss ? (
            <IconButton size="sm" aria-label="Dismiss insight" icon={<X />} onClick={onDismiss} />
          ) : null}
        </div>
      </div>

      <p className="text-foreground text-base font-semibold tracking-tight">{title}</p>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Fact
          </dt>
          <dd className="text-foreground">{fact}</dd>
        </div>
        <div>
          <dt className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Interpretation
          </dt>
          <dd className="text-muted">{interpretation}</dd>
        </div>
        <div>
          <dt className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Recommendation
          </dt>
          <dd className="text-muted">{recommendation}</dd>
        </div>
      </dl>

      {evidence && evidence.length > 0 ? (
        <div>
          <button
            type="button"
            aria-expanded={showEvidence}
            onClick={() => setShowEvidence((open) => !open)}
            className="text-primary inline-flex items-center gap-1 text-xs font-medium outline-none hover:underline focus-visible:underline"
          >
            Why this recommendation?
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-[var(--duration-fast)]",
                showEvidence && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
          {showEvidence ? (
            <ul className="text-muted mastery-expand mt-2 list-disc space-y-0.5 pl-5 text-xs">
              {evidence.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-subtle text-xs">
          Based on your Mastery activity{timestamp ? ` · ${timestamp}` : ""}
        </p>
        {action ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={action.href}>
              {action.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
