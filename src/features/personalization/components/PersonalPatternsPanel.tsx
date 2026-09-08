"use client";

import { Skeleton } from "@/components/ui";
import { usePersonalization } from "../use-personalization";
import { PersonalPatternCard } from "./PersonalPatternCard";

interface PersonalPatternsPanelProps {
  /** Cap the number of cards — the dashboard shows at most two. */
  limit?: number;
  className?: string;
}

/**
 * Dashboard surface for observed personal patterns. Self-gating: renders nothing
 * when the user has turned personalized recommendations off. Shows an explicit
 * "not enough data" note rather than a weak pattern, and every card can be
 * rejected.
 */
export function PersonalPatternsPanel({ limit = 2, className }: PersonalPatternsPanelProps) {
  const { status, settings, patterns, hasAnyData, rejectPattern } = usePersonalization();

  if (!settings.personalizedRecommendations) return null;

  const shown = patterns.slice(0, limit);

  return (
    <section aria-labelledby="personal-patterns-heading" className={className}>
      <h2 id="personal-patterns-heading" className="text-eyebrow mb-3">
        Your patterns
      </h2>

      {status === "loading" ? (
        <Skeleton className="h-40" />
      ) : shown.length === 0 ? (
        <p className="text-muted border-border rounded-lg border border-dashed p-5 text-sm">
          {hasAnyData
            ? "No meaningful behavioral patterns detected yet. Mastery needs more recorded activity before it can identify a reliable personal pattern."
            : "Log some activity — KPI entries, Life Scores, or applied suggestions — and Mastery will start noticing what works for you."}
        </p>
      ) : (
        <div className="space-y-4">
          {shown.map((pattern) => (
            <PersonalPatternCard key={pattern.id} pattern={pattern} onReject={rejectPattern} />
          ))}
        </div>
      )}
    </section>
  );
}
