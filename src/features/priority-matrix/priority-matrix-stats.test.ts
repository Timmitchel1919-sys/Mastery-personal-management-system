import { describe, expect, it } from "vitest";
import { summarizeMatrix } from "./priority-matrix-stats";
import type { MatrixItem } from "./schema";

function makeItem(over: Partial<MatrixItem> & Pick<MatrixItem, "id">): MatrixItem {
  return {
    id: over.id,
    status: "active",
    version: 1,
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
    createdBy: "u1",
    updatedBy: "u1",
    archivedAt: null,
    title: over.title ?? "Item",
    quadrant: over.quadrant ?? "do",
    note: over.note ?? "",
    goalId: over.goalId ?? null,
    projectId: over.projectId ?? null,
    pillarIds: over.pillarIds ?? [],
    completed: over.completed ?? false,
  };
}

describe("summarizeMatrix", () => {
  it("returns zeros for an empty list", () => {
    expect(summarizeMatrix([])).toEqual({
      total: 0,
      completed: 0,
      open: 0,
      openByQuadrant: { do: 0, schedule: 0, delegate: 0, eliminate: 0 },
    });
  });

  it("counts open items per quadrant and completed separately", () => {
    const stats = summarizeMatrix([
      makeItem({ id: "a", quadrant: "do" }),
      makeItem({ id: "b", quadrant: "do", completed: true }),
      makeItem({ id: "c", quadrant: "schedule" }),
      makeItem({ id: "d", quadrant: "eliminate" }),
    ]);
    expect(stats).toEqual({
      total: 4,
      completed: 1,
      open: 3,
      openByQuadrant: { do: 1, schedule: 1, delegate: 0, eliminate: 1 },
    });
  });
});
