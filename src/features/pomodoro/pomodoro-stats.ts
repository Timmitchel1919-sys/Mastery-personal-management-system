import type { PomodoroSession } from "./schema";

export interface PomodoroStats {
  sessions: number;
  completed: number;
  abandoned: number;
  focusMinutes: number;
  workIntervals: number;
  avgFocusMinutes: number;
  todayFocusMinutes: number;
}

function isSameLocalDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

/** Roll a page of pomodoro sessions into headline focus statistics. Pure. */
export function summarizeSessions(
  sessions: PomodoroSession[],
  now: Date = new Date(),
): PomodoroStats {
  let completed = 0;
  let focusMinutes = 0;
  let workIntervals = 0;
  let todayFocusMinutes = 0;

  for (const session of sessions) {
    if (session.outcome === "completed") completed += 1;
    focusMinutes += session.focusMinutes;
    workIntervals += session.completedWorkIntervals;
    if (isSameLocalDay(session.startedAt, now)) todayFocusMinutes += session.focusMinutes;
  }

  const round = (value: number) => Math.round(value * 10) / 10;

  return {
    sessions: sessions.length,
    completed,
    abandoned: sessions.length - completed,
    focusMinutes: round(focusMinutes),
    workIntervals,
    avgFocusMinutes: sessions.length === 0 ? 0 : round(focusMinutes / sessions.length),
    todayFocusMinutes: round(todayFocusMinutes),
  };
}
