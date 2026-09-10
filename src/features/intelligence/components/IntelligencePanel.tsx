"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { AIInsightCard, ErrorState } from "@/components/mastery";
import { Button, Card, CardContent, Skeleton } from "@/components/ui";
import type { BrainModuleId } from "@/features/brain-hub";
import { ExecutionRecommendationCard, useExecutionRecommendations } from "@/features/adaptive-execution";
import { useAiPersonalInsight } from "../use-ai-personal-insight";
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
  moduleId?: BrainModuleId;
  limit?: number;
  className?: string;
}

/**
 * Level 2 surface: a small stack of structured `AIInsightCard`s built from real,
 * deterministic analysis (see `mastery-intelligence.ts`). Restrained by design —
 * it caps the list, supports per-viewer dismiss, and shows an explicit
 * "not enough data yet" state instead of a weak conclusion.
 */
export function IntelligencePanel({ variant = "full", moduleId, limit, className }: IntelligencePanelProps) {
  const { status, error, reload, insights, today, progress, attention, patterns, recommendations } =
    useIntelligence({ moduleId });
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
  const topAction = shown[0]?.actions[0];

  const aiInsight = useAiPersonalInsight({
    moduleId,
    insights: shown,
    attentionCount: attention.length,
    recommendationCount: recommendations.length,
  });
  const adaptiveExecution = useExecutionRecommendations();

  const sections = [
    { title: "Today", items: today.filter((item) => !dismissed.includes(item.id)) },
    { title: "Progress", items: progress.filter((item) => !dismissed.includes(item.id)) },
    { title: "Attention", items: attention.filter((item) => !dismissed.includes(item.id)) },
    { title: "Patterns", items: patterns.filter((item) => !dismissed.includes(item.id)) },
    {
      title: "Recommendations",
      items: recommendations.filter((item) => !dismissed.includes(item.id)),
    },
  ];

  return (
    <section aria-labelledby="intelligence-heading" className={className}>
      <h2 id="intelligence-heading" className="text-eyebrow mb-3 flex items-center gap-1.5">
        <Brain className="size-3.5" aria-hidden="true" />
        {moduleId ? "Module Intelligence" : "Mastery Intelligence"}
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
          Not enough data yet. Continue using MASTERY to build enough history for meaningful
          insights.
        </p>
      ) : (
        <div className={variant === "compact" ? "space-y-3" : "space-y-6"}>
          {variant === "full" ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-foreground text-sm font-semibold tracking-tight">MASTERY Insight</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!aiInsight.canGenerate || aiInsight.status === "loading"}
                    onClick={() => void aiInsight.generate()}
                  >
                    {aiInsight.status === "loading" ? "Generating insight..." : "Generate AI insight"}
                  </Button>
                </div>

                {aiInsight.status === "idle" ? (
                  <p className="text-muted text-sm">
                    Optional AI interpretation. Uses deterministic intelligence context only.
                  </p>
                ) : null}

                {aiInsight.status === "error" ? (
                  <p className="text-warning text-sm">
                    AI insight temporarily unavailable. Deterministic intelligence is still shown.
                  </p>
                ) : null}

                {aiInsight.status === "ready" && aiInsight.response ? (
                  <AIInsightCard
                    title={aiInsight.context?.title ?? "Your Mastery brief"}
                    fact={aiInsight.response.summary}
                    interpretation={aiInsight.response.interpretation}
                    recommendation={
                      aiInsight.response.recommendations[0] ??
                      "Continue using the deterministic recommendation while context grows."
                    }
                    signal="moderate"
                    evidence={aiInsight.response.facts.map((fact) => `${fact.label}: ${fact.value}`)}
                    action={topAction}
                    timestamp="AI interpretation over deterministic facts"
                  />
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {adaptiveExecution.status !== "loading" && adaptiveExecution.items.length > 0 ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-foreground text-sm font-semibold tracking-tight">
                    Adaptive execution
                  </h3>
                  <span className="text-muted text-xs">Approval required</span>
                </div>

                <div className="space-y-3">
                  {adaptiveExecution.items.map((item) => (
                    <ExecutionRecommendationCard
                      key={item.id}
                      recommendation={item}
                      onApprove={(draft) => adaptiveExecution.approve(item.id, draft)}
                      onDismiss={() => adaptiveExecution.dismiss(item.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {variant === "compact"
            ? shown.map((insight) => (
                <AIInsightCard
                  key={insight.id}
                  title={insight.title}
                  fact={insight.summary}
                  interpretation={insight.detail}
                  recommendation={insight.recommendation}
                  signal={insight.signal}
                  evidence={undefined}
                  action={insight.actions[0]}
                  onDismiss={() => dismiss(insight.id)}
                />
              ))
            : sections.map((section) =>
                section.items.length === 0 ? null : (
                  <section
                    key={section.title}
                    className="space-y-3"
                    aria-labelledby={`intel-${section.title.toLowerCase()}`}
                  >
                    <h3
                      id={`intel-${section.title.toLowerCase()}`}
                      className="text-foreground text-sm font-semibold tracking-tight"
                    >
                      {section.title}
                    </h3>
                    <div className="space-y-4">
                      {section.items.map((insight) => (
                        <AIInsightCard
                          key={insight.id}
                          title={insight.title}
                          fact={insight.summary}
                          interpretation={insight.detail}
                          recommendation={insight.recommendation}
                          signal={insight.signal}
                          evidence={insight.evidence}
                          action={insight.actions[0]}
                          timestamp={`${insight.severity} priority · ${insight.confidence} confidence`}
                          onDismiss={() => dismiss(insight.id)}
                        />
                      ))}
                    </div>
                  </section>
                ),
              )}
        </div>
      )}
    </section>
  );
}
