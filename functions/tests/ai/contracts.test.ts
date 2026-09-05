import { describe, expect, it } from "vitest";
import {
  aiRequestSchema,
  aiResponseSchema,
  modelOutputSchema,
} from "../../src/ai/shared/contracts";

describe("aiRequestSchema", () => {
  it("defaults targetRef/userMessage to null and options to includePrivateJournal: false", () => {
    const parsed = aiRequestSchema.parse({ intent: "coach-query" });
    expect(parsed.targetRef).toBeNull();
    expect(parsed.userMessage).toBeNull();
    expect(parsed.options).toEqual({ includePrivateJournal: false });
  });

  it("rejects an unknown intent", () => {
    expect(aiRequestSchema.safeParse({ intent: "delete-everything" }).success).toBe(false);
  });

  it("accepts a fully specified request", () => {
    const parsed = aiRequestSchema.parse({
      intent: "goal-breakdown",
      targetRef: { collection: "goals", id: "g1" },
      userMessage: null,
      options: { includePrivateJournal: true },
    });
    expect(parsed.targetRef).toEqual({ collection: "goals", id: "g1" });
    expect(parsed.options.includePrivateJournal).toBe(true);
  });
});

describe("modelOutputSchema", () => {
  it("defaults disclaimers to an empty array", () => {
    const parsed = modelOutputSchema.parse({
      answer: "Do X",
      assumptions: [],
      suggestedActions: [],
    });
    expect(parsed.disclaimers).toEqual([]);
  });

  it("requires a non-empty answer", () => {
    expect(
      modelOutputSchema.safeParse({ answer: "", assumptions: [], suggestedActions: [] }).success,
    ).toBe(false);
  });
});

describe("aiResponseSchema", () => {
  it("extends the model output with server-attached influencedBy", () => {
    const parsed = aiResponseSchema.parse({
      answer: "Do X",
      assumptions: ["You have time this week"],
      suggestedActions: [{ id: "a1", label: "Do X", description: "Because Y" }],
      disclaimers: [],
      influencedBy: [{ collection: "goals", id: "g1", label: "Ship v1" }],
    });
    expect(parsed.influencedBy).toHaveLength(1);
  });
});
