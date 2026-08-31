import { describe, expect, it } from "vitest";
import {
  roadmapCreateSchema,
  roadmapFormSchema,
  roadmapInputFromForm,
  roadmapSchema,
  roadmapUpdateSchema,
  type RoadmapFormValues,
} from "./schema";

const fullRoadmap = {
  title: "Become fluent in Spanish",
  description: "A year-long learning roadmap.",
  pillarIds: ["personal"],
  roadmapKind: "learning" as const,
  linkedGoalId: null,
  linkedProjectId: null,
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  roadmapStatus: "active" as const,
  progress: 15,
  phases: [
    {
      name: "Foundations",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      phaseStatus: "done" as const,
    },
    {
      name: "Conversation",
      startDate: "2026-04-01",
      endDate: null,
      phaseStatus: "in-progress" as const,
    },
  ],
  notes: "",
};

describe("roadmapCreateSchema", () => {
  it("accepts a fully specified roadmap", () => {
    const parsed = roadmapCreateSchema.parse(fullRoadmap);
    expect(parsed.title).toBe("Become fluent in Spanish");
    expect(parsed.phases).toHaveLength(2);
  });

  it("requires the core fields", () => {
    expect(roadmapCreateSchema.safeParse({ title: "x", pillarIds: ["personal"] }).success).toBe(
      false,
    );
  });

  it("accepts an empty phases list and null dates", () => {
    expect(
      roadmapCreateSchema.safeParse({
        ...fullRoadmap,
        phases: [],
        startDate: null,
        endDate: null,
      }).success,
    ).toBe(true);
  });

  it("enforces roadmap and phase date ordering", () => {
    expect(
      roadmapCreateSchema.safeParse({
        ...fullRoadmap,
        startDate: "2026-12-31",
        endDate: "2026-01-01",
      }).success,
    ).toBe(false);
    expect(
      roadmapCreateSchema.safeParse({
        ...fullRoadmap,
        phases: [
          {
            name: "Bad phase",
            startDate: "2026-06-01",
            endDate: "2026-05-01",
            phaseStatus: "upcoming",
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("enforces progress bounds, phase count, and known enums", () => {
    expect(roadmapCreateSchema.safeParse({ ...fullRoadmap, progress: 150 }).success).toBe(false);
    expect(
      roadmapCreateSchema.safeParse({
        ...fullRoadmap,
        phases: Array.from({ length: 25 }, (_, i) => ({
          name: `Phase ${i}`,
          startDate: null,
          endDate: null,
          phaseStatus: "upcoming" as const,
        })),
      }).success,
    ).toBe(false);
    expect(roadmapCreateSchema.safeParse({ ...fullRoadmap, roadmapKind: "chore" }).success).toBe(
      false,
    );
    expect(roadmapCreateSchema.safeParse({ ...fullRoadmap, roadmapStatus: "paused" }).success).toBe(
      false,
    );
  });
});

describe("roadmapUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(roadmapUpdateSchema.safeParse({}).success).toBe(true);
    expect(roadmapUpdateSchema.safeParse({ progress: 80, roadmapStatus: "complete" }).success).toBe(
      true,
    );
    expect(roadmapUpdateSchema.safeParse({ progress: -1 }).success).toBe(false);
  });
});

describe("roadmapFormSchema + roadmapInputFromForm", () => {
  const formValues: RoadmapFormValues = {
    title: "Ship the app",
    description: "",
    pillarIds: ["personal"],
    roadmapKind: "project",
    linkedGoalId: "",
    linkedProjectId: "project-1",
    startDate: "",
    endDate: "",
    roadmapStatus: "planning",
    progress: 0,
    phases: [{ name: "Design", startDate: "", endDate: "", phaseStatus: "upcoming" }],
    notes: "",
  };

  it("accepts empty date strings", () => {
    expect(roadmapFormSchema.safeParse(formValues).success).toBe(true);
  });

  it("maps blank links / dates to null and keeps phase structure", () => {
    const input = roadmapInputFromForm(formValues);
    expect(input.linkedGoalId).toBeNull();
    expect(input.linkedProjectId).toBe("project-1");
    expect(input.startDate).toBeNull();
    expect(input.phases[0]).toEqual({
      name: "Design",
      startDate: null,
      endDate: null,
      phaseStatus: "upcoming",
    });
    expect(roadmapCreateSchema.safeParse(input).success).toBe(true);
  });
});

describe("roadmapSchema", () => {
  it("validates a stored record", () => {
    const record = roadmapSchema.parse({
      id: "r1",
      ...fullRoadmap,
      status: "active",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      updatedAt: "2026-08-30T00:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.roadmapKind).toBe("learning");
  });
});
