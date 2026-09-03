import { daysOverdue, isClosed, type Task } from "./schema";

export interface TaskStats {
  total: number;
  open: number;
  done: number;
  blocked: number;
  overdue: number;
  dueToday: number;
  /** Sum of `actualMinutes` across done tasks. */
  loggedMinutes: number;
}

function todayIso(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Roll a set of tasks into headline counts. Pure. */
export function summarizeTasks(tasks: Task[], now: Date = new Date()): TaskStats {
  const today = todayIso(now);
  let open = 0;
  let done = 0;
  let blocked = 0;
  let overdue = 0;
  let dueToday = 0;
  let loggedMinutes = 0;

  for (const task of tasks) {
    if (task.taskStatus === "done") {
      done += 1;
      loggedMinutes += task.actualMinutes;
      continue;
    }
    if (task.taskStatus === "cancelled") continue;

    open += 1;
    if (task.taskStatus === "blocked") blocked += 1;
    if (daysOverdue(task, today) > 0) overdue += 1;
    else if (task.dueDate === today) dueToday += 1;
  }

  return {
    total: tasks.length,
    open,
    done,
    blocked,
    overdue,
    dueToday,
    loggedMinutes,
  };
}

/** Count of non-closed subtasks per parent id, plus how many are done. Pure. */
export function subtaskProgressByParent(
  tasks: Task[],
): Map<string, { total: number; done: number }> {
  const map = new Map<string, { total: number; done: number }>();
  for (const task of tasks) {
    if (!task.parentTaskId) continue;
    const entry = map.get(task.parentTaskId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (isClosed(task.taskStatus)) entry.done += 1;
    map.set(task.parentTaskId, entry);
  }
  return map;
}
