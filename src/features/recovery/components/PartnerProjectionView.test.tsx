import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountabilityProjection } from "../recovery-accountability-schema";

let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/recovery/partner" }));
vi.mock("../use-accountability-projection", () => ({
  useAccountabilityProjection: () => hookValue,
}));

import { PartnerProjectionView } from "./PartnerProjectionView";

const projection: AccountabilityProjection = {
  scope: "selected-summary",
  partnerLabel: "Sam",
  goalBehavior: "Late-night doomscrolling",
  recoveryStatus: "going-well",
  currentStreak: 5,
  daysOnTrack: 12,
  checkedInToday: null,
  lastCheckInDate: "2026-09-05",
  setbackCount: null,
  generatedAt: "2026-09-05T09:00:00.000Z",
};

beforeEach(() => {
  hookValue = { status: "ready", projection, error: null };
});

describe("PartnerProjectionView", () => {
  it("renders only the fields present in the projection", () => {
    render(<PartnerProjectionView ownerUid="owner1" partnerId="p1" />);
    expect(screen.getByText("Late-night doomscrolling")).toBeInTheDocument();
    expect(screen.getByText("going-well")).toBeInTheDocument();
    expect(screen.getByText("5d")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    // checkedInToday is null → the stat is not rendered
    expect(screen.queryByText("Checked in today")).not.toBeInTheDocument();
    expect(screen.getByText(/No notes, triggers, setback details/i)).toBeInTheDocument();
  });

  it("shows an unavailable state on error", () => {
    hookValue = {
      status: "error",
      projection: null,
      error: "The owner has revoked this shared view",
    };
    render(<PartnerProjectionView ownerUid="owner1" partnerId="p1" />);
    expect(screen.getByText("This shared view isn't available")).toBeInTheDocument();
    expect(screen.getByText("The owner has revoked this shared view")).toBeInTheDocument();
  });
});
