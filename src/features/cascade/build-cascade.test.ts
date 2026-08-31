import { describe, expect, it } from "vitest";
import type { PlanHorizon } from "@/features/plans";
import type { Goal } from "@/features/goals";
import type { Project } from "@/features/projects";
import type { Milestone } from "@/features/milestones";
import type { Roadmap } from "@/features/roadmaps";
import { buildCascade, type CascadeInput, type CascadeNode } from "./build-cascade";

const audit = {
  status: "active" as const,
  version: 1,
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
};

function plan(id: string, horizon: PlanHorizon, parentId: string | null = null) {
  return {
    id,
    ...audit,
    horizon,
    title: `${horizon} ${id}`,
    objective: "x",
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

function goal(id: string, parentPlanId: string | null): Goal {
  return {
    id,
    ...audit,
    title: `goal ${id}`,
    description: "",
    pillarIds: ["personal"],
    parentPlanId,
    startDate: null,
    targetDate: null,
    goalStatus: "in-progress",
    priority: "medium",
    progress: 0,
    measurementType: "binary",
    targetValue: null,
    currentValue: null,
    unit: "",
    reviewFrequency: "none",
    notes: "",
  };
}

function project(id: string, goalId: string | null): Project {
  return {
    id,
    ...audit,
    title: `project ${id}`,
    description: "",
    expectedOutcome: "",
    pillarIds: ["personal"],
    goalId,
    owner: "",
    startDate: null,
    endDate: null,
    projectStatus: "active",
    priority: "medium",
    progress: 0,
    dependencies: [],
    risks: [],
    reviewNotes: "",
  };
}

function milestone(
  id: string,
  parentType: Milestone["parentType"],
  parentId: string | null,
): Milestone {
  return {
    id,
    ...audit,
    title: `milestone ${id}`,
    description: "",
    pillarIds: ["personal"],
    parentType,
    parentId,
    dueDate: null,
    milestoneStatus: "upcoming",
    progress: 0,
    dependencies: [],
    evidence: "",
  };
}

function roadmap(id: string, linkedGoalId: string | null, linkedProjectId: string | null): Roadmap {
  return {
    id,
    ...audit,
    title: `roadmap ${id}`,
    description: "",
    pillarIds: ["personal"],
    roadmapKind: "goal",
    linkedGoalId,
    linkedProjectId,
    startDate: null,
    endDate: null,
    roadmapStatus: "active",
    progress: 0,
    phases: [],
    notes: "",
  };
}

function emptyInput(): CascadeInput {
  return {
    plansByHorizon: { "five-year": [], "one-year": [], quarter: [], month: [], week: [] },
    goals: [],
    projects: [],
    milestones: [],
    roadmaps: [],
  };
}

function findByTitle(nodes: CascadeNode[], title: string): CascadeNode | undefined {
  for (const node of nodes) {
    if (node.title === title) return node;
    const nested = findByTitle(node.children, title);
    if (nested) return nested;
  }
  return undefined;
}

describe("buildCascade", () => {
  it("nests plan tiers, goals, projects, milestones, and roadmaps into one chain", () => {
    const input = emptyInput();
    input.plansByHorizon["five-year"] = [plan("fy", "five-year")];
    input.plansByHorizon["one-year"] = [plan("oy", "one-year", "fy")];
    input.goals = [goal("g1", "oy")];
    input.projects = [project("p1", "g1")];
    input.milestones = [milestone("m1", "project", "p1")];
    input.roadmaps = [roadmap("r1", "g1", null)];

    const { roots, unlinked, counts } = buildCascade(input);

    expect(roots).toHaveLength(1);
    const fy = roots[0]!;
    expect(fy.title).toBe("five-year fy");
    const oy = fy.children[0]!;
    expect(oy.title).toBe("one-year oy");
    const g1 = oy.children[0]!;
    expect(g1.kind).toBe("goal");
    // goal has both a project and a roadmap child
    expect(g1.children.map((c) => c.kind).sort()).toEqual(["project", "roadmap"]);
    const p1 = findByTitle(roots, "project p1")!;
    expect(p1.children[0]!.title).toBe("milestone m1");

    expect(unlinked).toHaveLength(0);
    expect(counts).toMatchObject({ nodes: 6, linked: 6, unlinked: 0 });
  });

  it("groups records with no parent under 'not yet linked'", () => {
    const input = emptyInput();
    input.goals = [goal("g1", null)];
    input.projects = [project("p1", null)];
    input.milestones = [milestone("m1", "none", null)];
    input.roadmaps = [roadmap("r1", null, null)];

    const { roots, unlinked, counts } = buildCascade(input);

    expect(roots).toHaveLength(0);
    expect(unlinked.map((group) => group.kind)).toEqual([
      "goal",
      "project",
      "milestone",
      "roadmap",
    ]);
    expect(counts.unlinked).toBe(4);
    expect(counts.linked).toBe(0);
  });

  it("flags a plan whose parent id no longer resolves", () => {
    const input = emptyInput();
    input.plansByHorizon["one-year"] = [plan("oy", "one-year", "missing")];

    const { roots } = buildCascade(input);
    expect(roots[0]!.danglingParent).toBe(true);
  });

  it("flags a project pointing at a missing goal and still lists it as unlinked", () => {
    const input = emptyInput();
    input.projects = [project("p1", "ghost-goal")];

    const { unlinked } = buildCascade(input);
    const projectGroup = unlinked.find((group) => group.kind === "project");
    expect(projectGroup?.nodes[0]?.danglingParent).toBe(true);
  });

  it("prefers a roadmap's linked goal over its linked project", () => {
    const input = emptyInput();
    input.goals = [goal("g1", null)];
    input.projects = [project("p1", null)];
    input.roadmaps = [roadmap("r1", "g1", "p1")];

    const { unlinked } = buildCascade(input);
    const g1 = unlinked.find((group) => group.kind === "goal")?.nodes[0];
    expect(g1?.children[0]?.title).toBe("roadmap r1");
  });
});
