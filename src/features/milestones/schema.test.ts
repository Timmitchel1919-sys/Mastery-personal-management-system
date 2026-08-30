import { describe, expect, it } from "vitest";
import {
  milestoneCreateSchema,
  milestoneFormSchema,
  milestoneInputFromForm,
  milestoneSchema,
  milestoneUpdateSchema,
  type MilestoneFormValues,
} from "./schema";

const fullMilestone = {
  title: "First 5k without stopping",
  description: "Baseline fitness checkpoint.",
  pillarIds: ["personal"],
  parentType: "goal" as const,
  parentId: "goal-1",
  dueDate: "2026-02-15",
  milestoneStatus: "in-progress" as const,
  progress: 40,
  dependencies: ["New running shoes"],
  evidence: "",
};

describe("milestoneCreateSchema", () => {
  it("accepts a fully specified milestone", () => {
    const parsed = milestoneCreateSchema.parse(fullMilestone);
    expect(parsed.title).toBe("First 5k without stopping");
    expect(parsed.parentId).toBe("goal-1");
  });

  it("requires the core fields", () => {
    expect(milestoneCreateSchema.safeParse({ title: "x", pillarIds: ["personal"] }).success).toBe(
      false,
    );
  });

  it("requires a parentId when linked and forbids one when standalone", () => {
    expect(
      milestoneCreateSchema.safeParse({ ...fullMilestone, parentType: "goal", parentId: null })
        .success,
    ).toBe(false);
    expect(
      milestoneCreateSchema.safeParse({ ...fullMilestone, parentType: "none", parentId: "goal-1" })
        .success,
    ).toBe(false);
    expect(
      milestoneCreateSchema.safeParse({ ...fullMilestone, parentType: "none", parentId: null })
        .success,
    ).toBe(true);
  });

  it("allows a null due date but not an empty date string", () => {
    expect(milestoneCreateSchema.safeParse({ ...fullMilestone, dueDate: null }).success).toBe(true);
    expect(milestoneCreateSchema.safeParse({ ...fullMilestone, dueDate: "" }).success).toBe(false);
  });

  it("enforces progress bounds, list length, and known enums", () => {
    expect(milestoneCreateSchema.safeParse({ ...fullMilestone, progress: 150 }).success).toBe(
      false,
    );
    expect(
      milestoneCreateSchema.safeParse({
        ...fullMilestone,
        dependencies: Array.from({ length: 31 }, (_, i) => `dep ${i}`),
      }).success,
    ).toBe(false);
    expect(
      milestoneCreateSchema.safeParse({ ...fullMilestone, milestoneStatus: "late" }).success,
    ).toBe(false);
    expect(milestoneCreateSchema.safeParse({ ...fullMilestone, parentType: "habit" }).success).toBe(
      false,
    );
  });
});

describe("milestoneUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(milestoneUpdateSchema.safeParse({}).success).toBe(true);
    expect(
      milestoneUpdateSchema.safeParse({ progress: 100, milestoneStatus: "done" }).success,
    ).toBe(true);
    expect(milestoneUpdateSchema.safeParse({ progress: -1 }).success).toBe(false);
  });
});

describe("milestoneFormSchema + milestoneInputFromForm", () => {
  const linkedForm: MilestoneFormValues = {
    title: "Ship v1",
    description: "",
    pillarIds: ["personal"],
    parentType: "project",
    parentId: "project-1",
    dueDate: "",
    milestoneStatus: "upcoming",
    progress: 0,
    dependencies: [],
    evidence: "",
  };

  it("rejects a linked milestone with no parent picked", () => {
    expect(milestoneFormSchema.safeParse({ ...linkedForm, parentId: "" }).success).toBe(false);
  });

  it("maps a standalone form to a null parentId", () => {
    const input = milestoneInputFromForm({
      ...linkedForm,
      parentType: "none",
      parentId: "",
    });
    expect(input.parentId).toBeNull();
    expect(input.dueDate).toBeNull();
    expect(milestoneCreateSchema.safeParse(input).success).toBe(true);
  });

  it("keeps the parentId for a linked form", () => {
    const input = milestoneInputFromForm(linkedForm);
    expect(input.parentId).toBe("project-1");
    expect(milestoneCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("milestoneSchema", () => {
  it("validates a stored record", () => {
    const record = milestoneSchema.parse({
      id: "m1",
      ...fullMilestone,
      status: "active",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      updatedAt: "2026-08-30T00:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.milestoneStatus).toBe("in-progress");
  });
});
