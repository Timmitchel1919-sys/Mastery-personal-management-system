import { createFirestoreRepository } from "@/lib/repository";
import {
  isClosed,
  taskCreateSchema,
  taskSchema,
  taskUpdateSchema,
  type Task,
  type TaskCreate,
  type TaskStatus,
  type TaskUpdate,
} from "./schema";
import type { Priority } from "@/lib/validation/domain";

export const taskRepository = createFirestoreRepository<Task, TaskCreate, TaskUpdate>({
  collectionName: "tasks",
  schema: taskSchema,
  createSchema: taskCreateSchema,
  updateSchema: taskUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

const PRIORITY_RANK: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_RANK: Record<TaskStatus, number> = {
  "in-progress": 0,
  todo: 1,
  blocked: 2,
  done: 3,
  cancelled: 4,
};

/**
 * Bounded fetch of active (non-archived) tasks, ordered for the work list: open before
 * closed, then by priority, then by due date (undated last), then by title. Sorted
 * client-side to avoid a composite index; the working set is expected to be small.
 */
export async function listActiveTasks(limit = 300): Promise<Task[]> {
  const page = await taskRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items
    .filter((task) => task.status === "active")
    .sort((a, b) => {
      const closed = Number(isClosed(a.taskStatus)) - Number(isClosed(b.taskStatus));
      if (closed !== 0) return closed;
      const status = STATUS_RANK[a.taskStatus] - STATUS_RANK[b.taskStatus];
      if (status !== 0) return status;
      const priority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priority !== 0) return priority;
      const due = (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31");
      if (due !== 0) return due;
      return a.title.localeCompare(b.title);
    });
}

export interface TaskOption {
  id: string;
  title: string;
}

/** Active, non-closed tasks as `{ id, title }` — for the parent-task picker. */
export async function listTaskOptions(): Promise<TaskOption[]> {
  return (await listActiveTasks())
    .filter((task) => !isClosed(task.taskStatus))
    .map((task) => ({ id: task.id, title: task.title }));
}
