import { render } from "@testing-library/react";
import { describe, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { expectNoAxeViolations } from "@/test/a11y";

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/goals" }));

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TooltipProvider } from "@/components/ui";
import { ReportDocument } from "@/features/reports";
import type { ReportData } from "@/features/reports";

/**
 * Layer 21 — automated a11y assertions on representative screens. jsdom can't do
 * colour-contrast; these catch structural issues (labels, roles, heading order, ids).
 */

describe("accessibility — shared states", () => {
  it("EmptyState has no violations", async () => {
    const { container } = render(
      <EmptyState title="Nothing here yet" description="Add your first item." />,
    );
    await expectNoAxeViolations(container);
  });

  it("ErrorState (with retry) has no violations", async () => {
    const { container } = render(
      <ErrorState title="Something went wrong" description="Try again." onRetry={() => {}} />,
    );
    await expectNoAxeViolations(container);
  });

  it("LoadingState has no violations", async () => {
    const { container } = render(<LoadingState label="Loading…" />);
    await expectNoAxeViolations(container);
  });
});

describe("accessibility — chrome", () => {
  it("OfflineBanner has no violations", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    const { container } = render(<OfflineBanner />);
    await expectNoAxeViolations(container);
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("SidebarNav has no violations", async () => {
    const { container } = renderWithIntl(
      <TooltipProvider>
        <SidebarNav />
      </TooltipProvider>,
    );
    await expectNoAxeViolations(container);
  });
});

describe("accessibility — report document", () => {
  it("a rendered report has no violations", async () => {
    const data: ReportData = {
      range: { start: "2026-09-01", end: "2026-09-07" },
      generatedAt: "2026-09-07T12:00:00.000Z",
      sections: ["summary", "habits", "kpis"],
      summary: {
        goalsAchieved: 2,
        milestonesCompleted: 1,
        tasksCompleted: 9,
        focusMinutes: 240,
        habitConsistencyPercent: 71,
        activeKpis: 3,
      },
      goals: null,
      habits: {
        overallPercent: 71,
        perHabit: [{ title: "Read", completed: 5, expected: 7, percent: 71 }],
      },
      focus: null,
      kpis: [
        {
          title: "Weight",
          unit: "kg",
          direction: "lower-is-better",
          from: 80,
          to: 78.5,
          change: -1.5,
        },
      ],
      planning: null,
    };
    const { container } = render(<ReportDocument data={data} period="weekly" />);
    await expectNoAxeViolations(container);
  });
});
