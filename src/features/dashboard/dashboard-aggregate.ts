import { quickNoteRepository, type QuickNote } from "./quick-note";

export type Greeting = "morning" | "afternoon" | "evening";

/** A single batched, user-scoped read of everything the dashboard needs. */
export interface DashboardAggregate {
  generatedAt: string;
  quickNotes: QuickNote[];

  // Populated by later layers. `null` = the feature does not exist yet;
  // `[]` = the feature exists but the user has no data.
  tasksCompletedToday: number | null; // Layer 10
  focusMinutesToday: number | null; // Layer 9
  habitsLoggedToday: { done: number; total: number } | null; // Layer 10
  goalProgress: number | null; // Layer 8 — 0..1
  planningAlignment: number | null; // Layer 8 — 0..1
  lifeScore: { value: number; asOf: string } | null; // Layer 12
  todaysPriorities: unknown[]; // Layer 8/10
  upcomingMilestones: unknown[]; // Layer 8
  habitStreaks: unknown[]; // Layer 10
  kpiOverview: unknown[]; // Layer 12
}

/**
 * Load the dashboard aggregate in one pass. Every future domain adds its query to the
 * `Promise.all` here so widgets never issue their own reads.
 */
export async function loadDashboardAggregate(): Promise<DashboardAggregate> {
  const [notesPage] = await Promise.all([
    quickNoteRepository.list({ limit: 5 }),
    // Layer 8:  goalRepository.list(...), milestoneRepository.upcoming(...)
    // Layer 9:  focusSessionRepository.today(...)
    // Layer 10: taskRepository.dueToday(...), habitLogRepository.today(...)
    // Layer 12: kpiRepository.overview(...), lifeScoreRepository.latest()
  ]);

  return {
    generatedAt: new Date().toISOString(),
    quickNotes: notesPage.items,
    tasksCompletedToday: null,
    focusMinutesToday: null,
    habitsLoggedToday: null,
    goalProgress: null,
    planningAlignment: null,
    lifeScore: null,
    todaysPriorities: [],
    upcomingMilestones: [],
    habitStreaks: [],
    kpiOverview: [],
  };
}

export function greetingForHour(hour: number): Greeting {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

const GREETING_TEXT: Record<Greeting, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
};

export function greetingText(greeting: Greeting): string {
  return GREETING_TEXT[greeting];
}

/** Locale- and timezone-aware date for the greeting header. */
export function formatToday(now: Date, locale: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone,
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now);
  }
}
