"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { AIInsightCard, ErrorState } from "@/components/mastery";
import { Skeleton } from "@/components/ui";
import { useIntelligence } from "../use-intelligence";

const DISMISSED_KEY = "mastery.intelligence.dismissed";

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

interface IntelligencePanelProps {
  /** `compact` trims the heading and caps the list — used on the dashboard. */
  variant?: "full" | "compact";
  limit?: number;
  className?: string;
}

/**
 * Level 2 surface: a small stack of structured `AIInsightCard`s built from real,
 * deterministic analysis (see `mastery-intelligence.ts`). Restrained by design —
 * it caps the list, supports per-viewer dismiss, and shows an explicit
 * "not enough data yet" state instead of a weak conclusion.
 */
export function IntelligencePanel({ variant = "full", limit, className }: IntelligencePanelProps) {
  const { status, error, reload, insights } = useIntelligence();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDismissed(readDismissed());
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissed((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      } catch {
        // per-viewer convenience only — safe to lose
      }
      return next;
    });
  }, []);

  const visible = insights.filter((insight) => !dismissed.includes(insight.id));
  const shown = typeof limit === "number" ? visible.slice(0, limit) : visible;

  return (
    <section aria-labelledby="intelligence-heading" className={className}>
      <h2
        id="intelligence-heading"
        className="text-eyebrow mb-3 flex items-center gap-1.5"
      >
        <Brain className="size-3.5" aria-hidden="true" />
        Mastery Intelligence
      </h2>

      {status === "loading" ? (
        <Skeleton className="h-40" />
      ) : status === "error" ? (
        <ErrorState
          title="Intelligence is temporarily unavailable"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : !hydrated ? (
        <Skeleton className="h-40" />
      ) : shown.length === 0 ? (
        <p className="text-muted border-border rounded-lg border border-dashed p-5 text-sm">
          Not enough activity data yet to identify a reliable pattern. Keep logging KPI entries
          and saving your Life Score — insights appear once there is enough history to compare.
        </p>
      ) : (
        <div className={variant === "compact" ? "space-y-3" : "space-y-4"}>
          {shown.map((insight) => (
            <AIInsightCard
              key={insight.id}
              title={insight.title}
              fact={insight.fact}
              interpretation={insight.interpretation}
              recommendation={insight.recommendation}
              signal={insight.signal}
              evidence={variant === "compact" ? undefined : insight.evidence}
              action={insight.action}
              onDismiss={() => dismiss(insight.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
