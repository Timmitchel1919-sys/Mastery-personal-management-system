"use client";

import type { ReactNode } from "react";
import { Target } from "lucide-react";
import { Button, GlassCard } from "@/components/ui";

interface NextBestActionCardProps {
  /** What to do next, e.g. the task title. */
  title: string;
  /** Plain reasons it rose to the top — shown as a list, never a hidden score. */
  why: string[];
  /**
   * Optional personalization line ("WHY THIS TIME") — pass ONLY when it is
   * backed by the user's real recorded behaviour, e.g. an observed focus period.
   */
  whyThisTime?: string;
  /** Primary action — begin the work now. Omit if there's nothing real to do. */
  onStart?: () => void;
  startLabel?: string;
  /** Secondary — schedule / plan it instead. */
  onSchedule?: () => void;
  scheduleLabel?: string;
  onDismiss?: () => void;
  /** Optional slot below the buttons, e.g. an <ActionPreviewCard/>. */
  children?: ReactNode;
  className?: string;
}

/**
 * The single highest-value next step, with its rationale. Every button maps to
 * real application functionality supplied by the caller — no button is
 * decorative, and dismissing it never changes any data.
 */
export function NextBestActionCard({
  title,
  why,
  whyThisTime,
  onStart,
  startLabel = "Start",
  onSchedule,
  scheduleLabel = "Schedule",
  onDismiss,
  children,
  className,
}: NextBestActionCardProps) {
  return (
    <GlassCard variant="gold-accent" className={className}>
      <div className="space-y-3">
        <p className="text-eyebrow flex items-center gap-1.5">
          <Target className="size-3.5" aria-hidden="true" />
          Next best action
        </p>

        <p className="text-foreground text-base font-semibold tracking-tight">{title}</p>

        {why.length > 0 ? (
          <div>
            <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
              Why now
            </p>
            <ul className="text-muted mt-0.5 space-y-0.5 text-sm">
              {why.map((reason, index) => (
                <li key={index} className="flex gap-2">
                  <span aria-hidden="true" className="text-subtle">
                    •
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {whyThisTime ? (
          <div>
            <p className="text-subtle text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
              Why this time
            </p>
            <p className="text-muted mt-0.5 text-sm">{whyThisTime}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          {onStart ? <Button onClick={onStart}>{startLabel}</Button> : null}
          {onSchedule ? (
            <Button variant="secondary" onClick={onSchedule}>
              {scheduleLabel}
            </Button>
          ) : null}
          {onDismiss ? (
            <Button variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          ) : null}
        </div>

        {children}
      </div>
    </GlassCard>
  );
}
