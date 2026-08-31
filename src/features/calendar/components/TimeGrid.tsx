"use client";

import { dayKey, layoutDay, occurrencesByDay, sameDay, startOfDay } from "../calendar-range";
import { instantToWall } from "../zoned-time";
import type { EventOccurrence } from "../recurrence";

const HOUR_PX = 44;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function rangeLabel(occ: EventOccurrence): string {
  const start = instantToWall(occ.start, occ.event.timeZone).time;
  const end = instantToWall(occ.end, occ.event.timeZone).time;
  return `${start} – ${end}`;
}

interface TimeGridProps {
  days: Date[];
  occurrences: EventOccurrence[];
  onSelectDay: (day: Date) => void;
  onSelectOccurrence: (occ: EventOccurrence) => void;
}

export function TimeGrid({ days, occurrences, onSelectDay, onSelectOccurrence }: TimeGridProps) {
  const byDay = occurrencesByDay(occurrences, days);
  const today = new Date();
  const columnsTemplate = `3.5rem repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <div className="border-border grid border-b" style={{ gridTemplateColumns: columnsTemplate }}>
        <div />
        {days.map((day) => (
          <button
            key={dayKey(day)}
            type="button"
            onClick={() => onSelectDay(day)}
            className="p-2 text-center text-xs hover:bg-surface"
          >
            <span className="text-subtle block">
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span
              className={
                sameDay(day, today) ? "text-primary font-semibold" : "text-foreground font-medium"
              }
            >
              {day.getDate()}
            </span>
          </button>
        ))}
      </div>

      {/* All-day row */}
      <div className="border-border grid border-b" style={{ gridTemplateColumns: columnsTemplate }}>
        <div className="text-subtle p-1 text-[0.65rem]">all day</div>
        {days.map((day) => {
          const allDayEvents = (byDay.get(dayKey(day)) ?? []).filter((occ) => occ.allDay);
          return (
            <div key={dayKey(day)} className="border-border space-y-0.5 border-l p-1">
              {allDayEvents.map((occ) => (
                <button
                  key={occ.key}
                  type="button"
                  onClick={() => onSelectOccurrence(occ)}
                  className="block w-full truncate rounded bg-primary/10 px-1 py-0.5 text-left text-[0.7rem] text-primary hover:bg-primary/20"
                >
                  {occ.event.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: columnsTemplate }}>
          <div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="text-subtle relative text-[0.65rem]"
                style={{ height: HOUR_PX }}
              >
                <span className="absolute -top-1.5 right-1">
                  {hour === 0 ? "" : `${String(hour).padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>
          {days.map((day) => {
            const dayOccurrences = (byDay.get(dayKey(day)) ?? []).filter((occ) => !occ.allDay);
            const positioned = layoutDay(dayOccurrences, day);
            return (
              <div
                key={dayKey(day)}
                className="border-border relative border-l"
                style={{ height: HOUR_PX * 24 }}
                onDoubleClick={() => onSelectDay(startOfDay(day))}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-border/60 border-b"
                    style={{ height: HOUR_PX }}
                  />
                ))}
                {positioned.map(({ occ, topMinutes, heightMinutes, column, columns }) => (
                  <button
                    key={occ.key}
                    type="button"
                    onClick={() => onSelectOccurrence(occ)}
                    className="absolute overflow-hidden rounded bg-primary/15 p-1 text-left text-[0.7rem] text-primary ring-1 ring-primary/30 hover:bg-primary/25"
                    style={{
                      top: (topMinutes / 60) * HOUR_PX,
                      height: Math.max(16, (heightMinutes / 60) * HOUR_PX - 2),
                      left: `${(column / columns) * 100}%`,
                      width: `${(1 / columns) * 100}%`,
                    }}
                  >
                    <span className="block truncate font-medium">{occ.event.title}</span>
                    <span className="block truncate opacity-70">{rangeLabel(occ)}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
