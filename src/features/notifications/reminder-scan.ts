import type { NotificationCreate, NotificationPreferences } from "./notification-schema";
import { NOTIFICATION_TYPE_CATEGORY } from "./notification-schema";

/**
 * Pure due-item scan (Layer 17). Given the user's upcoming work and their preferences,
 * returns the reminder notifications that *should* exist right now. The caller
 * (`use-notifications.ts`) creates only the ones whose `dedupeKey` isn't already an active
 * notification, so re-running the scan is idempotent. `dedupeKey` is
 * `<type>:<relatedId>:<localDay>` — one reminder per item per day.
 *
 * This is deliberately a client-side scan: the app is a static export with no deployed
 * scheduled function. A server-side sweep (timezone-exact, works while the app is closed,
 * can drive push) is documented in ADR-0026 for when the project moves to Blaze.
 */

interface TaskLike {
  id: string;
  title: string;
  taskStatus: string;
  dueDate: string | null;
}
interface MilestoneLike {
  id: string;
  title: string;
  milestoneStatus: string;
  dueDate: string | null;
}
interface HabitLike {
  id: string;
  title: string;
  habitStatus: string;
  reminderTime: string | null;
}
interface HabitLogLike {
  habitId: string;
  logStatus: string;
  date: string;
}
interface KpiLike {
  id: string;
  title: string;
}
interface KpiEntryLike {
  kpiId: string;
  date: string;
}
interface GoalLike {
  id: string;
  title: string;
  goalStatus: string;
  reviewFrequency: string;
  updatedAt: string;
}

export interface ReminderScanInput {
  now: Date;
  /** `HH:mm` local time, and `YYYY-MM-DD` local day — resolved by the caller with the tz. */
  localTime: string;
  localDay: string;
  prefs: Pick<NotificationPreferences, "categories" | "milestoneLeadDays" | "kpiStaleDays">;
  tasks: TaskLike[];
  milestones: MilestoneLike[];
  habits: HabitLike[];
  habitLogs: HabitLogLike[];
  kpis: KpiLike[];
  kpiEntries: KpiEntryLike[];
  goals: GoalLike[];
}

const REVIEW_STALE_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

function daysBetween(a: string, b: string): number {
  const start = Date.parse(`${a}T00:00:00Z`);
  const end = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return Number.POSITIVE_INFINITY;
  return Math.round((end - start) / 86_400_000);
}

export function computeDueReminders(input: ReminderScanInput): NotificationCreate[] {
  const { localDay, prefs } = input;
  const on = (type: keyof typeof NOTIFICATION_TYPE_CATEGORY) =>
    prefs.categories[NOTIFICATION_TYPE_CATEGORY[type]] !== false;
  const out: NotificationCreate[] = [];
  const seed = (
    type: NotificationCreate["type"],
    relatedId: string,
    title: string,
    body: string,
  ): NotificationCreate => ({
    type,
    title,
    body,
    relatedId,
    dedupeKey: `${type}:${relatedId}:${localDay}`,
    read: false,
  });

  // Task due today or overdue
  if (on("task-due")) {
    for (const task of input.tasks) {
      if (task.taskStatus === "done" || task.taskStatus === "cancelled" || !task.dueDate) continue;
      if (task.dueDate <= localDay) {
        const overdue = task.dueDate < localDay;
        out.push(
          seed(
            "task-due",
            task.id,
            overdue ? `Overdue: ${task.title}` : `Due today: ${task.title}`,
            overdue ? `This task was due ${task.dueDate}.` : "This task is due today.",
          ),
        );
      }
    }
  }

  // Milestone within the lead window
  if (on("milestone-due")) {
    for (const milestone of input.milestones) {
      if (
        milestone.milestoneStatus === "done" ||
        milestone.milestoneStatus === "missed" ||
        !milestone.dueDate
      )
        continue;
      const away = daysBetween(localDay, milestone.dueDate);
      if (away >= 0 && away <= prefs.milestoneLeadDays) {
        out.push(
          seed(
            "milestone-due",
            milestone.id,
            `Milestone soon: ${milestone.title}`,
            away === 0 ? "Due today." : `Due in ${away} day${away === 1 ? "" : "s"}.`,
          ),
        );
      }
    }
  }

  // Habit not logged today, and its reminder time has passed
  if (on("habit-due")) {
    const loggedToday = new Set(
      input.habitLogs
        .filter((log) => log.date === localDay && log.logStatus === "completed")
        .map((log) => log.habitId),
    );
    for (const habit of input.habits) {
      if (habit.habitStatus !== "active" || !habit.reminderTime) continue;
      if (loggedToday.has(habit.id)) continue;
      if (input.localTime >= habit.reminderTime) {
        out.push(
          seed("habit-due", habit.id, `Time for: ${habit.title}`, "You haven't logged this today."),
        );
      }
    }
  }

  // KPI with no reading in the stale window
  if (on("kpi-stale")) {
    const lastReadingByKpi = new Map<string, string>();
    for (const entry of input.kpiEntries) {
      const prev = lastReadingByKpi.get(entry.kpiId);
      if (!prev || entry.date > prev) lastReadingByKpi.set(entry.kpiId, entry.date);
    }
    for (const kpi of input.kpis) {
      const last = lastReadingByKpi.get(kpi.id);
      const stale = !last || daysBetween(last, localDay) >= prefs.kpiStaleDays;
      if (stale) {
        out.push(
          seed(
            "kpi-stale",
            kpi.id,
            `Log a reading: ${kpi.title}`,
            last ? `Last logged ${last}.` : "No readings yet.",
          ),
        );
      }
    }
  }

  // Goal review overdue for its cadence
  if (on("planning-review")) {
    for (const goal of input.goals) {
      if (goal.goalStatus === "achieved" || goal.goalStatus === "dropped") continue;
      const window = REVIEW_STALE_DAYS[goal.reviewFrequency];
      if (!window) continue;
      const since = daysBetween(goal.updatedAt.slice(0, 10), localDay);
      if (since >= window) {
        out.push(
          seed(
            "planning-review",
            goal.id,
            `Review your goal: ${goal.title}`,
            `It hasn't been updated in ${since} days.`,
          ),
        );
      }
    }
  }

  return out;
}
