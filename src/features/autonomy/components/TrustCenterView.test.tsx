import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_AUTONOMY_POLICY, summarizeTelemetry } from "../autonomy-model";

const fns = {
  setPolicy: vi.fn(),
  addRule: vi.fn(),
  toggleRule: vi.fn(),
  removeRule: vi.fn(),
  pauseAll: vi.fn(),
  resumeAll: vi.fn(),
  enqueue: vi.fn(() => ({ action: null, rejected: null })),
  approve: vi.fn(),
  reject: vi.fn(),
  cancel: vi.fn(),
  execute: vi.fn(() => ({ ok: true, message: "" })),
  rollback: vi.fn(),
  clearCompleted: vi.fn(),
};
let value: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/operations" }));
vi.mock("../use-autonomy", () => ({ useAutonomy: () => value }));

import { TrustCenterView } from "./TrustCenterView";

beforeEach(() => {
  Object.values(fns).forEach((fn) => fn.mockClear());
  value = {
    policy: { ...DEFAULT_AUTONOMY_POLICY, autonomyLevel: 1 },
    rules: [],
    paused: false,
    queue: [],
    pending: [],
    running: [],
    failed: [],
    history: [],
    telemetry: summarizeTelemetry([]),
    ...fns,
  };
});

describe("TrustCenterView", () => {
  it("renders the autonomy level and permission matrix", () => {
    render(<TrustCenterView />);
    expect(screen.getByRole("heading", { name: /autonomy level/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /agent permissions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /3 · execute low-risk/i })).toBeInTheDocument();
    // prohibited types cannot be set to "allow"
    const moneyRow = screen.getByText("Move money").closest("li")!;
    const allowBtn = within(moneyRow).getByRole("button", { name: "allow" });
    expect(allowBtn).toBeDisabled();
  });

  it("changes the autonomy level on click", async () => {
    render(<TrustCenterView />);
    await userEvent.click(screen.getByRole("button", { name: /3 · execute low-risk/i }));
    expect(fns.setPolicy).toHaveBeenCalledWith({ autonomyLevel: 3 });
  });

  it("triggers the emergency stop", async () => {
    render(<TrustCenterView />);
    await userEvent.click(screen.getByRole("button", { name: /pause all automations/i }));
    expect(fns.pauseAll).toHaveBeenCalledTimes(1);
  });

  it("shows the emergency-stop banner and a resume control when paused", () => {
    value = { ...value, paused: true };
    render(<TrustCenterView />);
    expect(screen.getByText(/emergency stop is active/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resume automations/i })).toBeInTheDocument();
  });

  it("adds an automation rule", async () => {
    render(<TrustCenterView />);
    await userEvent.type(screen.getByLabelText(/rule name/i), "Morning brief");
    await userEvent.click(screen.getByRole("button", { name: /add rule/i }));
    expect(fns.addRule).toHaveBeenCalledWith("Morning brief", "TIME_MORNING", "PREPARE_BRIEFING");
  });

  it("renders pending approvals with an ApprovalCard", () => {
    value = {
      ...value,
      pending: [
        {
          id: "p1",
          correlationId: "c",
          actionType: "SUMMARIZE_TODAY",
          source: "automation",
          title: "Summarise today",
          reason: "morning",
          classification: {
            actionType: "SUMMARIZE_TODAY",
            riskLevel: "low",
            requiredCapability: "SUMMARIZE",
            reversible: true,
            prohibited: false,
            requiresApproval: false,
            affectedEntities: [],
          },
          status: "WAITING_APPROVAL",
          policyDecision: { decision: "REQUIRE_APPROVAL", reason: "Not on your allow-list — approval required." },
          dependsOn: [],
          chainDepth: 0,
          idempotencyKey: "k",
          params: {},
          createdAt: "2026-09-10T09:00:00.000Z",
          decidedAt: "2026-09-10T09:00:00.000Z",
          executedAt: null,
          verifiedAt: null,
          result: null,
          failureReason: null,
          rollbackAvailable: true,
        },
      ],
    };
    render(<TrustCenterView />);
    expect(screen.getByRole("heading", { name: /pending approvals \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });
});
