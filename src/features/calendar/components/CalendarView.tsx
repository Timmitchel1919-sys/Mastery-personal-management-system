"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { BreadcrumbTrail, PageContainer, PageHeader } from "@/components/layout";
import { ErrorState } from "@/components/shared";
import { Button, SegmentedControl, SegmentedControlItem, Skeleton } from "@/components/ui";
import { useGoalOptions } from "@/features/goals";
import { useProjectOptions } from "@/features/projects";
import { useMounted } from "@/hooks/use-mounted";
import { useCalendar } from "../use-calendar";
import { eventInputFromForm, type CalendarEvent } from "../schema";
import type { CalendarViewMode } from "../calendar-range";
import type { EventOccurrence } from "../recurrence";
import { MonthGrid } from "./MonthGrid";
import { TimeGrid } from "./TimeGrid";
import { EventDialog } from "./EventDialog";

const VIEW_LABEL: Record<CalendarViewMode, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

export function CalendarView() {
  const mounted = useMounted();
  const calendar = useCalendar();
  const { options: goalOptions } = useGoalOptions();
  const { options: projectOptions } = useProjectOptions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [seedDate, setSeedDate] = useState<Date>(() => new Date());

  function openNew(day: Date) {
    setEditing(null);
    setSeedDate(day);
    setDialogOpen(true);
  }

  function openOccurrence(occ: EventOccurrence) {
    setEditing(occ.event);
    setSeedDate(occ.start);
    setDialogOpen(true);
  }

  return (
    <PageContainer size="wide" className="space-y-4">
      <PageHeader
        title="Calendar"
        description="Day, week, and month views with recurring events, reminders, and links."
        breadcrumbs={<BreadcrumbTrail />}
        actions={
          <Button onClick={() => openNew(calendar.anchor)} disabled={!mounted}>
            <Plus />
            New event
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Calendar view"
          value={calendar.view}
          onValueChange={(next) => {
            if (next) calendar.setView(next as CalendarViewMode);
          }}
        >
          {(["day", "week", "month"] as CalendarViewMode[]).map((mode) => (
            <SegmentedControlItem key={mode} value={mode}>
              {VIEW_LABEL[mode]}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label="Previous period" onClick={calendar.goPrev}>
            <ChevronLeft />
          </Button>
          <Button variant="secondary" size="sm" onClick={calendar.goToday}>
            Today
          </Button>
          <Button variant="ghost" size="sm" aria-label="Next period" onClick={calendar.goNext}>
            <ChevronRight />
          </Button>
        </div>

        <span className="text-sm font-medium">{mounted ? calendar.label : ""}</span>
      </div>

      {!mounted || calendar.status === "loading" ? (
        <Skeleton className="h-[60vh]" />
      ) : calendar.status === "error" ? (
        <ErrorState
          className="min-h-[40vh]"
          title="We couldn't load your calendar"
          description={calendar.error ?? "Please try again."}
          onRetry={calendar.reload}
        />
      ) : calendar.view === "month" ? (
        <MonthGrid
          anchor={calendar.anchor}
          occurrences={calendar.occurrences}
          onSelectDay={openNew}
          onSelectOccurrence={openOccurrence}
        />
      ) : (
        <TimeGrid
          days={calendar.days}
          occurrences={calendar.occurrences}
          onSelectDay={openNew}
          onSelectOccurrence={openOccurrence}
        />
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editing}
        seedDate={seedDate}
        goalOptions={goalOptions}
        projectOptions={projectOptions}
        onSubmit={async (values) => {
          const input = eventInputFromForm(values);
          if (editing) await calendar.update(editing.id, input);
          else await calendar.create(input);
        }}
        onDelete={calendar.remove}
      />
    </PageContainer>
  );
}
