import { describe, expect, it } from "vitest";
import { conflictedBlockCount, detectConflicts } from "./detect-conflicts";
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

describe("detectConflicts", () => {
  it("does not flag back-to-back blocks", () => {
    const map = detectConflicts([
      makeBlock({
        id: "a",
        startDateTime: "2026-09-02T09:00:00Z",
        endDateTime: "2026-09-02T10:00:00Z",
      }),
      makeBlock({
        id: "b",
        startDateTime: "2026-09-02T10:00:00Z",
        endDateTime: "2026-09-02T11:00:00Z",
      }),
    ]);
    expect(map.size).toBe(0);
  });

  it("flags an overlap on both blocks", () => {
    const map = detectConflicts([
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
    expect(map.get("a")).toEqual(["b"]);
    expect(map.get("b")).toEqual(["a"]);
    expect(conflictedBlockCount(map)).toBe(2);
  });

  it("handles a three-way overlap", () => {
    const map = detectConflicts([
      makeBlock({
        id: "a",
        startDateTime: "2026-09-02T09:00:00Z",
        endDateTime: "2026-09-02T12:00:00Z",
      }),
      makeBlock({
        id: "b",
        startDateTime: "2026-09-02T10:00:00Z",
        endDateTime: "2026-09-02T11:00:00Z",
      }),
      makeBlock({
        id: "c",
        startDateTime: "2026-09-02T11:30:00Z",
        endDateTime: "2026-09-02T13:00:00Z",
      }),
    ]);
    expect(map.get("a")).toEqual(["b", "c"]);
    expect(map.get("b")).toEqual(["a"]);
    expect(map.get("c")).toEqual(["a"]);
  });

  it("ignores skipped blocks", () => {
    const map = detectConflicts([
      makeBlock({
        id: "a",
        startDateTime: "2026-09-02T09:00:00Z",
        endDateTime: "2026-09-02T10:30:00Z",
      }),
      makeBlock({
        id: "b",
        startDateTime: "2026-09-02T10:00:00Z",
        endDateTime: "2026-09-02T11:00:00Z",
        blockStatus: "skipped",
      }),
    ]);
    expect(map.size).toBe(0);
  });

  it("compares instants across time zones", () => {
    // A: 09:00–11:00 Amsterdam (+02:00) = 07:00–09:00 UTC
    const a = makeBlock({
      id: "a",
      timeZone: "Europe/Amsterdam",
      startDateTime: "2026-09-02T09:00:00+02:00",
      endDateTime: "2026-09-02T11:00:00+02:00",
    });
    // B: 08:30–09:30 UTC → overlaps A between 08:30 and 09:00 UTC
    const b = makeBlock({
      id: "b",
      startDateTime: "2026-09-02T08:30:00Z",
      endDateTime: "2026-09-02T09:30:00Z",
    });
    // C: 12:00–13:00 Amsterdam = 10:00–11:00 UTC → clear of both A and B
    const c = makeBlock({
      id: "c",
      timeZone: "Europe/Amsterdam",
      startDateTime: "2026-09-02T12:00:00+02:00",
      endDateTime: "2026-09-02T13:00:00+02:00",
    });
    const map = detectConflicts([a, b, c]);
    expect(map.get("a")).toEqual(["b"]);
    expect(map.get("b")).toEqual(["a"]);
    expect(map.has("c")).toBe(false);
  });
});
