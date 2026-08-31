"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GoalOption } from "@/features/goals";
import type { ProjectOption } from "@/features/projects";
import { EventForm } from "./EventForm";
import { dayKey } from "../calendar-range";
import { isoToWall, resolveBrowserZone } from "../zoned-time";
import type { CalendarEvent, CalendarEventFormValues } from "../schema";

const WEEKLY_DEFAULT: CalendarEventFormValues["repeatWeekdays"] = [];

function blankValues(seed: Date): CalendarEventFormValues {
  const zone = resolveBrowserZone();
  const start = new Date(seed);
  start.setMinutes(0, 0, 0);
  if (start.getHours() === 0) start.setHours(9);
  const end = new Date(start.getTime() + 60 * 60_000);
  const toWall = (d: Date) =>
    `${dayKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return {
    title: "",
    description: "",
    location: "",
    allDay: false,
    timeZone: zone,
    startWall: toWall(start),
    endWall: toWall(end),
    startDate: dayKey(seed),
    endDate: dayKey(seed),
    repeat: "none",
    interval: 1,
    repeatWeekdays: WEEKLY_DEFAULT,
    repeatEndMode: "never",
    repeatCount: 10,
    repeatUntil: "",
    reminders: [10],
    goalId: "",
    projectId: "",
  };
}

function eventToValues(event: CalendarEvent): CalendarEventFormValues {
  const zone = event.timeZone || resolveBrowserZone();
  const startWallParts = event.startDateTime ? isoToWall(event.startDateTime, zone) : null;
  const endWallParts = event.endDateTime ? isoToWall(event.endDateTime, zone) : null;
  const recurrence = event.recurrence;
  return {
    title: event.title,
    description: event.description,
    location: event.location,
    allDay: event.allDay,
    timeZone: zone,
    startWall: startWallParts ? `${startWallParts.date}T${startWallParts.time}` : "",
    endWall: endWallParts ? `${endWallParts.date}T${endWallParts.time}` : "",
    startDate: event.startDate ?? "",
    endDate: event.endDate ?? "",
    repeat: recurrence?.frequency ?? "none",
    interval: recurrence?.interval ?? 1,
    repeatWeekdays: recurrence?.weekdays ?? [],
    repeatEndMode: recurrence
      ? recurrence.count !== null
        ? "count"
        : recurrence.until !== null
          ? "until"
          : "never"
      : "never",
    repeatCount: recurrence?.count ?? 10,
    repeatUntil: recurrence?.until ?? "",
    reminders: event.reminders,
    goalId: event.goalId ?? "",
    projectId: event.projectId ?? "",
  };
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  seedDate: Date;
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
  onSubmit: (values: CalendarEventFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  seedDate,
  goalOptions,
  projectOptions,
  onSubmit,
  onDelete,
}: EventDialogProps) {
  const editing = Boolean(event);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            {event?.recurrence
              ? "Changes apply to the whole series."
              : "Set the time, repeat rule, reminders, and any links."}
          </DialogDescription>
        </DialogHeader>
        <EventForm
          key={event?.id ?? `new-${seedDate.toISOString()}`}
          goalOptions={goalOptions}
          projectOptions={projectOptions}
          submitLabel={editing ? "Save changes" : "Create event"}
          defaultValues={event ? eventToValues(event) : blankValues(seedDate)}
          onSubmit={async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          }}
          onDelete={
            event
              ? async () => {
                  await onDelete(event.id);
                  onOpenChange(false);
                }
              : undefined
          }
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
