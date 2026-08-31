import { CalendarClock, Link2, Timer } from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui";
import { OUTCOME_LABEL, type PomodoroSession } from "../schema";

function formatMinutes(total: number): string {
  const rounded = Math.round(total);
  if (rounded < 60) return `${rounded}m`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatWhen(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

interface PomodoroHistoryListProps {
  sessions: PomodoroSession[];
  goalTitleById: Map<string, string>;
  projectTitleById: Map<string, string>;
}

export function PomodoroHistoryList({
  sessions,
  goalTitleById,
  projectTitleById,
}: PomodoroHistoryListProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="text-subtle p-4 text-sm">
          No focus sessions yet. Finish or end a session and it shows up here.
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.map((session) => {
        const link =
          (session.goalId ? goalTitleById.get(session.goalId) : undefined) ??
          (session.projectId ? projectTitleById.get(session.projectId) : undefined);
        return (
          <li key={session.id}>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
                <Badge variant={session.outcome === "completed" ? "success" : "neutral"}>
                  {OUTCOME_LABEL[session.outcome]}
                </Badge>
                <span className="font-medium break-words">{session.label || "Untitled focus"}</span>
                <span className="text-subtle inline-flex items-center gap-1 text-xs">
                  <Timer className="size-3.5" aria-hidden="true" />
                  {formatMinutes(session.focusMinutes)} · {session.completedWorkIntervals}×
                </span>
                {link ? (
                  <span className="text-subtle inline-flex items-center gap-1 text-xs">
                    <Link2 className="size-3.5" aria-hidden="true" />
                    {link}
                  </span>
                ) : null}
                <span className="text-subtle ml-auto inline-flex items-center gap-1 text-xs">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  {formatWhen(session.startedAt)}
                </span>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
