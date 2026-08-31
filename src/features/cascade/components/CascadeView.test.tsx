import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Cascade } from "../build-cascade";

const reload = vi.fn();
let hookValue: { status: string; cascade: Cascade; error: string | null; reload: typeof reload };

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/cascade" }));
vi.mock("../use-cascade", () => ({ useCascade: () => hookValue }));

import { CascadeView } from "./CascadeView";

const EMPTY_CASCADE: Cascade = {
  roots: [],
  unlinked: [],
  counts: {
    nodes: 0,
    linked: 0,
    unlinked: 0,
    byKind: { plan: 0, goal: 0, project: 0, milestone: 0, roadmap: 0 },
  },
};

beforeEach(() => {
  reload.mockReset();
  hookValue = { status: "ready", cascade: EMPTY_CASCADE, error: null, reload };
});

describe("CascadeView", () => {
  it("shows the empty state when there is nothing to trace", () => {
    render(<CascadeView />);
    expect(screen.getByText("Nothing to trace yet")).toBeInTheDocument();
  });

  it("renders the tree, counts, and the not-yet-linked panel", () => {
    hookValue.cascade = {
      roots: [
        {
          id: "fy",
          kind: "plan",
          title: "Five-year plan",
          statusLabel: "Active",
          href: "/plan/five-year",
          planHorizon: "five-year",
          children: [
            {
              id: "g1",
              kind: "goal",
              title: "Run a marathon",
              statusLabel: "In progress",
              href: "/plan/goals",
              children: [],
            },
          ],
        },
      ],
      unlinked: [
        {
          kind: "project",
          label: "Project",
          nodes: [
            {
              id: "p9",
              kind: "project",
              title: "Orphan project",
              statusLabel: "Active",
              href: "/plan/projects",
              children: [],
            },
          ],
        },
      ],
      counts: {
        nodes: 3,
        linked: 2,
        unlinked: 1,
        byKind: { plan: 1, goal: 1, project: 1, milestone: 0, roadmap: 0 },
      },
    };
    render(<CascadeView />);

    expect(screen.getByRole("link", { name: "Five-year plan" })).toHaveAttribute(
      "href",
      "/plan/five-year",
    );
    expect(screen.getByRole("link", { name: "Run a marathon" })).toBeInTheDocument();
    expect(screen.getByText("Not yet linked")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Orphan project" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders an error with retry", async () => {
    hookValue = { status: "error", cascade: EMPTY_CASCADE, error: "boom", reload };
    render(<CascadeView />);
    expect(screen.getByText("We couldn't build your cascade")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
