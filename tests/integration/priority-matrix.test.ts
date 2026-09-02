import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import {
  listActiveMatrixItems,
  priorityMatrixRepository,
} from "@/features/priority-matrix/priority-matrix-repository";
import type { MatrixItemCreate } from "@/features/priority-matrix/schema";

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

function itemInput(over: Partial<MatrixItemCreate> = {}): MatrixItemCreate {
  return {
    title: "Reply to the auditor",
    quadrant: "do",
    note: "",
    goalId: null,
    projectId: null,
    pillarIds: ["societal"],
    completed: false,
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

describe("priority matrix repository", () => {
  it("creates an item, moves it between quadrants, completes it, and archives it", async () => {
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

    const created = await priorityMatrixRepository.create(itemInput({ goalId: goal.id }));
    expect(created.quadrant).toBe("do");
    expect(created.goalId).toBe(goal.id);
    expect(created.createdBy).toBe(user.uid);

    const moved = await priorityMatrixRepository.update(created.id, { quadrant: "schedule" });
    expect(moved.quadrant).toBe("schedule");
    expect(moved.version).toBeGreaterThanOrEqual(2);

    const done = await priorityMatrixRepository.update(created.id, { completed: true });
    expect(done.completed).toBe(true);

    expect((await listActiveMatrixItems()).map((i) => i.title)).toEqual(["Reply to the auditor"]);

    await priorityMatrixRepository.archive(created.id);
    expect(await listActiveMatrixItems()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await priorityMatrixRepository.create(itemInput({ title: "Private item" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveMatrixItems()).toHaveLength(0);
  });
});
