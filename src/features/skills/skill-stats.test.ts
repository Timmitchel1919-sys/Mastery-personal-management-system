import { describe, expect, it } from "vitest";
import { summarizeSkills } from "./skill-stats";
import type { Skill, SkillReview } from "./schema";

function makeSkill(over: Partial<Skill> & Pick<Skill, "id">): Skill {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: "Skill",
    description: "",
    category: "technical",
    startingProficiency: over.startingProficiency ?? 2,
    targetProficiency: over.targetProficiency ?? 4,
    practicePlan: "",
    evidence: [],
    resources: [],
    goalId: null,
    pillarIds: [],
    nextReviewDate: over.nextReviewDate ?? null,
  };
}

function makeReview(over: Partial<SkillReview> & Pick<SkillReview, "id" | "skillId">): SkillReview {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    skillId: over.skillId,
    date: over.date ?? "2026-09-01",
    proficiency: over.proficiency ?? 2,
    notes: "",
  };
}

describe("summarizeSkills", () => {
  it("returns zeros/null average for no skills", () => {
    expect(summarizeSkills([], new Map(), "2026-09-10")).toEqual({
      total: 0,
      dueForReview: 0,
      avgProgressToTarget: null,
    });
  });

  it("counts skills due for review and averages progress toward target", () => {
    const skills = [
      makeSkill({
        id: "a",
        startingProficiency: 2,
        targetProficiency: 4,
        nextReviewDate: "2026-09-05",
      }),
      makeSkill({
        id: "b",
        startingProficiency: 1,
        targetProficiency: 4,
        nextReviewDate: "2026-09-20",
      }),
    ];
    const reviewsBySkill = new Map<string, SkillReview[]>([
      ["a", [makeReview({ id: "r1", skillId: "a", date: "2026-09-04", proficiency: 4 })]],
    ]);

    const stats = summarizeSkills(skills, reviewsBySkill, "2026-09-10");
    expect(stats.total).toBe(2);
    expect(stats.dueForReview).toBe(1);
    // a: 4/4=100%, b: no reviews -> starting 1/4=25% -> avg 62.5 -> rounds to 63
    expect(stats.avgProgressToTarget).toBe(63);
  });
});
