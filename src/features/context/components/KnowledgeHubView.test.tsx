import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildContextIndex, deriveRelationships, queryContext } from "../context-model";

const add = vi.fn();
const setStatus = vi.fn();
const remove = vi.fn();
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/knowledge" }));
vi.mock("../use-context", () => ({ useKnowledgeContext: () => value }));

import { KnowledgeHubView } from "./KnowledgeHubView";

const NOW = "2026-09-10T09:00:00.000Z";

function baseGoal(id: string, title: string) {
  return {
    id,
    status: "active",
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "u",
    updatedBy: "u",
    archivedAt: null,
    title,
    description: "desc",
    pillarIds: ["personal"],
    parentPlanId: null,
    startDate: null,
    targetDate: null,
    goalStatus: "in-progress",
    priority: "medium",
    progress: 10,
    measurementType: "percent",
    targetValue: null,
    currentValue: null,
    unit: "",
    reviewFrequency: "weekly",
  };
}

const index = buildContextIndex({
  goals: [baseGoal("g1", "Certification"), baseGoal("g2", "Fitness base")] as never,
  plans: [],
  tasks: [],
  decisions: [],
  journal: [],
  explicitNotes: [],
});
const relationships = deriveRelationships(index);

beforeEach(() => {
  add.mockReset();
  setStatus.mockReset();
  remove.mockReset();
  value = {
    status: "ready",
    index,
    relationships,
    conflicts: [],
    query: (q: Parameters<typeof queryContext>[2]) => queryContext(index, relationships, { ...q, now: NOW }),
    userContext: {
      notes: [],
      irrelevantSourceIds: [],
      add,
      setStatus,
      remove,
      restoreRelevance: vi.fn(),
    },
  };
});

describe("KnowledgeHubView", () => {
  it("renders the knowledge sections from the index", () => {
    render(<KnowledgeHubView />);
    expect(screen.getByRole("heading", { name: /important context/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /project history/i })).toBeInTheDocument();
    expect(screen.getByText("Certification")).toBeInTheDocument();
  });

  it("runs a deterministic search once the query is long enough", async () => {
    render(<KnowledgeHubView />);
    await userEvent.type(screen.getByLabelText(/search your mastery knowledge/i), "fitness");
    expect(await screen.findByRole("heading", { name: /search results/i })).toBeInTheDocument();
    expect(screen.getAllByText("Fitness base").length).toBeGreaterThan(0);
  });

  it("adds an explicit context note", async () => {
    render(<KnowledgeHubView />);
    await userEvent.type(screen.getByLabelText(/context note title/i), "Depends on contract");
    await userEvent.type(screen.getByLabelText(/context note details/i), "blocked until signed");
    await userEvent.click(screen.getByRole("button", { name: /add context/i }));
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Depends on contract", body: "blocked until signed" }),
    );
  });

  it("surfaces conflicting context when the engine reports it", () => {
    value = {
      ...value,
      conflicts: [{ id: "c1", sourceIds: ["n1", "g1"], field: "date", statement: "note says June, goal says July", values: [] }],
    };
    render(<KnowledgeHubView />);
    expect(screen.getByRole("heading", { name: /conflicting context/i })).toBeInTheDocument();
    expect(screen.getByText(/note says june, goal says july/i)).toBeInTheDocument();
  });
});
