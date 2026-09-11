import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { classifyAction, type OpsAction } from "../autonomy-model";
import { ApprovalCard } from "./ApprovalCard";

const NOW = "2026-09-10T09:00:00.000Z";

function action(over: Partial<OpsAction> = {}): OpsAction {
  const actionType = over.actionType ?? "SEND_EXTERNAL_MESSAGE";
  return {
    id: "a1",
    correlationId: "c1",
    actionType,
    source: "automation",
    title: "Send project update to the team",
    reason: "The milestone was reached",
    classification: classifyAction(actionType, ["project:alpha"]),
    status: "WAITING_APPROVAL",
    policyDecision: { decision: "REQUIRE_APPROVAL", reason: "High-risk action — your approval is required." },
    dependsOn: [],
    chainDepth: 0,
    idempotencyKey: "k",
    params: {},
    createdAt: NOW,
    decidedAt: NOW,
    executedAt: null,
    verifiedAt: null,
    result: null,
    failureReason: null,
    rollbackAvailable: false,
    ...over,
  };
}

describe("ApprovalCard", () => {
  it("shows action, why, affected data, risk, reversibility and executor", () => {
    render(<ApprovalCard action={action()} onApprove={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByText("Send project update to the team")).toBeInTheDocument();
    expect(screen.getByText("The milestone was reached")).toBeInTheDocument();
    expect(screen.getByText("project:alpha")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Cannot be automatically reversed")).toBeInTheDocument();
    expect(screen.getByText("MASTERY automation")).toBeInTheDocument();
  });

  it("calls onApprove / onReject on the explicit clicks", async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(<ApprovalCard action={action()} onApprove={onApprove} onReject={onReject} />);
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("surfaces an Edit action only when a handler is provided", () => {
    const { rerender } = render(<ApprovalCard action={action()} onApprove={vi.fn()} onReject={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    rerender(<ApprovalCard action={action()} onApprove={vi.fn()} onReject={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
