import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { getPlanRepository, listActivePlans } from "@/features/plans/repositories";
import { PLAN_HORIZONS, type Plan, type PlanHorizon } from "@/features/plans/schema";
import { goalRepository, listActiveGoals } from "@/features/goals/goal-repository";
import { listActiveProjects, projectRepository } from "@/features/projects/project-repository";
import {
  listActiveMilestones,
  milestoneRepository,
} from "@/features/milestones/milestone-repository";
import { listActiveRoadmaps, roadmapRepository } from "@/features/roadmaps/roadmap-repository";
import { buildCascade } from "@/features/cascade/build-cascade";

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

function planFields(horizon: PlanHorizon, title: string, parentId: string | null) {
  return {
    horizon,
    title,
    objective: "Objective.",
    desiredOutcomes: [],
    keyMeasures: [],
    startDate: null,
    endDate: null,
    planStatus: "active" as const,
    progress: 0,
    reviewNotes: "",
    pillarIds: ["personal" as const],
    parentId,
  };
}

async function collectSources() {
  const planTiers = await Promise.all(PLAN_HORIZONS.map((h) => listActivePlans(h)));
  const plansByHorizon = Object.fromEntries(
    PLAN_HORIZONS.map((h, i) => [h, planTiers[i] ?? []]),
  ) as Record<PlanHorizon, Plan[]>;
  return {
    plansByHorizon,
    goals: await listActiveGoals(),
    projects: await listActiveProjects(),
    milestones: await listActiveMilestones(),
    roadmaps: await listActiveRoadmaps(),
  };
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("planning cascade (integration)", () => {
  it("builds a full chain from linked records and lists an orphan separately", async () => {
    await signUpFresh("alice");

    const fiveYear = await getPlanRepository("five-year").create(
      planFields("five-year", "Financial independence", null),
    );
    const oneYear = await getPlanRepository("one-year").create(
      planFields("one-year", "Save aggressively", fiveYear.id),
    );

    const goal = await goalRepository.create({
      title: "Build a 6-month buffer",
      description: "",
      pillarIds: ["personal"],
      parentPlanId: oneYear.id,
      startDate: null,
      targetDate: null,
      goalStatus: "in-progress",
      priority: "high",
      progress: 0,
      measurementType: "currency",
      targetValue: 12000,
      currentValue: 0,
      unit: "EUR",
      reviewFrequency: "monthly",
      notes: "",
    });

    const project = await projectRepository.create({
      title: "Automate savings",
      description: "",
      expectedOutcome: "",
      pillarIds: ["personal"],
      goalId: goal.id,
      owner: "",
      startDate: null,
      endDate: null,
      projectStatus: "active",
      priority: "medium",
      progress: 0,
      dependencies: [],
      risks: [],
      reviewNotes: "",
    });

    await milestoneRepository.create({
      title: "First automatic transfer",
      description: "",
      pillarIds: ["personal"],
      parentType: "project",
      parentId: project.id,
      dueDate: null,
      milestoneStatus: "upcoming",
      progress: 0,
      dependencies: [],
      evidence: "",
    });

    await roadmapRepository.create({
      title: "Savings roadmap",
      description: "",
      pillarIds: ["personal"],
      roadmapKind: "goal",
      linkedGoalId: goal.id,
      linkedProjectId: null,
      startDate: null,
      endDate: null,
      roadmapStatus: "active",
      progress: 0,
      phases: [],
      notes: "",
    });

    // An orphan goal with no parent plan.
    await goalRepository.create({
      title: "Unfiled idea",
      description: "",
      pillarIds: ["personal"],
      parentPlanId: null,
      startDate: null,
      targetDate: null,
      goalStatus: "not-started",
      priority: "low",
      progress: 0,
      measurementType: "binary",
      targetValue: null,
      currentValue: null,
      unit: "",
      reviewFrequency: "none",
      notes: "",
    });

    const cascade = buildCascade(await collectSources());

    expect(cascade.roots).toHaveLength(1);
    const fy = cascade.roots[0]!;
    expect(fy.title).toBe("Financial independence");
    const oy = fy.children[0]!;
    expect(oy.title).toBe("Save aggressively");
    const g = oy.children.find((c) => c.kind === "goal")!;
    expect(g.title).toBe("Build a 6-month buffer");
    expect(g.children.map((c) => c.kind).sort()).toEqual(["project", "roadmap"]);
    const p = g.children.find((c) => c.kind === "project")!;
    expect(p.children[0]!.title).toBe("First automatic transfer");

    expect(cascade.unlinked.map((group) => group.kind)).toEqual(["goal"]);
    expect(cascade.unlinked[0]!.nodes[0]!.title).toBe("Unfiled idea");
    expect(cascade.counts).toMatchObject({ nodes: 7, linked: 6, unlinked: 1 });
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await getPlanRepository("five-year").create(planFields("five-year", "Alice plan", null));
    await authService.signOut();

    await signUpFresh("bob");
    const cascade = buildCascade(await collectSources());
    expect(cascade.counts.nodes).toBe(0);
  });
});
