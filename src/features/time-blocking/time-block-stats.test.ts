import { describe, expect, it } from "vitest";
import { summarizeTimeBlocks } from "./time-block-stats";
import type { TimeBlock } from "./schema";

function makeBlock(over: Partial<TimeBlock> & Pick<TimeBlock, "id">): TimeBlock {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-02T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? "Block",
    category: over.category ?? "deep-work",
    timeZone: over.timeZone ?? "UTC",
    startDateTime: over.startDateTime ?? "2026-09-02T09:00:00Z",
    endDateTime: over.endDateTime ?? "2026-09-02T10:00:00Z",
    pillarIds: over.pillarIds ?? [],
    goalId: over.goalId ?? null,
    projectId: over.projectId ?? null,
    notes: over.notes ?? "",
    blockStatus: over.blockStatus ?? "planned",
  };
}

describe("summarizeTimeBlocks", () => {
  it("returns zeros for an empty list", () => {
    expect(summarizeTimeBlocks([])).toEqual({
      blocks: 0,
      planned: 0,
      done: 0,
      skipped: 0,
      scheduledMinutes: 0,
      completedMinutes: 0,
      conflictedBlocks: 0,
    });
  });

  it("counts planned + done minutes as scheduled and done minutes as completed", () => {
    const stats = summarizeTimeBlocks([
      makeBlock({
        id: "a",
        startDateTime: "2026-09-02T09:00:00Z",
        endDateTime: "2026-09-02T10:00:00Z",
        blockStatus: "planned",
      }),
      makeBlock({
        id: "b",
        startDateTime: "2026-09-02T11:00:00Z",
        endDateTime: "2026-09-02T11:30:00Z",
        blockStatus: "done",
      }),
      makeBlock({
        id: "c",
        startDateTime: "2026-09-02T12:00:00Z",
        endDateTime: "2026-09-02T13:00:00Z",
        blockStatus: "skipped",
      }),
    ]);
    expect(stats).toMatchObject({
      blocks: 3,
      planned: 1,
      done: 1,
      skipped: 1,
      scheduledMinutes: 90,
      completedMinutes: 30,
      conflictedBlocks: 0,
    });
  });

  it("reports the number of blocks in conflict", () => {
    const stats = summarizeTimeBlocks([
      makeBlock({
        id: "a",
        startDateTime: "2026-09-02T09:00:00Z",
        endDateTime: "2026-09-02T10:30:00Z",
      }),
      makeBlock({
        id: "b",
        startDateTime: "2026-09-02T10:00:00Z",
        endDateTime: "2026-09-02T11:00:00Z",
      }),
    ]);
    expect(stats.conflictedBlocks).toBe(2);
  });
});
