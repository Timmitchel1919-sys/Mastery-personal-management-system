import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/focus/time-blocking" }));

import { SubmoduleWorkspace } from "./SubmoduleWorkspace";

describe("SubmoduleWorkspace", () => {
  it("shows the Brain hierarchy: back-to-module + subtle module/submodule breadcrumb", () => {
    render(
      <SubmoduleWorkspace module="focus" submoduleId="time-blocking">
        <div>feature</div>
      </SubmoduleWorkspace>,
    );
    const back = screen.getByRole("link", { name: "Back to Focus" });
    expect(back).toHaveAttribute("href", "/focus");
    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("Time Blocking")).toBeInTheDocument();
    expect(screen.getByText("feature")).toBeInTheDocument();
  });

  it("does not render its own h1 when the wrapped feature keeps its header", () => {
    render(
      <SubmoduleWorkspace module="focus" submoduleId="deep-work">
        <div>feature</div>
      </SubmoduleWorkspace>,
    );
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("owns the title only when asked (placeholder submodule)", () => {
    render(
      <SubmoduleWorkspace
        module="focus"
        submoduleId="sessions"
        title="Focus Sessions"
        state="empty"
        emptyTitle="No focus session history yet"
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Focus Sessions" })).toBeInTheDocument();
    expect(screen.getByText("No focus session history yet")).toBeInTheDocument();
  });

  it("ESC returns to the module environment, not the app root", async () => {
    render(
      <SubmoduleWorkspace module="focus" submoduleId="time-blocking">
        <div>feature</div>
      </SubmoduleWorkspace>,
    );
    push.mockClear();
    await userEvent.keyboard("{Escape}");
    expect(push).toHaveBeenCalledWith("/focus");
  });

  it("ESC yields when a dialog owns it", async () => {
    render(
      <>
        <div role="dialog" data-state="open">
          modal
        </div>
        <SubmoduleWorkspace module="focus" submoduleId="time-blocking">
          <div>feature</div>
        </SubmoduleWorkspace>
      </>,
    );
    push.mockClear();
    await userEvent.keyboard("{Escape}");
    expect(push).not.toHaveBeenCalled();
  });

  it("renders loading and error states in the Mastery language", async () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <SubmoduleWorkspace module="focus" submoduleId="calendar" state="loading">
        <div>feature</div>
      </SubmoduleWorkspace>,
    );
    expect(screen.queryByText("feature")).not.toBeInTheDocument();

    rerender(
      <SubmoduleWorkspace module="focus" submoduleId="calendar" state="error" onRetry={onRetry}>
        <div>feature</div>
      </SubmoduleWorkspace>,
    );
    expect(screen.getByText(/unable to load calendar/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
