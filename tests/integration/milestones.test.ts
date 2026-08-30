import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import {
  listActiveMilestones,
  milestoneRepository,
} from "@/features/milestones/milestone-repository";
import type { MilestoneCreate } from "@/features/milestones/schema";

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

function milestoneInput(
  fields: Partial<MilestoneCreate> & Pick<MilestoneCreate, "title" | "pillarIds">,
): MilestoneCreate {
  return {
    description: "",
    parentType: "none",
    parentId: null,
    dueDate: null,
    milestoneStatus: "upcoming",
    progress: 0,
    dependencies: [],
    evidence: "",
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

describe("milestone repository", () => {
  it("creates a milestone linked to a goal, updates it, and archives it", async () => {
    const user = await signUpFresh("alice");

    const goal = await goalRepository.create({
      title: "Get fit",
      description: "",
      pillarIds: ["personal"],
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
    });

    const created = await milestoneRepository.create(
      milestoneInput({
        title: "First 5k without stopping",
        pillarIds: ["personal"],
        parentType: "goal",
        parentId: goal.id,
        dueDate: "2026-02-15",
        milestoneStatus: "in-progress",
        dependencies: ["New running shoes"],
      }),
    );
    expect(created.parentType).toBe("goal");
    expect(created.parentId).toBe(goal.id);
    expect(created.createdBy).toBe(user.uid);

    expect((await listActiveMilestones()).map((milestone) => milestone.title)).toEqual([
      "First 5k without stopping",
    ]);

    const updated = await milestoneRepository.update(created.id, {
      progress: 100,
      milestoneStatus: "done",
    });
    expect(updated.progress).toBe(100);
    expect(updated.milestoneStatus).toBe("done");
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await milestoneRepository.archive(created.id);
    expect(await listActiveMilestones()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await milestoneRepository.create(
      milestoneInput({ title: "Private milestone", pillarIds: ["personal"] }),
    );
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveMilestones()).toHaveLength(0);
  });
});
