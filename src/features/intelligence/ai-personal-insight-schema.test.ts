import { describe, expect, it } from "vitest";
import {
  materializeAiInsightResponse,
  toModuleLabel,
  type AiPersonalInsightContext,
} from "./ai-personal-insight-schema";

const context: AiPersonalInsightContext = {
  category: "DAILY_BRIEF",
  moduleId: "focus",
  title: "Focus AI review",
  deterministicSummary: "Focus improved.",
  deterministicRecommendation: "Protect morning block.",
  facts: [
    { id: "f1", label: "Completed sessions", value: "6" },
    { id: "f2", label: "Morning starts", value: "4" },
  ],
  limitations: [],
  sourceInsightIds: ["focus-morning-pattern"],
};

describe("materializeAiInsightResponse", () => {
  it("materializes a valid model output", () => {
    const response = materializeAiInsightResponse(
      {
        summary: "You completed 6 sessions.",
        interpretation: "Morning consistency appears strong.",
        recommendations: ["Keep your morning block."],
        limitations: [],
        factRefs: [0, 1],
      },
      context,
    );

    expect(response.facts).toHaveLength(2);
    expect(response.summary).toContain("6");
  });

  it("rejects unsupported fact references", () => {
    expect(() =>
      materializeAiInsightResponse(
        {
          summary: "Invalid",
          interpretation: "Invalid",
          recommendations: ["Invalid"],
          limitations: [],
          factRefs: [99],
        },
        context,
      ),
    ).toThrow(/unsupported facts/i);
  });
});

describe("toModuleLabel", () => {
  it("maps module ids", () => {
    expect(toModuleLabel("analytics")).toBe("Analytics");
    expect(toModuleLabel(undefined)).toBe("System");
  });
});
