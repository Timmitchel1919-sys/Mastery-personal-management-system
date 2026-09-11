"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Sparkles, TrendingUp } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  FORECAST_KIND_LABEL,
  FORECAST_TYPE_LABEL,
  HORIZON_LABEL,
  type Forecast,
  type ForecastImpact,
} from "../foresight-model";
import { useForesight } from "../use-foresight";

const IMPACT_STYLE: Record<ForecastImpact, string> = {
  critical: "border-danger/40 text-danger",
  high: "border-warning/40 text-warning",
  medium: "border-primary/30 text-primary",
  low: "border-border text-muted",
};

const KIND_STYLE: Record<Forecast["kind"], string> = {
  OBSERVED_FACT: "text-foreground",
  PREDICTION: "text-primary",
  PROJECTION: "text-warning",
  RECOMMENDATION: "text-success",
};

function Panel({
  id,
  title,
  icon,
  description,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mastery-panel space-y-4 rounded-2xl p-5">
      <div className="space-y-1">
        <h2 id={`${id}-heading`} className="text-eyebrow flex items-center gap-1.5">
          {icon}
          {title}
        </h2>
        {description ? <p className="text-subtle text-xs">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ForecastCard({ forecast }: { forecast: Forecast }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className={cn("rounded-xl border p-4", IMPACT_STYLE[forecast.impact])}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn("text-[0.625rem] font-semibold tracking-[0.08em] uppercase", KIND_STYLE[forecast.kind])}>
          {FORECAST_KIND_LABEL[forecast.kind]}
        </span>
        <span className="text-subtle text-[0.625rem] tracking-[0.08em] uppercase">
          {FORECAST_TYPE_LABEL[forecast.type]} · {HORIZON_LABEL[forecast.horizon]}
        </span>
      </div>
      <p className="text-foreground mt-1.5 text-sm">{forecast.statement}</p>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="text-primary mt-1.5 text-xs font-medium hover:underline"
      >
        {expanded ? "Hide details" : "View details"}
      </button>
      {expanded ? (
        <div className="mt-2 space-y-2 text-sm">
          {forecast.evidence.length > 0 ? (
            <div>
              <p className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">Based on</p>
              <ul className="text-muted list-disc space-y-0.5 pl-4 text-xs">
                {forecast.evidence.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {forecast.assumptions.length > 0 ? (
            <p className="text-subtle text-xs">Assumes: {forecast.assumptions.join(" ")}</p>
          ) : null}
          <p className="text-subtle text-xs">Confidence: {forecast.confidence}</p>
          {forecast.recommendation ? (
            <p className="text-success text-xs">
              <span className="font-semibold uppercase tracking-[0.08em]">Recommended: </span>
              {forecast.recommendation}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" variant="ghost">
              <Link href="/simulation">Simulate</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/strategy">Review</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function ForesightView() {
  const { status, activeForecasts, warnings, timeline, calibration, reload } = useForesight();

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Predictions"
        description="What is likely to happen, when, and why — never presented as a guaranteed outcome. You decide what to do about it."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button size="sm" variant="ghost" onClick={reload}>
            Refresh
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : activeForecasts.length === 0 ? (
        <EmptyState
          icon={<TrendingUp aria-hidden="true" />}
          title="Not enough signal to forecast yet"
          description="Add goals, plans and tasks with dates, and MASTERY can start forecasting trajectory, capacity, and deadline risk."
        />
      ) : (
        <>
          <Panel
            id="warnings"
            title={`Early warnings (${warnings.length})`}
            icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}
            description="Only meaningful impact and confidence — not every forecast becomes a warning."
          >
            {warnings.length === 0 ? (
              <p className="text-muted text-sm">Nothing needs early attention right now.</p>
            ) : (
              <ul className="space-y-2">
                {warnings.map((warning) => (
                  <li key={warning.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground">{warning.statement}</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={warning.action.href}>{warning.action.label}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            id="timeline"
            title="Future timeline"
            icon={<Clock className="size-3.5" aria-hidden="true" />}
            description="ACTUAL dates are confirmed; PREDICTED/PROJECTED entries are forecasts — kept visually separate."
          >
            {(["today", "next-7-days", "next-30-days", "next-90-days", "long-term"] as const).map((bucket) => {
              const entries = timeline.filter((entry) => entry.bucket === bucket);
              if (entries.length === 0) return null;
              return (
                <div key={bucket} className="border-border border-t pt-2 first:border-t-0 first:pt-0">
                  <p className="text-subtle text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
                    {HORIZON_LABEL[bucket]}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {entries.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-2 text-sm">
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-[0.08em] uppercase",
                            entry.kind === "ACTUAL" ? "bg-surface text-foreground" : "bg-gold-subtle text-accent",
                          )}
                        >
                          {entry.kind}
                        </span>
                        <span className="text-muted min-w-0 truncate">{entry.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </Panel>

          <Panel id="forecasts" title={`Forecasts (${activeForecasts.length})`} icon={<TrendingUp className="size-3.5" aria-hidden="true" />}>
            <ul className="space-y-3">
              {activeForecasts.map((forecast) => (
                <ForecastCard key={forecast.id} forecast={forecast} />
              ))}
            </ul>
          </Panel>

          <Panel
            id="calibration"
            title="Calibration"
            icon={<Sparkles className="size-3.5" aria-hidden="true" />}
            description="How MASTERY's forecasts have held up, based only on outcomes you've confirmed."
          >
            {calibration.summary.evaluated === 0 ? (
              <p className="text-muted text-sm">No confirmed outcomes yet — MASTERY does not assume accuracy.</p>
            ) : (
              <p className="text-foreground text-sm">
                {Math.round((calibration.summary.accuracyRate ?? 0) * 100)}% accurate across{" "}
                {calibration.summary.evaluated} confirmed forecast(s) ({calibration.summary.correct} correct,{" "}
                {calibration.summary.partiallyCorrect} partially correct, {calibration.summary.incorrect} incorrect).
              </p>
            )}
          </Panel>
        </>
      )}
    </PageContainer>
  );
}
