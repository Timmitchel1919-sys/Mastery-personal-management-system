"use client";

import { dayKey, monthMatrix, occurrencesByDay, sameDay } from "../calendar-range";
import { instantToWall } from "../zoned-time";
import type { EventOccurrence } from "../recurrence";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function chipTime(occ: EventOccurrence): string {
  if (occ.allDay) return "";
  return instantToWall(occ.start, occ.event.timeZone).time;
}

interface MonthGridProps {
  anchor: Date;
  occurrences: EventOccurrence[];
  onSelectDay: (day: Date) => void;
  onSelectOccurrence: (occ: EventOccurrence) => void;
}

export function MonthGrid({
  anchor,
  occurrences,
  onSelectDay,
  onSelectOccurrence,
}: MonthGridProps) {
  const matrix = monthMatrix(anchor);
  const byDay = occurrencesByDay(occurrences, matrix.flat());
  const today = new Date();

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <div className="border-border text-subtle grid grid-cols-7 border-b text-xs font-medium">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="p-2 text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {matrix.flat().map((day) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const dayEvents = byDay.get(dayKey(day)) ?? [];
          const isToday = sameDay(day, today);
          return (
            <div
              key={dayKey(day)}
              className="border-border min-h-[6.5rem] border-r border-b p-1 last:border-r-0"
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className={`mb-1 flex size-6 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-primary text-primary-foreground font-semibold"
                    : inMonth
                      ? "text-foreground hover:bg-surface"
                      : "text-subtle hover:bg-surface"
                }`}
              >
                {day.getDate()}
              </button>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((occ) => (
                  <button
                    key={occ.key}
                    type="button"
                    onClick={() => onSelectOccurrence(occ)}
                    className="flex w-full items-center gap-1 truncate rounded bg-primary/10 px-1 py-0.5 text-left text-[0.7rem] text-primary hover:bg-primary/20"
                  >
                    {chipTime(occ) ? (
                      <span className="tabular-nums opacity-70">{chipTime(occ)}</span>
                    ) : null}
                    <span className="truncate">{occ.event.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="text-subtle px-1 text-[0.7rem] hover:underline"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
