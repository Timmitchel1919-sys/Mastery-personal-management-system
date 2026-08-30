import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { listActiveProjects, projectRepository } from "@/features/projects/project-repository";
import type { ProjectCreate } from "@/features/projects/schema";

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

function projectInput(
  fields: Partial<ProjectCreate> & Pick<ProjectCreate, "title" | "pillarIds">,
): ProjectCreate {
  return {
    description: "",
    expectedOutcome: "",
    goalId: null,
    owner: "",
    startDate: null,
    endDate: null,
    projectStatus: "planned",
    priority: "medium",
    progress: 0,
    dependencies: [],
    risks: [],
    reviewNotes: "",
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

describe("project repository", () => {
  it("creates a project linked to a goal, updates it, and archives it", async () => {
    const user = await signUpFresh("alice");

    const goal = await goalRepository.create({
      title: "Ship the portfolio",
      description: "",
      pillarIds: ["personal"],
      parentPlanId: null,
      startDate: null,
      targetDate: null,
      goalStatus: "not-started",
      priority: "high",
      progress: 0,
      measurementType: "binary",
      targetValue: null,
      currentValue: null,
      unit: "",
      reviewFrequency: "none",
      notes: "",
    });

    const created = await projectRepository.create(
      projectInput({
        title: "Launch personal site",
        pillarIds: ["personal"],
        goalId: goal.id,
        endDate: "2026-03-31",
        projectStatus: "active",
        priority: "high",
        dependencies: ["Domain purchased"],
        risks: ["Scope creep"],
      }),
    );
    expect(created.goalId).toBe(goal.id);
    expect(created.dependencies).toEqual(["Domain purchased"]);
    expect(created.createdBy).toBe(user.uid);

    expect((await listActiveProjects()).map((project) => project.title)).toEqual([
      "Launch personal site",
    ]);

    const updated = await projectRepository.update(created.id, {
      progress: 60,
      projectStatus: "blocked",
    });
    expect(updated.progress).toBe(60);
    expect(updated.projectStatus).toBe("blocked");
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await projectRepository.archive(created.id);
    expect(await listActiveProjects()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await projectRepository.create(
      projectInput({ title: "Private project", pillarIds: ["personal"] }),
    );
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveProjects()).toHaveLength(0);
  });
});
