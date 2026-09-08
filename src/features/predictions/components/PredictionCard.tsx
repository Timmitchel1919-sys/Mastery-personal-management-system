"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, TrendingUp, X } from "lucide-react";
import { Button, GlassCard, IconButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  CONFIDENCE_LABEL,
  URGENCY_LABEL,
  type PredictiveSignal,
} from "../prediction-model";

const URGENCY_TONE: Record<PredictiveSignal["urgency"], string> = {
  critical: "text-danger",
  important: "text-warning",
  opportunity: "text-primary",
  information: "text-muted",
};

interface PredictionCardProps {
  signal: PredictiveSignal;
  /** Remove this signal — used for "Not helpful" and "Mastery got this wrong". */
  onDismiss: (id: string) => void;
  className?: string;
}

/**
 * One predictive signal, with the categories kept visibly distinct: the
 * PREDICTION (hedged, prominent), the evidence FACTS behind it (under "Why?"),
 * and an optional RECOMMENDATION. Carries a qualitative confidence label — never
 * a fabricated percentage — and lightweight feedback.
 */
export function PredictionCard({ signal, onDismiss, className }: PredictionCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const [feedback, setFeedback] = useState<"none" | "helpful">("none");

  return (
    <GlassCard variant="gold-accent" className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-eyebrow flex items-center gap-1.5">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          Prediction
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("text-xs font-medium", URGENCY_TONE[signal.urgency])}>
            {URGENCY_LABEL[signal.urgency]}
          </span>
          <span className="text-subtle text-xs">· {CONFIDENCE_LABEL[signal.confidence]}</span>
          <IconButton
            size="sm"
            aria-label="Dismiss prediction"
            icon={<X />}
            onClick={() => onDismiss(signal.id)}
          />
        </div>
      </div>

      <p className="text-foreground text-base font-semibold tracking-tight text-balance">
        {signal.prediction}
      </p>

      {signal.timeWindow ? (
        <p className="text-subtle text-xs">
          <span className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Time window{" "}
          </span>
          {signal.timeWindow}
        </p>
      ) : null}

      {signal.recommendation ? (
        <p className="text-muted text-sm">
          <span className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
            Recommendation{" "}
          </span>
          {signal.recommendation}
        </p>
      ) : null}

      <div>
        <button
          type="button"
          aria-expanded={showWhy}
          onClick={() => setShowWhy((open) => !open)}
          className="text-primary inline-flex items-center gap-1 text-xs font-medium outline-none hover:underline focus-visible:underline"
        >
          Why?
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-[var(--duration-fast)]",
              showWhy && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        {showWhy ? (
          <ul className="mastery-expand text-muted mt-2 list-disc space-y-0.5 pl-5 text-xs">
            {signal.evidence.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
            <li className="text-subtle list-none pt-1">
              A prediction from your recorded data — not a certainty.
            </li>
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-2">
          {feedback === "none" ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setFeedback("helpful")}>
                Helpful
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDismiss(signal.id)}>
                Not helpful
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDismiss(signal.id)}>
                Mastery got this wrong
              </Button>
            </>
          ) : (
            <span className="text-subtle text-xs">Thanks — noted for this device.</span>
          )}
        </div>
        {signal.action ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={signal.action.href}>
              {signal.action.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
