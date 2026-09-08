"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Button, GlassCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SUFFICIENCY_LABEL, type PersonalPattern } from "../personal-signals";

interface PersonalPatternCardProps {
  pattern: PersonalPattern;
  /** Called when the user says the pattern is not accurate — it should stop showing. */
  onReject: (id: string) => void;
  className?: string;
}

/**
 * One observed behavioural pattern, with the three categories kept visibly
 * distinct: OBSERVED (raw data), INTERPRETATION (hedged), RECOMMENDATION
 * (optional). Carries a "Why am I seeing this?" disclosure and lets the user
 * reject the pattern outright.
 */
export function PersonalPatternCard({ pattern, onReject, className }: PersonalPatternCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const [handled, setHandled] = useState<"none" | "confirmed">("none");

  const TrendIcon =
    pattern.trend === "improving"
      ? TrendingUp
      : pattern.trend === "declining"
        ? TrendingDown
        : null;

  return (
    <GlassCard variant="gold-accent" className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-eyebrow flex items-center gap-1.5">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Your pattern
        </p>
        <span className="text-subtle shrink-0 text-xs font-medium">
          {SUFFICIENCY_LABEL[pattern.sufficiency]}
        </span>
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Observed
          </dt>
          <dd className="text-foreground flex items-start gap-1.5">
            {TrendIcon ? (
              <TrendIcon className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            ) : null}
            <span>{pattern.observed}</span>
          </dd>
        </div>
        <div>
          <dt className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Interpretation
          </dt>
          <dd className="text-muted">{pattern.interpretation}</dd>
        </div>
        <div>
          <dt className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Recommendation
          </dt>
          <dd className="text-muted">{pattern.recommendation}</dd>
        </div>
      </dl>

      <div>
        <button
          type="button"
          aria-expanded={showWhy}
          onClick={() => setShowWhy((open) => !open)}
          className="text-primary inline-flex items-center gap-1 text-xs font-medium outline-none hover:underline focus-visible:underline"
        >
          Why am I seeing this?
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-[var(--duration-fast)]",
              showWhy && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        {showWhy ? (
          <div className="mastery-expand text-muted mt-2 space-y-2 text-xs">
            <p>
              Mastery derived this from your recorded activity — {pattern.source}. It is a pattern in
              your data, not a conclusion about you.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowWhy(false);
                  setHandled("confirmed");
                }}
              >
                Got it
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onReject(pattern.id)}>
                Don&apos;t use this pattern
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex gap-2">
          {handled === "none" ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setHandled("confirmed")}>
                That&apos;s accurate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onReject(pattern.id)}>
                Not accurate
              </Button>
            </>
          ) : (
            <span className="text-subtle text-xs">Thanks — noted for this device.</span>
          )}
        </div>
        {pattern.action ? (
          <Button asChild size="sm" variant="ghost">
            <Link href={pattern.action.href}>{pattern.action.label}</Link>
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
