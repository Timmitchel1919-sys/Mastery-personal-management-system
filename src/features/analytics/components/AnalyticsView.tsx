"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Gauge } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState, MetricCard } from "@/components/mastery";
import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import { ANALYTICS_PERIODS, type AnalyticsPeriod, type PeriodComparison } from "../analytics-insights";
import { useAnalytics } from "../use-analytics";
import { InsightCard } from "./InsightCard";
import { TrendChart } from "./TrendChart";

const LIFE_SCORE_KEY = "__life-score__";

function changeLabel(comparison: PeriodComparison): string | undefined {
  if (comparison.changePct === null) return undefined;
  return `${comparison.changePct > 0 ? "+" : ""}${comparison.changePct}%`;
}

function SignalList({
  title,
  icon,
  tone,
  signals,
}: {
  title: string;
  icon: ReactNode;
  tone: "warning" | "success";
  signals: { id: string; label: string; detail: string; href?: string }[];
}) {
  if (signals.length === 0) return null;
  return (
    <section aria-labelledby={`sig-${tone}`} className="space-y-3">
      <h2 id={`sig-${tone}`} className="text-eyebrow flex items-center gap-1.5">
        <span className={tone === "warning" ? "text-warning" : "text-success"} aria-hidden="true">
          {icon}
        </span>
        {title}
      </h2>
      <ul className="space-y-2">
        {signals.map((signal) => (
          <li key={signal.id}>
            <Card>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">{signal.label}</p>
                  <p className="text-muted mt-0.5 text-sm">{signal.detail}</p>
                </div>
                {signal.href ? (
                  <Link
                    href={signal.href}
                    className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                  >
                    View
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

const DETAIL_LINKS = [
  { href: "/analytics/kpis", label: "KPIs", description: "Every measure and its entries." },
  { href: "/analytics/life-score", label: "Life Score", description: "The score and its factors." },
  { href: "/analytics/trends", label: "Trends", description: "Single-metric time series." },
  { href: "/analytics/reports", label: "Reports", description: "Exportable summaries." },
];

export function AnalyticsView() {
  const analytics = useAnalytics();
  const [selectedSeries, setSelectedSeries] = useState(LIFE_SCORE_KEY);

  const selectedMetric =
    selectedSeries === LIFE_SCORE_KEY
      ? null
      : analytics.metrics.find((metric) => metric.id === selectedSeries) ?? null;

  const chartPoints =
    selectedSeries === LIFE_SCORE_KEY
      ? analytics.lifeScoreSeries
      : (analytics.kpis.entriesByKpi.get(selectedSeries) ?? []).map((entry) => ({
          date: entry.date,
          value: entry.value,
        }));
  const chartLabel = selectedMetric?.label ?? "Life Score";
  const chartUnit = selectedMetric?.unit ?? "";
  const chartComparison = selectedMetric?.comparison ?? analytics.lifeScoreComparison;

  return (
    <PageContainer size="wide" className="space-y-8">
      <PageHeader
        title="Analytics"
        description="What your patterns and progress tell you."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Select
            value={analytics.period}
            onValueChange={(value) => analytics.setPeriod(value as AnalyticsPeriod)}
          >
            <SelectTrigger aria-label="Time period" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANALYTICS_PERIODS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {analytics.status === "loading" ? (
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : analytics.status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="Analytics couldn't be loaded"
          description={analytics.error ?? "Please try again."}
          onRetry={analytics.reload}
        />
      ) : !analytics.hasAnyData ? (
        <EmptyState
          icon={<Gauge className="size-6" aria-hidden="true" />}
          title="Nothing to analyse yet"
          description="Define a KPI and log a few entries, or save a Life Score, and insights will build from there."
          action={
            <Link
              href="/analytics/kpis"
              className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Set up a KPI
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
      ) : (
        <>
          {/* KEY INSIGHT */}
          <InsightCard insight={analytics.insight} />

          {/* CORE METRICS */}
          <section aria-labelledby="core-metrics" className="space-y-3">
            <h2 id="core-metrics" className="text-eyebrow">
              Core metrics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Life Score"
                value={analytics.lifeScore.score ?? "—"}
                hint={
                  analytics.lifeScoreComparison.previous === null
                    ? "No prior period to compare"
                    : "vs previous period"
                }
                change={changeLabel(analytics.lifeScoreComparison)}
                trend={analytics.lifeScoreComparison.direction}
                icon={<Gauge className="size-4" />}
              />
              {analytics.rankedMetrics.slice(0, 3).map((metric) => (
                <MetricCard
                  key={metric.id}
                  label={metric.label}
                  value={`${metric.comparison.current ?? "—"}${metric.unit ? ` ${metric.unit}` : ""}`}
                  hint={
                    metric.comparison.previous === null
                      ? `${metric.comparison.sampleSize} this period`
                      : "vs previous period"
                  }
                  change={changeLabel(metric.comparison)}
                  trend={metric.comparison.direction}
                  trendPositiveIsGood={metric.higherIsBetter}
                />
              ))}
            </div>
            {analytics.rankedMetrics.length === 0 ? (
              <p className="text-muted text-sm">
                No KPI has entries in this period yet — only the Life Score is shown.
              </p>
            ) : null}
          </section>

          {/* PRIMARY TREND */}
          <section aria-labelledby="primary-trend" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="primary-trend" className="text-eyebrow">
                Trend
              </h2>
              <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                <SelectTrigger aria-label="Metric to plot" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LIFE_SCORE_KEY}>Life Score</SelectItem>
                  {analytics.kpis.items.map((kpi) => (
                    <SelectItem key={kpi.id} value={kpi.id}>
                      {kpi.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="space-y-4 p-5">
                <TrendChart points={chartPoints} label={chartLabel} unit={chartUnit} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricCard
                    variant="plain"
                    label="Current"
                    value={`${chartComparison.current ?? "—"}${chartUnit ? ` ${chartUnit}` : ""}`}
                  />
                  <MetricCard
                    variant="plain"
                    label="Previous"
                    value={
                      chartComparison.previous === null
                        ? "—"
                        : `${chartComparison.previous}${chartUnit ? ` ${chartUnit}` : ""}`
                    }
                  />
                  <MetricCard
                    variant="plain"
                    label="Change"
                    value={
                      chartComparison.changeAbs === null
                        ? "—"
                        : `${chartComparison.changeAbs > 0 ? "+" : ""}${chartComparison.changeAbs}`
                    }
                  />
                  <MetricCard
                    variant="plain"
                    label="Entries"
                    value={chartComparison.sampleSize}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ATTENTION */}
          <SignalList
            title="Needs attention"
            tone="warning"
            icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}
            signals={analytics.attention}
          />

          {/* POSITIVE SIGNALS */}
          <SignalList
            title="Going well"
            tone="success"
            icon={<CheckCircle2 className="size-3.5" aria-hidden="true" />}
            signals={analytics.positive}
          />

          {analytics.attention.length === 0 && analytics.positive.length === 0 ? (
            <p className="text-muted text-sm">
              No notable shifts this period. Widen the time range or keep logging to surface
              patterns.
            </p>
          ) : null}

          {/* DETAILED DATA */}
          <section aria-labelledby="detailed-data" className="space-y-3">
            <h2 id="detailed-data" className="text-eyebrow">
              Detailed data
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DETAIL_LINKS.map((link) => (
                <Card key={link.href} className="hover:border-border-strong transition-colors">
                  <Link
                    href={link.href}
                    className="focus-visible:ring-ring flex flex-col gap-1 rounded-lg p-4 outline-none focus-visible:ring-2"
                  >
                    <span className="text-foreground text-sm font-medium">{link.label}</span>
                    <span className="text-subtle text-xs">{link.description}</span>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </PageContainer>
  );
}
