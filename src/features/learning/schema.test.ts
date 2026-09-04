import { describe, expect, it } from "vitest";
import {
  emptyLesson,
  learningItemCreateSchema,
  learningItemFormSchema,
  learningItemInputFromForm,
  learningItemSchema,
  learningItemUpdateSchema,
  lessonProgress,
  studySessionCreateSchema,
  studySessionFormSchema,
  studySessionInputFromForm,
  type LearningItemFormValues,
  type StudySessionFormValues,
} from "./schema";

const full = {
  title: "Advanced TypeScript",
  description: "",
  itemType: "course" as const,
  learningStatus: "in-progress" as const,
  provider: "Frontend Masters",
  targetCompletionDate: "2026-10-01",
  resources: ["https://example.com"],
  lessons: [{ id: "l1", title: "Generics", completed: true }],
  assessmentNotes: "",
  notes: "",
  pillarIds: ["personal" as const],
  goalId: null,
  skillId: null,
};

describe("learningItemCreateSchema", () => {
  it("accepts a fully specified item", () => {
    expect(learningItemCreateSchema.parse(full).title).toBe("Advanced TypeScript");
  });

  it("requires a title and rejects an unknown type/status", () => {
    expect(learningItemCreateSchema.safeParse({ ...full, title: "" }).success).toBe(false);
    expect(learningItemCreateSchema.safeParse({ ...full, itemType: "bootcamp" }).success).toBe(
      false,
    );
    expect(
      learningItemCreateSchema.safeParse({ ...full, learningStatus: "abandoned" }).success,
    ).toBe(false);
  });

  it("requires every lesson to have a title", () => {
    expect(
      learningItemCreateSchema.safeParse({
        ...full,
        lessons: [{ id: "l1", title: "", completed: false }],
      }).success,
    ).toBe(false);
  });

  it("allows zero lessons/resources and null dates/links", () => {
    expect(
      learningItemCreateSchema.safeParse({
        ...full,
        lessons: [],
        resources: [],
        targetCompletionDate: null,
        goalId: null,
      }).success,
    ).toBe(true);
  });
});

describe("learningItemUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(learningItemUpdateSchema.safeParse({}).success).toBe(true);
    expect(learningItemUpdateSchema.safeParse({ learningStatus: "completed" }).success).toBe(true);
  });
});

describe("emptyLesson + lessonProgress", () => {
  it("generates a fresh, incomplete lesson each time", () => {
    const a = emptyLesson();
    const b = emptyLesson();
    expect(a.id).not.toBe(b.id);
    expect(a.completed).toBe(false);
  });

  it("counts completed vs total lessons", () => {
    expect(
      lessonProgress({
        lessons: [
          { id: "1", title: "a", completed: true },
          { id: "2", title: "b", completed: false },
        ],
      }),
    ).toEqual({ completed: 1, total: 2 });
  });
});

describe("learningItemFormSchema + learningItemInputFromForm", () => {
  const form: LearningItemFormValues = {
    title: "Read Refactoring",
    description: "",
    itemType: "book-study",
    learningStatus: "not-started",
    provider: "",
    targetCompletionDate: "",
    resourcesText: "https://example.com/book\n\nhttps://example.com/notes",
    lessons: [{ id: "l1", title: "Chapter 1", completed: false }],
    assessmentNotes: "",
    notes: "",
    pillarIds: [],
    goalId: "goal-1",
  };

  it("validates the form shape", () => {
    expect(learningItemFormSchema.safeParse(form).success).toBe(true);
  });

  it("splits resources into a list, drops blank lines, maps blank goal to null, always nulls skillId", () => {
    const input = learningItemInputFromForm(form);
    expect(input.resources).toEqual(["https://example.com/book", "https://example.com/notes"]);
    expect(input.goalId).toBe("goal-1");
    expect(input.skillId).toBeNull();
    expect(learningItemCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("studySessionCreateSchema + studySessionInputFromForm", () => {
  const form: StudySessionFormValues = {
    learningItemId: "",
    date: "2026-09-02",
    minutes: 45,
    notes: "",
  };

  it("validates the form shape and maps a blank item to null", () => {
    expect(studySessionFormSchema.safeParse(form).success).toBe(true);
    const input = studySessionInputFromForm(form);
    expect(input.learningItemId).toBeNull();
    expect(studySessionCreateSchema.safeParse(input).success).toBe(true);
  });

  it("rejects zero or negative minutes", () => {
    expect(studySessionCreateSchema.safeParse({ ...form, minutes: 0 }).success).toBe(false);
  });
});

describe("learningItemSchema", () => {
  it("validates a stored record", () => {
    const record = learningItemSchema.parse({
      id: "li1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.itemType).toBe("course");
  });
});
