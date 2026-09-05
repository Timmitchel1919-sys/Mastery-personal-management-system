import { z } from "zod";
import type { WeekFacts } from "./collect-week-data";

/** What the model must produce for a weekly summary — validated before use. */
export const weeklySummaryModelOutputSchema = z.object({
  lessons: z.array(z.string().trim().min(1)).max(10),
  suggestedPriorities: z.array(z.string().trim().min(1)).max(10),
});
export type WeeklySummaryModelOutput = z.infer<typeof weeklySummaryModelOutputSchema>;

export const WEEKLY_SUMMARY_SYSTEM_PROMPT = `You are the Mastery Coach, reviewing one user's past 7 days of activity in a personal operating system app.

Rules you must always follow:
- Only use the facts given to you below. Never invent an accomplishment, task, habit, or number that wasn't provided.
- Keep an encouraging, non-judgmental tone — a quiet week is not a failure, and a busy one isn't automatically a success. Never frame a missed habit or overdue task as personal failure.
- You are not a medical, psychological, or financial professional; never diagnose or prescribe treatment.
- Respond with a single JSON object and nothing else — no markdown code fences, no commentary. It must match exactly this shape:
{"lessons": string[], "suggestedPriorities": string[]}`;

function formatKpiMovements(facts: WeekFacts): string | null {
  if (facts.kpiMovements.length === 0) return null;
  return facts.kpiMovements
    .map(
      (movement) => `- ${movement.title}: ${movement.from ?? "no prior reading"} -> ${movement.to}`,
    )
    .join("\n");
}

/** Builds the user-turn prompt from computed facts. Pure. */
export function buildWeeklySummaryPrompt(facts: WeekFacts): string {
  const lines: string[] = [
    `Goals completed: ${facts.goalsCompleted.length > 0 ? facts.goalsCompleted.join(", ") : "none"}`,
    `Milestones completed: ${facts.milestonesCompleted.length > 0 ? facts.milestonesCompleted.join(", ") : "none"}`,
    `Tasks completed: ${facts.tasksCompleted} (${facts.tasksCompletedOnTime} on time, ${facts.tasksCompletedLate} late)`,
    `Tasks cancelled: ${facts.tasksCancelled}`,
    `Tasks still overdue: ${facts.tasksStillOverdue}`,
    `Habit consistency: ${facts.habitConsistencyPercent === null ? "no active habits" : `${facts.habitConsistencyPercent}%`}`,
    `Focus time: ${facts.focusMinutes} minutes`,
  ];
  const kpiLines = formatKpiMovements(facts);
  if (kpiLines) lines.push(`KPI movement:\n${kpiLines}`);

  return `Here is the user's past 7 days:\n${lines.join("\n")}\n\nGive 2-4 concise lessons and 2-4 suggested priorities for next week, grounded only in this data.`;
}
