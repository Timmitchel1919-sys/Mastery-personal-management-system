import { computeSessionScore } from "./deep-work-score";
import type { DeepWorkSession } from "./schema";

export interface DeepWorkStats {
  sessions: number;
  completed: number;
  focusMinutes: number;
  distractions: number;
  avgScore: number | null;
  avgFocusQuality: number | null;
  last7DaysMinutes: number;
}

function daysAgo(iso: string | null, reference: number): number | null {
  if (!iso) return null;
  const ms = reference - new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms / 86_400_000;
}

/** Roll a page of deep-work sessions into headline statistics. Pure. */
export function summarizeDeepWork(
  sessions: DeepWorkSession[],
  now: Date = new Date(),
): DeepWorkStats {
  const reference = now.getTime();
  let completed = 0;
  let focusMinutes = 0;
  let distractions = 0;
  let last7DaysMinutes = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  let qualitySum = 0;
  let qualityCount = 0;

  for (const session of sessions) {
    distractions += session.distractions.length;
    if (session.sessionStatus === "completed") {
      completed += 1;
      focusMinutes += session.actualMinutes;
      qualitySum += session.focusQuality;
      qualityCount += 1;

      const score = computeSessionScore(session);
      if (score !== null) {
        scoreSum += score;
        scoreCount += 1;
      }

      const age = daysAgo(session.startedAt ?? session.endedAt, reference);
      if (age !== null && age >= 0 && age <= 7) last7DaysMinutes += session.actualMinutes;
    }
  }

  const round1 = (value: number) => Math.round(value * 10) / 10;

  return {
    sessions: sessions.length,
    completed,
    focusMinutes,
    distractions,
    avgScore: scoreCount === 0 ? null : Math.round(scoreSum / scoreCount),
    avgFocusQuality: qualityCount === 0 ? null : round1(qualitySum / qualityCount),
    last7DaysMinutes,
  };
}
