import { describe, expect, it } from "vitest";
import {
  MAX_COACH_MESSAGE,
  recoveryCoachFormSchema,
  recoveryCoachRequestSchema,
  recoveryCoachResultSchema,
  recoveryCoachSessionSchema,
} from "./recovery-coach-schema";

describe("recoveryCoachRequestSchema", () => {
  it("requires a goalId and a non-empty message", () => {
    expect(recoveryCoachRequestSchema.safeParse({ goalId: "g1", message: "help" }).success).toBe(
      true,
    );
    expect(recoveryCoachRequestSchema.safeParse({ goalId: "g1", message: "" }).success).toBe(false);
    expect(recoveryCoachRequestSchema.safeParse({ message: "help" }).success).toBe(false);
  });

  it("rejects a message over the max length", () => {
    expect(
      recoveryCoachRequestSchema.safeParse({
        goalId: "g1",
        message: "x".repeat(MAX_COACH_MESSAGE + 1),
      }).success,
    ).toBe(false);
  });
});

describe("recoveryCoachResultSchema", () => {
  it("accepts a full callable result", () => {
    const parsed = recoveryCoachResultSchema.parse({
      reply: "That will pass. Try a ten-minute delay.",
      suggestedSteps: [{ id: "s1", label: "Delay", description: "Set a timer." }],
      disclaimers: ["Not a substitute for professional help."],
      influencedBy: [{ collection: "recoveryGoals", id: "g1", label: "Doomscrolling" }],
      sessionId: "sess1",
      createdAt: "2026-09-05T20:00:00.000Z",
    });
    expect(parsed.suggestedSteps).toHaveLength(1);
    expect(parsed.suggestedSteps[0]?.label).toBe("Delay");
  });
});

describe("recoveryCoachSessionSchema", () => {
  it("validates a stored session and strips unknown metric fields", () => {
    const record = recoveryCoachSessionSchema.parse({
      id: "sess1",
      goalId: "g1",
      message: "the urge is strong",
      reply: "It will pass.",
      suggestedSteps: [],
      disclaimers: [],
      influencedBy: [],
      inputTokens: 100,
      outputTokens: 20,
      status: "active",
      version: 1,
      createdAt: "2026-09-05T20:00:00.000Z",
      updatedAt: "2026-09-05T20:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
      archivedAt: null,
    });
    expect(record.goalId).toBe("g1");
    expect((record as Record<string, unknown>).inputTokens).toBeUndefined();
  });
});

describe("recoveryCoachFormSchema", () => {
  it("requires a message", () => {
    expect(recoveryCoachFormSchema.safeParse({ message: "" }).success).toBe(false);
    expect(recoveryCoachFormSchema.safeParse({ message: "I need a next step" }).success).toBe(true);
  });
});
