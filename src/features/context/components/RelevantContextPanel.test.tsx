import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildContextIndex, deriveRelationships, queryContext } from "../context-model";

const markIrrelevant = vi.fn();
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/strategy" }));
vi.mock("../use-context", () => ({ useKnowledgeContext: () => value }));

import { RelevantContextPanel } from "./RelevantContextPanel";

const NOW = "2026-09-10T09:00:00.000Z";

const index = buildContextIndex({
  goals: [
    {
      id: "g1",
      status: "active",
      version: 1,
      createdAt: NOW,
      updatedAt: NOW,
      createdBy: "u",
      updatedBy: "u",
      archivedAt: null,
      title: "Certification",
      description: "study plan",
      pillarIds: ["personal"],
      parentPlanId: null,
      startDate: null,
      targetDate: null,
      goalStatus: "in-progress",
      priority: "high",
      progress: 20,
      measurementType: "percent",
      targetValue: null,
      currentValue: null,
      unit: "",
      reviewFrequency: "weekly",
    },
  ] as never,
  plans: [],
  tasks: [],
  decisions: [],
  journal: [],
  explicitNotes: [],
});
const relationships = deriveRelationships(index);

beforeEach(() => {
  markIrrelevant.mockReset();
  value = {
    status: "ready",
    query: (q: Parameters<typeof queryContext>[2]) => queryContext(index, relationships, { ...q, now: NOW }),
    userContext: { markIrrelevant },
  };
});

describe("RelevantContextPanel", () => {
  it("renders scoped results with a relevance badge and an explanation", () => {
    render(<RelevantContextPanel scope={{ module: "goals", activeGoalId: "g1" }} />);
    expect(screen.getByText("Certification")).toBeInTheDocument();
    expect(screen.getByText("Direct")).toBeInTheDocument();
    expect(screen.getByText(/goal, 2026-/i)).toBeInTheDocument();
  });

  it("shows 'No relevant history found.' when the query returns nothing", () => {
    value = { ...value, query: () => [] };
    render(<RelevantContextPanel scope={{ module: "analytics" }} />);
    expect(screen.getByText("No relevant history found.")).toBeInTheDocument();
  });

  it("lets the user mark an item not relevant", async () => {
    render(<RelevantContextPanel scope={{ module: "goals", activeGoalId: "g1" }} />);
    await userEvent.click(screen.getByRole("button", { name: /mark "certification" not relevant/i }));
    expect(markIrrelevant).toHaveBeenCalledWith("g1");
  });

  it("hides the explanation and controls in compact mode", () => {
    render(<RelevantContextPanel scope={{ module: "goals", activeGoalId: "g1" }} compact />);
    expect(screen.queryByText(/goal, 2026-/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /not relevant/i })).not.toBeInTheDocument();
  });
});
