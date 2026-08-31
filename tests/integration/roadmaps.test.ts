import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { listActiveRoadmaps, roadmapRepository } from "@/features/roadmaps/roadmap-repository";
import type { RoadmapCreate } from "@/features/roadmaps/schema";

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

function roadmapInput(
  fields: Partial<RoadmapCreate> & Pick<RoadmapCreate, "title" | "pillarIds">,
): RoadmapCreate {
  return {
    description: "",
    roadmapKind: "goal",
    linkedGoalId: null,
    linkedProjectId: null,
    startDate: null,
    endDate: null,
    roadmapStatus: "planning",
    progress: 0,
    phases: [],
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

describe("roadmap repository", () => {
  it("creates a roadmap linked to a goal with phases, updates it, and archives it", async () => {
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

    const created = await roadmapRepository.create(
      roadmapInput({
        title: "Fitness roadmap",
        pillarIds: ["personal"],
        roadmapKind: "goal",
        linkedGoalId: goal.id,
        roadmapStatus: "active",
        phases: [
          {
            name: "Base building",
            startDate: "2026-01-01",
            endDate: "2026-03-31",
            phaseStatus: "in-progress",
          },
          { name: "Race prep", startDate: null, endDate: null, phaseStatus: "upcoming" },
        ],
      }),
    );
    expect(created.linkedGoalId).toBe(goal.id);
    expect(created.phases).toHaveLength(2);
    expect(created.createdBy).toBe(user.uid);

    expect((await listActiveRoadmaps()).map((roadmap) => roadmap.title)).toEqual([
      "Fitness roadmap",
    ]);

    const updated = await roadmapRepository.update(created.id, {
      progress: 50,
      roadmapStatus: "on-hold",
    });
    expect(updated.progress).toBe(50);
    expect(updated.roadmapStatus).toBe("on-hold");
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await roadmapRepository.archive(created.id);
    expect(await listActiveRoadmaps()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await roadmapRepository.create(
      roadmapInput({ title: "Private roadmap", pillarIds: ["personal"] }),
    );
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveRoadmaps()).toHaveLength(0);
  });
});
