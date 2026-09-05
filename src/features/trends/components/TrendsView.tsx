"use client";

import { useMemo, useState } from "react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState, Sparkline } from "@/components/shared";
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
import { useKpis } from "@/features/kpis";
import { useLifeScore } from "@/features/life-score";
import { summarizeTrend } from "../trend-stats";

const LIFE_SCORE_VALUE = "__life-score__";

export function TrendsView() {
  const kpis = useKpis();
  const lifeScore = useLifeScore();
  const [selected, setSelected] = useState(LIFE_SCORE_VALUE);

  const status =
    kpis.status === "error" || lifeScore.status === "error"
      ? "error"
      : kpis.status === "loading" || lifeScore.status === "loading"
        ? "loading"
        : "ready";
  const error = kpis.error ?? lifeScore.error;

  const selectedKpi = kpis.items.find((kpi) => kpi.id === selected) ?? null;

  const series = useMemo(() => {
    if (selected === LIFE_SCORE_VALUE) {
      return [...lifeScore.history]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({ date: entry.date, value: entry.score }));
    }
    return [...(kpis.entriesByKpi.get(selected) ?? [])]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({ date: entry.date, value: entry.value }));
  }, [selected, lifeScore.history, kpis.entriesByKpi]);

  const stats = useMemo(() => summarizeTrend(series.map((point) => point.value)), [series]);
  const unit = selected === LIFE_SCORE_VALUE ? "" : (selectedKpi?.unit ?? "");
  const seriesLabel = selected === LIFE_SCORE_VALUE ? "Life Score" : (selectedKpi?.title ?? "");

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Trends"
        description="Time-series views and comparisons across your metrics."
        breadcrumbs={<BreadcrumbTrail />}
      />

      {status === "loading" ? (
        <Skeleton className="h-64" />
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your trends"
          description={error ?? "Please try again."}
          onRetry={() => {
            kpis.reload();
            lifeScore.reload();
          }}
        />
      ) : (
        <div className="max-w-md">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger id="trends-series" aria-label="Metric">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LIFE_SCORE_VALUE}>Life Score</SelectItem>
              {kpis.items.map((kpi) => (
                <SelectItem key={kpi.id} value={kpi.id}>
                  {kpi.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {status === "ready" && series.length === 0 ? (
        <EmptyState
          title="No data yet"
          description={
            selected === LIFE_SCORE_VALUE
              ? "Save a Life Score to start building its trend."
              : "Log an entry for this KPI to start building its trend."
          }
        />
      ) : null}

      {status === "ready" && series.length > 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <Sparkline
              points={series}
              ariaLabel={`${seriesLabel} trend over its last ${series.length} entries`}
              height={96}
            />
            {stats ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: "Latest", value: stats.last },
                  { label: "Change", value: stats.change > 0 ? `+${stats.change}` : stats.change },
                  { label: "Average", value: stats.avg },
                  { label: "Min", value: stats.min },
                  { label: "Max", value: stats.max },
                ].map((tile) => (
                  <div key={tile.label}>
                    <p className="text-subtle text-xs">{tile.label}</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {tile.value}
                      {unit ? ` ${unit}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
