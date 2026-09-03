import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { listActiveTasks, listTaskOptions, taskRepository } from "@/features/tasks/task-repository";
import type { TaskCreate } from "@/features/tasks/schema";

const PROJECT_ID = "demo-mastery";
const AUTH_HOST = "http://127.0.0.1:9099";
const FIRESTORE_HOST = "http://127.0.0.1:8080";

async function resetEmulators() {
  await fetch(`${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
  await fetch(
    `${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
}

function uniqueEmail(tag: string) {
  return `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUpFresh(tag: string) {
  return authService.signUpWithEmail({
    email: uniqueEmail(tag),
    password: "sup3rsecret",
    displayName: tag,
  });
}

function taskInput(over: Partial<TaskCreate> = {}): TaskCreate {
  return {
    title: "Draft the report",
    description: "",
    taskStatus: "todo",
    priority: "high",
    startDate: null,
    dueDate: "2026-09-05",
    pillarIds: ["personal"],
    goalId: null,
    projectId: null,
    milestoneId: null,
    parentTaskId: null,
    recurrence: null,
    estimatedMinutes: 120,
    actualMinutes: 0,
    energyRequirement: "medium",
    context: "@computer",
    tags: ["writing"],
    notes: "",
    completedAt: null,
    resolutionReason: "",
    ...over,
  };
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("tasks repository", () => {
  it("creates a task linked to a goal + parent, completes it, and archives it", async () => {
    const user = await signUpFresh("alice");

    const goal = await goalRepository.create({
      title: "Ship v1",
      description: "",
      pillarIds: ["personal"],
      parentPlanId: null,
      startDate: null,
      targetDate: null,
      goalStatus: "in-progress",
      priority: "high",
      progress: 0,
      measurementType: "binary",
      targetValue: null,
      currentValue: null,
      unit: "",
      reviewFrequency: "none",
      notes: "",
    });

    const parent = await taskRepository.create(taskInput({ title: "Epic: reporting" }));
    const child = await taskRepository.create(
      taskInput({
        title: "Draft the report",
        goalId: goal.id,
        parentTaskId: parent.id,
      }),
    );
    expect(child.goalId).toBe(goal.id);
    expect(child.parentTaskId).toBe(parent.id);
    expect(child.createdBy).toBe(user.uid);

    // Parent listed as a link option; a closed task is not.
    expect((await listTaskOptions()).map((t) => t.title).sort()).toEqual([
      "Draft the report",
      "Epic: reporting",
    ]);

    const done = await taskRepository.update(child.id, {
      taskStatus: "done",
      completedAt: "2026-09-06T09:00:00.000Z",
    });
    expect(done.taskStatus).toBe("done");
    expect(done.completedAt).toBe("2026-09-06T09:00:00.000Z");
    expect(done.version).toBeGreaterThanOrEqual(2);

    const listed = await listActiveTasks();
    expect(listed).toHaveLength(2);
    // Closed task sorts after the open one.
    expect(listed[listed.length - 1]?.id).toBe(child.id);

    await taskRepository.archive(parent.id);
    expect((await listActiveTasks()).map((t) => t.id)).toEqual([child.id]);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await taskRepository.create(taskInput({ title: "Private task" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveTasks()).toHaveLength(0);
  });
});
