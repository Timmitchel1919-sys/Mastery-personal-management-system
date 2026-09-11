import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_AUTONOMY_POLICY } from "@/features/autonomy";

const pauseAll = vi.fn();
const resumeAll = vi.fn();
const approve = vi.fn();
const reject = vi.fn();
const createDraft = vi.fn();
const activateDraft = vi.fn();
const testDraft = vi.fn(() => ({ wouldFire: true, explanation: "It would fire now." }));
const governancePauseAll = vi.fn();
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/automation" }));
vi.mock("../use-governance", () => ({ useGovernance: () => value }));

import { AutomationCenterView } from "./AutomationCenterView";

const NOW = "2026-09-11T09:00:00.000Z";

beforeEach(() => {
  [pauseAll, resumeAll, approve, reject, createDraft, activateDraft, testDraft, governancePauseAll].forEach((fn) => fn.mockClear());
  value = {
    autonomy: {
      policy: DEFAULT_AUTONOMY_POLICY,
      paused: false,
      queue: [],
      pauseAll,
      resumeAll,
      approve,
      reject,
    },
    conditionalRules: [],
    conflicts: [],
    circuitBreakers: [],
    drafts: [],
    createDraft,
    activateDraft,
    testDraft,
    audit: [],
    auditIntegrity: { intact: true, brokenAtIndex: null },
    pauseAll: governancePauseAll,
  };
});

describe("AutomationCenterView", () => {
  it("renders the operating-loop header and summary counts", () => {
    render(<AutomationCenterView />);
    expect(screen.getByText(/controlled operating loop/i)).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Conflicts")).toBeInTheDocument();
  });

  it("shows the kill-switch banner and lets the user resume when paused", async () => {
    value = { ...value, autonomy: { ...(value.autonomy as object), paused: true } };
    render(<AutomationCenterView />);
    expect(screen.getByText(/kill switch is active/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /resume automation/i }));
    expect(resumeAll).toHaveBeenCalledTimes(1);
  });

  it("activates the kill switch through governance.pauseAll (not autonomy.pauseAll directly)", async () => {
    render(<AutomationCenterView />);
    await userEvent.click(screen.getByRole("button", { name: /pause all automation/i }));
    expect(governancePauseAll).toHaveBeenCalledTimes(1);
  });

  it("surfaces conflicts and circuit breakers when present", () => {
    value = {
      ...value,
      conflicts: [{ a: "a1", b: "a2", entity: "goal:1", reason: "Both target goal:1." }],
      circuitBreakers: [{ actionType: "SUMMARIZE_TODAY", tripped: true, consecutiveFailures: 3, reason: "3 consecutive failures." }],
    };
    render(<AutomationCenterView />);
    expect(screen.getByRole("heading", { name: /conflicts \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /circuit breakers \(1\)/i })).toBeInTheDocument();
  });

  it("creates a policy draft from a typed phrase", async () => {
    render(<AutomationCenterView />);
    await userEvent.type(screen.getByLabelText(/automation request/i), "Every weekday remind me to review my goals.");
    await userEvent.click(screen.getByRole("button", { name: /preview policy/i }));
    expect(createDraft).toHaveBeenCalledWith("Every weekday remind me to review my goals.");
  });

  it("activates and tests a drafted policy without executing anything", async () => {
    value = {
      ...value,
      drafts: [
        {
          id: "d1",
          sourcePhrase: "x",
          name: "Weekday goal reminder",
          trigger: "TIME_MORNING",
          triggerLabel: "every weekday morning",
          actionType: "CREATE_INTERNAL_REMINDER",
          conditions: ["Runs only on weekdays."],
          dataUsed: ["Your active goals"],
          approvalRequired: true,
          version: 1,
          createdAt: NOW,
        },
      ],
    };
    render(<AutomationCenterView />);
    expect(screen.getByText(/weekday goal reminder/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^activate$/i }));
    expect(activateDraft).toHaveBeenCalledWith("d1");
    await userEvent.click(screen.getByRole("button", { name: /test policy/i }));
    expect(testDraft).toHaveBeenCalled();
    expect(await screen.findByText(/it would fire now/i)).toBeInTheDocument();
  });

  it("shows audit integrity status", () => {
    value = { ...value, auditIntegrity: { intact: false, brokenAtIndex: 0 } };
    render(<AutomationCenterView />);
    expect(screen.getByText(/integrity check failed/i)).toBeInTheDocument();
  });
});
