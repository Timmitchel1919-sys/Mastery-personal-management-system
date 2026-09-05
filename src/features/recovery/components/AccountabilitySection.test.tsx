import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecoveryAccountabilityPartner } from "../recovery-accountability-schema";

const configure = vi.fn();
const reload = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("../use-recovery-accountability", () => ({
  useRecoveryAccountability: () => hookValue,
}));
vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ status: "authenticated", user: { uid: "owner1" } }),
}));

import { AccountabilitySection } from "./AccountabilitySection";

const partner: RecoveryAccountabilityPartner = {
  id: "p1",
  status: "active",
  version: 1,
  createdAt: "2026-09-05T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
  createdBy: "owner1",
  updatedBy: "owner1",
  archivedAt: null,
  goalId: "g1",
  partnerEmail: "sam@example.com",
  partnerLabel: "Sam",
  scope: "streak-only",
  customFields: [],
  includeSetbackCount: false,
  sendCheckInReminders: false,
  expiresAt: null,
  revokedAt: null,
};

beforeEach(() => {
  [configure, reload].forEach((fn) => fn.mockReset());
  configure.mockResolvedValue(true);
  hookValue = {
    status: "ready",
    partners: [],
    error: null,
    reload,
    configure,
    saving: false,
    saveError: null,
  };
});

describe("AccountabilitySection", () => {
  it("shows the privacy note and empty state", () => {
    render(<AccountabilitySection goalId="g1" />);
    expect(screen.getByRole("heading", { name: "Accountability partner" })).toBeInTheDocument();
    expect(screen.getByText(/Share a narrow slice of this goal/i)).toBeInTheDocument();
    expect(screen.getByText("No one has access. Add a partner above.")).toBeInTheDocument();
  });

  it("lists a partner with its scope and a shareable link", () => {
    hookValue.partners = [partner];
    render(<AccountabilitySection goalId="g1" />);
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.getByText("Current streak only")).toBeInTheDocument();
    expect(screen.getByText("/recovery/partner?owner=owner1&grant=p1")).toBeInTheDocument();
  });

  it("revokes a partner", async () => {
    hookValue.partners = [partner];
    render(<AccountabilitySection goalId="g1" />);
    await userEvent.click(screen.getByRole("button", { name: /revoke access for sam/i }));
    expect(configure).toHaveBeenCalledWith({ op: "revoke", partnerId: "p1" });
  });

  it("creates a grant through the dialog", async () => {
    render(<AccountabilitySection goalId="g1" />);
    await userEvent.click(screen.getByRole("button", { name: /share with a partner/i }));
    await userEvent.type(screen.getByLabelText(/their email/i), "sam@example.com");
    await userEvent.type(screen.getByLabelText(/^label$/i), "Sam");
    await userEvent.click(screen.getByRole("button", { name: /share with them/i }));
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        op: "create",
        goalId: "g1",
        partnerEmail: "sam@example.com",
        partnerLabel: "Sam",
        scope: "streak-only",
      }),
    );
  });

  it("surfaces a save error", () => {
    hookValue.saveError = "That recovery goal was not found";
    render(<AccountabilitySection goalId="g1" />);
    expect(screen.getByText("That recovery goal was not found")).toBeInTheDocument();
  });
});
