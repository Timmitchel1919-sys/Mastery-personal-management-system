"use client";

import { EmptyState, ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui";
import { useWeeklySummaries } from "../use-weekly-summaries";
import { WeeklySummaryCard } from "./WeeklySummaryCard";

export function WeeklySummariesView() {
  const { status, items, error, reload, archive, remove } = useWeeklySummaries();

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <ErrorState
        className="min-h-[30vh]"
        title="We couldn't load your weekly summaries"
        description={error ?? "Please try again."}
        onRetry={reload}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No weekly summaries yet"
        description="Your first one appears after your next scheduled review, if you're opted in."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((summary) => (
        <WeeklySummaryCard
          key={summary.id}
          summary={summary}
          onArchive={archive}
          onDelete={remove}
        />
      ))}
    </div>
  );
}
