import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCommandCenter, type CommandCenterState } from "../command-center-state";

const reload = vi.fn();
let value: { status: "loading" | "ready"; state: CommandCenterState; brainState: unknown; reload: () => void };

vi.mock("next/navigation", () => ({ usePathname: () => "/command", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../use-command-center", () => ({ useCommandCenter: () => value }));
vi.mock("@/features/brain-hub", () => ({ BrainHub: () => <div data-testid="brain-hub" /> }));
vi.mock("@/features/strategy", () => ({ StrategySignalsPanel: () => <div data-testid="strategy-signals" /> }));
vi.mock("@/features/context", () => ({ RelevantContextPanel: () => <div data-testid="relevant-context" /> }));
vi.mock("@/features/autonomy", () => ({ PendingApprovalsPanel: () => <div data-testid="pending-approvals" /> }));
vi.mock("@/features/adaptation", () => ({ AdaptationSignalsPanel: () => <div data-testid="adaptation-signals" /> }));
vi.mock("@/features/foresight", () => ({ ForesightSignalsPanel: () => <div data-testid="foresight-signals" /> }));

import { CommandCenterView } from "./CommandCenterView";

const NOW = "2026-09-10T09:00:00.000Z";

const neutralBrain = {
  availability: "ready" as const,
  source: "live" as const,
  overallActivity: "active" as const,
  modules: (["goals", "plan", "focus", "act", "grow", "analytics"] as const).reduce(
    (acc, id) => {
      acc[id] = { status: "normal", progress: null, attentionCount: 0, recentEvent: false, lastUpdatedAt: null };
      return acc;
    },
    {} as Record<string, unknown>,
  ),
};

beforeEach(() => {
  reload.mockReset();
  value = {
    status: "ready",
    brainState: neutralBrain,
    reload,
    state: buildCommandCenter({ nowIso: NOW, intelligence: null, predictions: null, brain: null, decisions: null }),
  };
});

describe("CommandCenterView", () => {
  it("shows the orientation empty state when there is no data", () => {
    render(<CommandCenterView />);
    expect(screen.getByText(/cockpit is still warming up/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open the brain hub/i })).toBeInTheDocument();
  });

  it("shows skeletons while loading", () => {
    value = { ...value, status: "loading" };
    render(<CommandCenterView />);
    expect(screen.queryByText(/cockpit is still warming up/i)).not.toBeInTheDocument();
  });

  it("renders the attention queue, decision queue and executive brief from real state", () => {
    value = {
      ...value,
      state: buildCommandCenter({
        nowIso: NOW,
        intelligence: {
          status: "ready",
          hasAnyData: true,
          insights: [],
          today: [],
          progress: [],
          attention: [
            {
              id: "att",
              type: "trend",
              title: "Two tasks overdue",
              summary: "2 of 6 tasks are past due.",
              detail: "",
              recommendation: "Re-sequence today",
              severity: "critical",
              confidence: "high",
              signal: "strong",
              status: "active",
              relatedModule: "act",
              createdAt: NOW,
              actions: [{ label: "Open Tasks", href: "/act/tasks" }],
              evidence: [],
            } as never,
          ],
          patterns: [],
          recommendations: [],
        },
        predictions: null,
        brain: null,
        decisions: [
          {
            id: "d1",
            title: "Start a certification",
            description: "",
            status: "ANALYZING",
            createdAt: NOW,
            updatedAt: NOW,
            decisionDate: "2026-09-10",
            domain: "grow",
            importance: "medium",
            urgency: "medium",
            context: "Weighing timing against workload.",
            desiredOutcome: "",
            userPriority: "",
            constraints: [],
            assumptions: [],
            relatedGoals: ["g1"],
            relatedPlans: [],
            relatedPredictions: [],
            relatedRecommendations: [],
            selectedOptionId: null,
            criteria: [],
            options: [],
            tradeOffs: [],
            risks: [],
            scenarios: [],
            evidence: [],
          } as never,
        ],
      }),
    };

    render(<CommandCenterView />);
    expect(screen.getByRole("heading", { name: /attention queue/i })).toBeInTheDocument();
    expect(screen.getAllByText("Two tasks overdue").length).toBeGreaterThan(0);
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getAllByText("Start a certification").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /open tasks/i }).length).toBeGreaterThan(0);
  });

  it("surfaces a degradation banner and still renders deterministic panels when AI failed", () => {
    value = {
      ...value,
      state: buildCommandCenter({
        nowIso: NOW,
        intelligence: {
          status: "error",
          hasAnyData: false,
          insights: [],
          today: [],
          progress: [],
          attention: [],
          patterns: [],
          recommendations: [],
        },
        predictions: { status: "error", enabled: true, signals: [] },
        brain: null,
        decisions: [],
      }),
    };
    render(<CommandCenterView />);
    expect(screen.getByText(/running on partial signals/i)).toBeInTheDocument();
    expect(screen.getByText(/Intelligence unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /attention queue/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /quick actions/i })).toBeInTheDocument();
  });

  it("refreshes derived state on request", async () => {
    render(<CommandCenterView />);
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
