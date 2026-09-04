import { describe, expect, it } from "vitest";
import {
  currentProficiency,
  progressToTarget,
  skillCreateSchema,
  skillFormSchema,
  skillInputFromForm,
  skillReviewCreateSchema,
  skillReviewFormSchema,
  skillReviewInputFromForm,
  skillSchema,
  skillUpdateSchema,
  type SkillFormValues,
  type SkillReviewFormValues,
} from "./schema";

const full = {
  title: "Public speaking",
  description: "",
  category: "interpersonal" as const,
  startingProficiency: 2,
  targetProficiency: 4,
  practicePlan: "",
  evidence: [],
  resources: [],
  goalId: null,
  pillarIds: ["societal" as const],
  nextReviewDate: null,
};

describe("skillCreateSchema", () => {
  it("accepts a fully specified skill", () => {
    expect(skillCreateSchema.parse(full).title).toBe("Public speaking");
  });

  it("requires a title and rejects an unknown category", () => {
    expect(skillCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(skillCreateSchema.safeParse({ ...full, category: "magic" }).success).toBe(false);
  });

  it("rejects proficiency outside 1-5", () => {
    expect(skillCreateSchema.safeParse({ ...full, startingProficiency: 0 }).success).toBe(false);
    expect(skillCreateSchema.safeParse({ ...full, targetProficiency: 6 }).success).toBe(false);
  });
});

describe("skillUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(skillUpdateSchema.safeParse({}).success).toBe(true);
    expect(skillUpdateSchema.safeParse({ targetProficiency: 5 }).success).toBe(true);
  });
});

describe("skillSchema", () => {
  it("validates a stored record", () => {
    const record = skillSchema.parse({
      id: "s1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.category).toBe("interpersonal");
  });
});

describe("skillFormSchema + skillInputFromForm", () => {
  const form: SkillFormValues = {
    title: "Public speaking",
    description: "",
    category: "interpersonal",
    startingProficiency: 2,
    targetProficiency: 4,
    practicePlan: "",
    evidenceText: "Gave a talk at work\n\nRan a workshop",
    resourcesText: "https://example.com/course",
    goalId: "goal-1",
    pillarIds: [],
    nextReviewDate: "2026-10-01",
  };

  it("validates the form shape", () => {
    expect(skillFormSchema.safeParse(form).success).toBe(true);
  });

  it("splits evidence/resources into lists, drops blank lines, maps blank goal/date to null", () => {
    const input = skillInputFromForm(form);
    expect(input.evidence).toEqual(["Gave a talk at work", "Ran a workshop"]);
    expect(input.resources).toEqual(["https://example.com/course"]);
    expect(input.goalId).toBe("goal-1");
    expect(input.nextReviewDate).toBe("2026-10-01");
    expect(skillCreateSchema.safeParse(input).success).toBe(true);

    const blank = skillInputFromForm({ ...form, goalId: "", nextReviewDate: "" });
    expect(blank.goalId).toBeNull();
    expect(blank.nextReviewDate).toBeNull();
  });
});

describe("skillReviewCreateSchema + skillReviewInputFromForm", () => {
  const form: SkillReviewFormValues = { date: "2026-09-02", proficiency: 3, notes: "" };

  it("validates the form shape and attaches the skillId", () => {
    expect(skillReviewFormSchema.safeParse(form).success).toBe(true);
    const input = skillReviewInputFromForm("skill-1", form);
    expect(input).toEqual({ skillId: "skill-1", date: "2026-09-02", proficiency: 3, notes: "" });
    expect(skillReviewCreateSchema.safeParse(input).success).toBe(true);
  });

  it("rejects proficiency outside 1-5", () => {
    expect(
      skillReviewCreateSchema.safeParse({ ...form, skillId: "s1", proficiency: 6 }).success,
    ).toBe(false);
  });
});

describe("currentProficiency", () => {
  const skill = { startingProficiency: 2 };

  it("falls back to the starting proficiency with no reviews", () => {
    expect(currentProficiency(skill, [])).toBe(2);
  });

  it("uses the latest review by date, regardless of array order", () => {
    const reviews = [
      { date: "2026-09-01", proficiency: 3 },
      { date: "2026-09-10", proficiency: 4 },
      { date: "2026-09-05", proficiency: 3 },
    ];
    expect(currentProficiency(skill, reviews)).toBe(4);
  });
});

describe("progressToTarget", () => {
  it("returns 0-100 scaled from starting proficiency toward the target", () => {
    const skill = { startingProficiency: 2, targetProficiency: 4 };
    expect(progressToTarget(skill, [])).toBe(50);
    expect(progressToTarget(skill, [{ date: "2026-09-01", proficiency: 4 }])).toBe(100);
  });

  it("clamps at 100 when current exceeds target", () => {
    const skill = { startingProficiency: 2, targetProficiency: 3 };
    expect(progressToTarget(skill, [{ date: "2026-09-01", proficiency: 5 }])).toBe(100);
  });
});
