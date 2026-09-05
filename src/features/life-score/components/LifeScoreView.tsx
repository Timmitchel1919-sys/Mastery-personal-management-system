"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { EmptyState, ErrorState, Sparkline } from "@/components/shared";
import { Badge, Button, Card, CardContent, Progress, Skeleton } from "@/components/ui";
import { useLifeScore } from "../use-life-score";
import { SaveScoreDialog } from "./SaveScoreDialog";

export function LifeScoreView() {
  const { status, score, factors, history, error, reload, saveToday } = useLifeScore();
  const [saveOpen, setSaveOpen] = useState(false);

  const chronological = [...history].sort((a, b) => a.date.localeCompare(b.date)).slice(-90);

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Life Score"
        description="A transparent, configurable score with visible contributing factors."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={() => setSaveOpen(true)} disabled={status !== "ready" || score === null}>
            <Save />
            Save today&apos;s score
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-52" />
        </div>
      ) : status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your Life Score"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      ) : (
        <>
          <Card>
            <CardContent className="space-y-4 p-6">
              {score === null ? (
                <EmptyState
                  title="Not enough data yet"
                  description="Add at least one KPI with a target, then log an entry — your Life Score is calculated from there."
                />
              ) : (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-semibold tabular-nums">{score}</span>
                    <span className="text-subtle text-sm">/ 100</span>
                  </div>
                  <Progress value={score} />
                  <div className="space-y-2">
                    <h3 className="text-subtle text-sm font-medium">Contributing factors</h3>
                    <ul className="space-y-1.5">
                      {factors.map((factor) => (
                        <li
                          key={factor.kpiId}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <span className="break-words">{factor.title}</span>
                          <span className="text-subtle flex items-center gap-2 text-xs">
                            <span>value {factor.value}</span>
                            <Badge variant="primary">{factor.attainment}%</Badge>
                            <Badge variant="outline">weight {factor.weight}</Badge>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {chronological.length > 1 ? (
            <section className="space-y-3">
              <h2 className="font-semibold">Score history</h2>
              <Card>
                <CardContent className="p-4">
                  <Sparkline
                    points={chronological.map((entry) => ({
                      date: entry.date,
                      value: entry.score,
                    }))}
                    ariaLabel={`Life Score history over its last ${chronological.length} saved entries`}
                    height={64}
                  />
                </CardContent>
              </Card>
            </section>
          ) : null}
        </>
      )}

      <SaveScoreDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        score={score}
        onSubmit={async (values) => {
          await saveToday(values.note);
        }}
      />
    </PageContainer>
  );
}
