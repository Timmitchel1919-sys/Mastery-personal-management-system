import type { Firestore } from "firebase-admin/firestore";
import { inRange, type WeekRange } from "./week-window";

/**
 * Bounded, defensive Admin SDK reads for one user's past week — the same "read raw
 * fields, don't import client schemas" approach as `ai/shared/context-builder.ts`.
 * "Cancelled" timing and "completed" timing for goals/milestones are approximated from
 * `updatedAt` (no dedicated event-timestamp field), the same known limitation the
 * Execution Tracker (Layer 10D, ADR-0016) already documents.
 */

export interface KpiMovement {
  title: string;
  from: number | null;
  to: number;
}

export interface WeekFacts {
  goalsCompleted: string[];
  milestonesCompleted: string[];
  tasksCompleted: number;
  tasksCompletedOnTime: number;
  tasksCompletedLate: number;
  tasksCancelled: number;
  tasksStillOverdue: number;
  /** `null` when the user has no active habits — never presented as 0% attainment. */
  habitConsistencyPercent: number | null;
  focusMinutes: number;
  kpiMovements: KpiMovement[];
}

function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
}

/** A Firestore Timestamp (duck-typed) or a plain ISO string -> a `YYYY-MM-DD` key. Pure. */
export function toDateKey(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  }
  if (typeof value === "string") return value.slice(0, 10);
  return null;
}

async function collectGoalsCompleted(
  db: Firestore,
  uid: string,
  range: WeekRange,
): Promise<string[]> {
  const snap = await db
    .collection(`users/${uid}/goals`)
    .where("goalStatus", "==", "achieved")
    .limit(50)
    .get();
  return snap.docs
    .map((doc) => asRecord(doc.data()))
    .filter((goal) => inRange(toDateKey(goal.updatedAt), range))
    .map((goal) => (typeof goal.title === "string" ? goal.title : "Untitled goal"));
}

async function collectMilestonesCompleted(
  db: Firestore,
  uid: string,
  range: WeekRange,
): Promise<string[]> {
  const snap = await db
    .collection(`users/${uid}/milestones`)
    .where("milestoneStatus", "==", "done")
    .limit(50)
    .get();
  return snap.docs
    .map((doc) => asRecord(doc.data()))
    .filter((milestone) => inRange(toDateKey(milestone.updatedAt), range))
    .map((milestone) =>
      typeof milestone.title === "string" ? milestone.title : "Untitled milestone",
    );
}

interface TaskFacts {
  tasksCompleted: number;
  tasksCompletedOnTime: number;
  tasksCompletedLate: number;
  tasksCancelled: number;
  tasksStillOverdue: number;
}

async function collectTaskFacts(db: Firestore, uid: string, range: WeekRange): Promise<TaskFacts> {
  const snap = await db.collection(`users/${uid}/tasks`).limit(300).get();
  const facts: TaskFacts = {
    tasksCompleted: 0,
    tasksCompletedOnTime: 0,
    tasksCompletedLate: 0,
    tasksCancelled: 0,
    tasksStillOverdue: 0,
  };

  for (const doc of snap.docs) {
    const task = asRecord(doc.data());
    const status = task.taskStatus;
    const dueDate = typeof task.dueDate === "string" ? task.dueDate : null;
    const completedAt = toDateKey(task.completedAt);

    if (status === "done" && inRange(completedAt, range)) {
      facts.tasksCompleted += 1;
      if (!dueDate || (completedAt && completedAt <= dueDate)) facts.tasksCompletedOnTime += 1;
      else facts.tasksCompletedLate += 1;
    } else if (status === "cancelled" && inRange(toDateKey(task.updatedAt), range)) {
      facts.tasksCancelled += 1;
    } else if (status !== "done" && status !== "cancelled" && dueDate && dueDate < range.endIso) {
      facts.tasksStillOverdue += 1;
    }
  }

  return facts;
}

async function collectHabitConsistency(
  db: Firestore,
  uid: string,
  range: WeekRange,
): Promise<number | null> {
  const habitsSnap = await db
    .collection(`users/${uid}/habits`)
    .where("status", "==", "active")
    .limit(100)
    .get();
  if (habitsSnap.docs.length === 0) return null;

  const logsSnap = await db.collection(`users/${uid}/habitLogs`).limit(1000).get();
  const completedInRange = logsSnap.docs
    .map((doc) => asRecord(doc.data()))
    .filter(
      (log) =>
        log.logStatus === "completed" &&
        inRange(typeof log.date === "string" ? log.date : null, range),
    ).length;

  const expected = habitsSnap.docs.length * 7;
  return Math.round((completedInRange / expected) * 100);
}

async function collectFocusMinutes(db: Firestore, uid: string, range: WeekRange): Promise<number> {
  const snap = await db.collection(`users/${uid}/focusSessions`).limit(200).get();
  return snap.docs
    .map((doc) => asRecord(doc.data()))
    .filter((session) => inRange(toDateKey(session.startedAt), range))
    .reduce(
      (sum, session) =>
        sum + (typeof session.actualMinutes === "number" ? session.actualMinutes : 0),
      0,
    );
}

async function collectKpiMovements(
  db: Firestore,
  uid: string,
  range: WeekRange,
): Promise<KpiMovement[]> {
  const [kpisSnap, entriesSnap] = await Promise.all([
    db.collection(`users/${uid}/kpis`).where("status", "==", "active").limit(30).get(),
    // Single-field orderBy + in-memory grouping avoids a composite index — same trade-off
    // the client's own `listRecentKpiEntries` makes.
    db.collection(`users/${uid}/kpiEntries`).orderBy("date", "asc").limit(1000).get(),
  ]);

  const entriesByKpi = new Map<string, { date: string; value: number }[]>();
  for (const doc of entriesSnap.docs) {
    const entry = asRecord(doc.data());
    const date = typeof entry.date === "string" ? entry.date : null;
    const kpiId = typeof entry.kpiId === "string" ? entry.kpiId : null;
    if (!date || !kpiId || !inRange(date, range)) continue;
    const list = entriesByKpi.get(kpiId) ?? [];
    list.push({ date, value: Number(entry.value) });
    entriesByKpi.set(kpiId, list);
  }

  const movements: KpiMovement[] = [];
  for (const doc of kpisSnap.docs) {
    const kpi = asRecord(doc.data());
    const entries = (entriesByKpi.get(doc.id) ?? []).sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) continue;
    movements.push({
      title: typeof kpi.title === "string" ? kpi.title : doc.id,
      from: entries.length > 1 ? entries[0]!.value : null,
      to: entries[entries.length - 1]!.value,
    });
  }
  return movements;
}

export async function collectWeekFacts(
  db: Firestore,
  uid: string,
  range: WeekRange,
): Promise<WeekFacts> {
  const [
    goalsCompleted,
    milestonesCompleted,
    taskFacts,
    habitConsistencyPercent,
    focusMinutes,
    kpiMovements,
  ] = await Promise.all([
    collectGoalsCompleted(db, uid, range),
    collectMilestonesCompleted(db, uid, range),
    collectTaskFacts(db, uid, range),
    collectHabitConsistency(db, uid, range),
    collectFocusMinutes(db, uid, range),
    collectKpiMovements(db, uid, range),
  ]);

  return {
    goalsCompleted,
    milestonesCompleted,
    habitConsistencyPercent,
    focusMinutes,
    kpiMovements,
    ...taskFacts,
  };
}
