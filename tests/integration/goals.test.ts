import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { getPlanRepository } from "@/features/plans/repositories";
import { goalRepository, listActiveGoals } from "@/features/goals/goal-repository";
import type { GoalCreate } from "@/features/goals/schema";

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

function goalInput(
  fields: Partial<GoalCreate> & Pick<GoalCreate, "title" | "pillarIds">,
): GoalCreate {
  return {
    description: "",
    parentPlanId: null,
    startDate: null,
    targetDate: null,
    goalStatus: "not-started",
    priority: "medium",
    progress: 0,
    measurementType: "binary",
    targetValue: null,
    currentValue: null,
    unit: "",
    reviewFrequency: "none",
    notes: "",
    ...fields,
  };
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("goal repository", () => {
  it("creates a goal linked to a plan, updates it, and archives it", async () => {
    const user = await signUpFresh("alice");

    const plan = await getPlanRepository("one-year").create({
      horizon: "one-year",
      title: "Get fit",
      objective: "Be consistent.",
      desiredOutcomes: [],
      keyMeasures: [],
      startDate: null,
      endDate: null,
      planStatus: "active",
      progress: 0,
      reviewNotes: "",
      pillarIds: ["personal"],
      parentId: null,
    });

    const created = await goalRepository.create(
      goalInput({
        title: "Run a half marathon",
        pillarIds: ["personal"],
        parentPlanId: plan.id,
        targetDate: "2026-06-30",
        measurementType: "duration",
        targetValue: 21,
        currentValue: 5,
        unit: "km",
        priority: "high",
      }),
    );
    expect(created.parentPlanId).toBe(plan.id);
    expect(created.targetValue).toBe(21);
    expect(created.currentValue).toBe(5);
    expect(created.createdBy).toBe(user.uid);

    expect((await listActiveGoals()).map((goal) => goal.title)).toEqual(["Run a half marathon"]);

    const updated = await goalRepository.update(created.id, {
      progress: 60,
      currentValue: 12,
      goalStatus: "in-progress",
    });
    expect(updated.progress).toBe(60);
    expect(updated.currentValue).toBe(12);
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await goalRepository.archive(created.id);
    expect(await listActiveGoals()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await goalRepository.create(goalInput({ title: "Private goal", pillarIds: ["personal"] }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveGoals()).toHaveLength(0);
  });
});
