import { describe, expect, it } from "vitest";
import { coachCallResultSchema, coachExchangeSchema } from "./schema";

const full = {
  answer: "Focus on your top goal.",
  assumptions: ["You have a few hours this week"],
  suggestedActions: [{ id: "a1", label: "Block 2h", description: "Schedule deep work" }],
  disclaimers: [],
  influencedBy: [{ collection: "goals", id: "g1", label: "Ship v1" }],
};

describe("coachCallResultSchema", () => {
  it("validates a full callable response", () => {
    const parsed = coachCallResultSchema.parse({
      ...full,
      exchangeId: "e1",
      createdAt: "2026-09-04T10:00:00.000Z",
    });
    expect(parsed.answer).toBe("Focus on your top goal.");
  });

  it("requires a non-empty answer and an exchangeId", () => {
    expect(
      coachCallResultSchema.safeParse({ ...full, answer: "", exchangeId: "e1", createdAt: "x" })
        .success,
    ).toBe(false);
    expect(coachCallResultSchema.safeParse({ ...full, createdAt: "x" }).success).toBe(false);
  });
});

describe("coachExchangeSchema", () => {
  it("validates a stored exchange record", () => {
    const record = coachExchangeSchema.parse({
      id: "e1",
      intent: "coach-query",
      targetRef: null,
      userMessage: "What should I focus on?",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-04T10:00:00.000Z",
      updatedAt: "2026-09-04T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.intent).toBe("coach-query");
    expect(record.userMessage).toBe("What should I focus on?");
  });

  it("rejects an unknown intent", () => {
    expect(
      coachExchangeSchema.safeParse({
        id: "e1",
        intent: "delete-everything",
        targetRef: null,
        userMessage: null,
        ...full,
        status: "active",
        version: 1,
        createdAt: "2026-09-04T10:00:00.000Z",
        updatedAt: "2026-09-04T10:00:00.000Z",
        createdBy: "u1",
        updatedBy: "u1",
        archivedAt: null,
      }).success,
    ).toBe(false);
  });
});
