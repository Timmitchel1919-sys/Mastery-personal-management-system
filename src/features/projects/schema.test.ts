import { describe, expect, it } from "vitest";
import {
  projectCreateSchema,
  projectFormSchema,
  projectInputFromForm,
  projectSchema,
  projectUpdateSchema,
  type ProjectFormValues,
} from "./schema";

const fullProject = {
  title: "Launch personal site",
  description: "Design, build, and ship a portfolio site.",
  expectedOutcome: "A live site at my domain.",
  pillarIds: ["personal"],
  goalId: null,
  owner: "Me",
  startDate: "2026-01-01",
  endDate: "2026-03-31",
  projectStatus: "active",
  priority: "high",
  progress: 25,
  dependencies: ["Domain purchased"],
  risks: ["Scope creep"],
  reviewNotes: "",
};

describe("projectCreateSchema", () => {
  it("accepts a fully specified project", () => {
    const parsed = projectCreateSchema.parse(fullProject);
    expect(parsed.title).toBe("Launch personal site");
    expect(parsed.dependencies).toEqual(["Domain purchased"]);
  });

  it("requires the core fields", () => {
    expect(projectCreateSchema.safeParse({ title: "x", pillarIds: ["personal"] }).success).toBe(
      false,
    );
  });

  it("allows null goal and null dates but not an empty date string", () => {
    expect(
      projectCreateSchema.safeParse({
        ...fullProject,
        goalId: null,
        startDate: null,
        endDate: null,
      }).success,
    ).toBe(true);
    expect(projectCreateSchema.safeParse({ ...fullProject, startDate: "" }).success).toBe(false);
  });

  it("enforces end >= start, progress bounds, list length, and known enums", () => {
    expect(
      projectCreateSchema.safeParse({
        ...fullProject,
        startDate: "2026-07-01",
        endDate: "2026-01-01",
      }).success,
    ).toBe(false);
    expect(projectCreateSchema.safeParse({ ...fullProject, progress: 150 }).success).toBe(false);
    expect(
      projectCreateSchema.safeParse({
        ...fullProject,
        risks: Array.from({ length: 31 }, (_, i) => `risk ${i}`),
      }).success,
    ).toBe(false);
    expect(projectCreateSchema.safeParse({ ...fullProject, projectStatus: "paused" }).success).toBe(
      false,
    );
    expect(projectCreateSchema.safeParse({ ...fullProject, priority: "urgent" }).success).toBe(
      false,
    );
  });
});

describe("projectUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(projectUpdateSchema.safeParse({}).success).toBe(true);
    expect(projectUpdateSchema.safeParse({ progress: 60, projectStatus: "complete" }).success).toBe(
      true,
    );
    expect(projectUpdateSchema.safeParse({ progress: -1 }).success).toBe(false);
  });
});

describe("projectFormSchema + projectInputFromForm", () => {
  const formValues: ProjectFormValues = {
    title: "Write a book",
    description: "",
    expectedOutcome: "",
    pillarIds: ["personal"],
    goalId: "",
    owner: "",
    startDate: "",
    endDate: "",
    projectStatus: "planned",
    priority: "medium",
    progress: 0,
    dependencies: [],
    risks: [],
    reviewNotes: "",
  };

  it("accepts empty date strings", () => {
    expect(projectFormSchema.safeParse(formValues).success).toBe(true);
  });

  it("maps blank goal / dates to null", () => {
    const input = projectInputFromForm(formValues);
    expect(input.goalId).toBeNull();
    expect(input.startDate).toBeNull();
    expect(input.endDate).toBeNull();
    expect(projectCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("projectSchema", () => {
  it("validates a stored record", () => {
    const record = projectSchema.parse({
      id: "p1",
      ...fullProject,
      status: "active",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      updatedAt: "2026-08-30T00:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.priority).toBe("high");
  });
});
