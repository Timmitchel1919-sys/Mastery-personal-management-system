import { describe, expect, it } from "vitest";
import {
  MATRIX_QUADRANTS,
  MATRIX_QUADRANT_META,
  matrixItemCreateSchema,
  matrixItemFormSchema,
  matrixItemInputFromForm,
  matrixItemSchema,
  matrixItemUpdateSchema,
  type MatrixItemFormValues,
} from "./schema";

const full = {
  title: "Reply to the auditor",
  quadrant: "do" as const,
  note: "Deadline Friday.",
  goalId: null,
  projectId: null,
  pillarIds: ["societal" as const],
  completed: false,
};

describe("matrixItemCreateSchema", () => {
  it("accepts a fully specified item", () => {
    expect(matrixItemCreateSchema.parse(full).title).toBe("Reply to the auditor");
  });

  it("requires a title", () => {
    expect(matrixItemCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(matrixItemCreateSchema.safeParse({ quadrant: "do" }).success).toBe(false);
  });

  it("rejects an unknown quadrant", () => {
    expect(matrixItemCreateSchema.safeParse({ ...full, quadrant: "later" }).success).toBe(false);
  });

  it("caps pillars at three and allows none", () => {
    expect(
      matrixItemCreateSchema.safeParse({
        ...full,
        pillarIds: ["spiritual", "personal", "societal", "personal"],
      }).success,
    ).toBe(false);
    expect(matrixItemCreateSchema.safeParse({ ...full, pillarIds: [] }).success).toBe(true);
  });
});

describe("matrixItemUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(matrixItemUpdateSchema.safeParse({}).success).toBe(true);
    expect(matrixItemUpdateSchema.safeParse({ quadrant: "schedule" }).success).toBe(true);
    expect(matrixItemUpdateSchema.safeParse({ completed: "yes" }).success).toBe(false);
  });
});

describe("matrixItemFormSchema + matrixItemInputFromForm", () => {
  const form: MatrixItemFormValues = {
    title: "Draft the newsletter",
    quadrant: "schedule",
    note: "",
    goalId: "",
    projectId: "project-1",
    pillarIds: ["personal"],
    completed: false,
  };

  it("requires a title on the form shape", () => {
    expect(matrixItemFormSchema.safeParse({ ...form, title: "" }).success).toBe(false);
    expect(matrixItemFormSchema.safeParse(form).success).toBe(true);
  });

  it("maps blank links to null and keeps the rest", () => {
    const input = matrixItemInputFromForm(form);
    expect(input.goalId).toBeNull();
    expect(input.projectId).toBe("project-1");
    expect(input.quadrant).toBe("schedule");
    expect(matrixItemCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("MATRIX_QUADRANT_META", () => {
  it("covers every quadrant with an urgent/important flag pair", () => {
    for (const quadrant of MATRIX_QUADRANTS) {
      const meta = MATRIX_QUADRANT_META[quadrant];
      expect(typeof meta.label).toBe("string");
      expect(typeof meta.urgent).toBe("boolean");
      expect(typeof meta.important).toBe("boolean");
    }
    expect(MATRIX_QUADRANT_META.do).toMatchObject({ urgent: true, important: true });
    expect(MATRIX_QUADRANT_META.eliminate).toMatchObject({ urgent: false, important: false });
  });
});

describe("matrixItemSchema", () => {
  it("validates a stored record", () => {
    const record = matrixItemSchema.parse({
      id: "m1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.quadrant).toBe("do");
  });
});
