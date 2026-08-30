import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LifeVision } from "../schema";

const reload = vi.fn();
const create = vi.fn();
const update = vi.fn();
const archive = vi.fn();
let hookValue: Record<string, unknown>;

vi.mock("next/navigation", () => ({ usePathname: () => "/plan/vision" }));
vi.mock("../use-life-vision", () => ({ useLifeVision: () => hookValue }));

import { LifeVisionView } from "./LifeVisionView";

const missionItem: LifeVision = {
  id: "v1",
  category: "mission",
  title: "Serve well",
  content: "Be useful to the people around me.",
  pillarIds: ["spiritual", "personal"],
  status: "active",
  version: 1,
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
  archivedAt: null,
};

beforeEach(() => {
  [reload, create, update, archive].forEach((fn) => fn.mockReset());
  hookValue = { status: "ready", items: [], error: null, reload, create, update, archive };
});

describe("LifeVisionView", () => {
  it("shows an empty state with a call to action", () => {
    render(<LifeVisionView />);
    expect(screen.getByText("Your Life Vision is empty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add your first item/i })).toBeInTheDocument();
  });

  it("groups items under their category with pillar badges", () => {
    hookValue.items = [missionItem];
    render(<LifeVisionView />);
    expect(screen.getByRole("heading", { name: "Personal mission" })).toBeInTheDocument();
    expect(screen.getByText("Serve well")).toBeInTheDocument();
    expect(screen.getByText("Be useful to the people around me.")).toBeInTheDocument();
    expect(screen.getByText("Spiritual")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("opens the add dialog", async () => {
    render(<LifeVisionView />);
    await userEvent.click(screen.getByRole("button", { name: /add vision item/i }));
    expect(await screen.findByText("Add a vision item")).toBeInTheDocument();
  });

  it("renders an error state with retry", async () => {
    hookValue = {
      status: "error",
      items: [],
      error: "offline",
      reload,
      create,
      update,
      archive,
    };
    render(<LifeVisionView />);
    expect(screen.getByText("We couldn't load your Life Vision")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
