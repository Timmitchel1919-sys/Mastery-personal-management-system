import { describe, expect, it } from "vitest";
import { studyMinutesForItem, summarizeLearning } from "./learning-stats";
import type { LearningItem, StudySession } from "./schema";

function makeItem(over: Partial<LearningItem> & Pick<LearningItem, "id">): LearningItem {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: "Item",
    description: "",
    itemType: "course",
    learningStatus: over.learningStatus ?? "not-started",
    provider: "",
    targetCompletionDate: null,
    resources: [],
    lessons: [],
    assessmentNotes: "",
    notes: "",
    pillarIds: [],
    goalId: null,
    skillId: null,
  };
}

function makeSession(over: Partial<StudySession> & Pick<StudySession, "id">): StudySession {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    learningItemId: over.learningItemId ?? null,
    date: over.date ?? "2026-09-01",
    minutes: over.minutes ?? 30,
    notes: "",
  };
}

describe("summarizeLearning", () => {
  it("returns zeros for no items or sessions", () => {
    expect(summarizeLearning([], [], "2026-09-10")).toEqual({
      totalItems: 0,
      inProgress: 0,
      completed: 0,
      totalStudyMinutes: 0,
      studyMinutesLast7Days: 0,
    });
  });

  it("counts in-progress/completed items and splits study minutes by recency", () => {
    const stats = summarizeLearning(
      [
        makeItem({ id: "a", learningStatus: "in-progress" }),
        makeItem({ id: "b", learningStatus: "completed" }),
        makeItem({ id: "c", learningStatus: "not-started" }),
      ],
      [
        makeSession({ id: "s1", date: "2026-09-09", minutes: 20 }),
        makeSession({ id: "s2", date: "2026-08-01", minutes: 50 }),
      ],
      "2026-09-10",
    );
    expect(stats.totalItems).toBe(3);
    expect(stats.inProgress).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.totalStudyMinutes).toBe(70);
    expect(stats.studyMinutesLast7Days).toBe(20);
  });
});

describe("studyMinutesForItem", () => {
  it("sums only sessions linked to the given item", () => {
    const sessions = [
      makeSession({ id: "s1", learningItemId: "a", minutes: 20 }),
      makeSession({ id: "s2", learningItemId: "a", minutes: 10 }),
      makeSession({ id: "s3", learningItemId: "b", minutes: 99 }),
      makeSession({ id: "s4", learningItemId: null, minutes: 5 }),
    ];
    expect(studyMinutesForItem(sessions, "a")).toBe(30);
    expect(studyMinutesForItem(sessions, "b")).toBe(99);
    expect(studyMinutesForItem(sessions, "missing")).toBe(0);
  });
});
