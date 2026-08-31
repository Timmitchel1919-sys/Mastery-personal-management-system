import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { deepWorkRepository, listRecentDeepWork } from "@/features/deep-work/deep-work-repository";
import type { DeepWorkCreate } from "@/features/deep-work/schema";

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

function sessionInput(over: Partial<DeepWorkCreate> = {}): DeepWorkCreate {
  return {
    title: "Draft the spec",
    intendedOutcome: "",
    goalId: null,
    projectId: null,
    plannedMinutes: 90,
    startedAt: "2026-08-31T09:00",
    endedAt: "2026-08-31T10:30",
    actualMinutes: 85,
    energyLevel: 4,
    focusQuality: 4,
    distractions: [],
    completionNotes: "",
    sessionStatus: "completed",
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

describe("deep work repository", () => {
  it("logs a session linked to a goal, updates it, and archives it", async () => {
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

    const created = await deepWorkRepository.create(
      sessionInput({ goalId: goal.id, distractions: ["Slack", "Email"] }),
    );
    expect(created.goalId).toBe(goal.id);
    expect(created.distractions).toEqual(["Slack", "Email"]);
    expect(created.createdBy).toBe(user.uid);

    expect((await listRecentDeepWork(10)).map((s) => s.title)).toEqual(["Draft the spec"]);

    const updated = await deepWorkRepository.update(created.id, {
      focusQuality: 5,
      actualMinutes: 95,
    });
    expect(updated.focusQuality).toBe(5);
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await deepWorkRepository.archive(created.id);
    expect(await listRecentDeepWork(10)).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await deepWorkRepository.create(sessionInput({ title: "Private session" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listRecentDeepWork(10)).toHaveLength(0);
  });
});
