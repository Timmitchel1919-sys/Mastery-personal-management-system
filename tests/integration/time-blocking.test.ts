import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import {
  listActiveTimeBlocks,
  timeBlockRepository,
} from "@/features/time-blocking/time-block-repository";
import type { TimeBlockCreate } from "@/features/time-blocking/schema";

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

function blockInput(over: Partial<TimeBlockCreate> = {}): TimeBlockCreate {
  return {
    title: "Morning deep work",
    category: "deep-work",
    timeZone: "Europe/Amsterdam",
    startDateTime: "2026-09-02T09:00:00+02:00",
    endDateTime: "2026-09-02T10:30:00+02:00",
    pillarIds: ["personal"],
    goalId: null,
    projectId: null,
    notes: "",
    blockStatus: "planned",
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

describe("time blocking repository", () => {
  it("creates a block linked to a goal, lists in start order, updates, and archives", async () => {
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

    // Created out of chronological order on purpose.
    const afternoon = await timeBlockRepository.create(
      blockInput({
        title: "Afternoon review",
        startDateTime: "2026-09-02T14:00:00+02:00",
        endDateTime: "2026-09-02T15:00:00+02:00",
      }),
    );
    const morning = await timeBlockRepository.create(
      blockInput({ goalId: goal.id, category: "goal" }),
    );
    expect(morning.goalId).toBe(goal.id);
    expect(morning.createdBy).toBe(user.uid);

    const listed = await listActiveTimeBlocks();
    expect(listed.map((b) => b.id)).toEqual([morning.id, afternoon.id]);

    const updated = await timeBlockRepository.update(morning.id, { blockStatus: "done" });
    expect(updated.blockStatus).toBe("done");
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await timeBlockRepository.archive(afternoon.id);
    expect((await listActiveTimeBlocks()).map((b) => b.id)).toEqual([morning.id]);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await timeBlockRepository.create(blockInput({ title: "Private block" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveTimeBlocks()).toHaveLength(0);
  });
});
