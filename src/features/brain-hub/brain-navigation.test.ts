import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BRAIN_MODULES,
  brainModule,
  nodePosition,
  useBrainNavigation,
  type BrainModuleId,
} from "./brain-navigation";

describe("BRAIN_MODULES", () => {
  it("has the six main modules with unique ids and real routes", () => {
    expect(BRAIN_MODULES.map((m) => m.id)).toEqual([
      "goals",
      "plan",
      "focus",
      "act",
      "grow",
      "analytics",
    ]);
    const hrefs = BRAIN_MODULES.map((m) => m.href);
    expect(new Set(hrefs).size).toBe(6);
    expect(hrefs.every((h) => h.startsWith("/"))).toBe(true);
  });

  it("resolves a module by id and throws for an unknown one", () => {
    expect(brainModule("focus").href).toBe("/focus");
    expect(() => brainModule("nope" as BrainModuleId)).toThrow(/unknown brain module/i);
  });
});

describe("nodePosition", () => {
  it("places angle 0 at the top and 180 at the bottom", () => {
    expect(nodePosition(0, 40)).toEqual({ x: expect.closeTo(50), y: expect.closeTo(10) });
    expect(nodePosition(180, 40)).toEqual({ x: expect.closeTo(50), y: expect.closeTo(90) });
  });
  it("places angle 90 to the right and collapses to the centre at radius 0", () => {
    expect(nodePosition(90, 40)).toEqual({ x: expect.closeTo(90), y: expect.closeTo(50) });
    expect(nodePosition(125, 0)).toEqual({ x: 50, y: 50 });
  });
});

describe("useBrainNavigation phase machine", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts at home with nothing selected", () => {
    const { result } = renderHook(() => useBrainNavigation({ transitionMs: 300 }));
    expect(result.current.phase).toBe("home");
    expect(result.current.selectedId).toBeNull();
  });

  it("enterModule → transitioning → module-active after the settle delay", () => {
    const { result } = renderHook(() => useBrainNavigation({ transitionMs: 300 }));

    act(() => result.current.enterModule("focus"));
    expect(result.current.selectedId).toBe("focus");
    expect(result.current.phase).toBe("transitioning");

    act(() => vi.advanceTimersByTime(300));
    expect(result.current.phase).toBe("module-active");
  });

  it("skips the transition entirely under reduced motion", () => {
    const { result } = renderHook(() =>
      useBrainNavigation({ transitionMs: 300, reducedMotion: true }),
    );
    act(() => result.current.enterModule("plan"));
    expect(result.current.phase).toBe("module-active");
  });

  it("returnHome clears the selection and phase", () => {
    const { result } = renderHook(() => useBrainNavigation({ reducedMotion: true }));
    act(() => result.current.enterModule("act"));
    act(() => result.current.returnHome());
    expect(result.current.phase).toBe("home");
    expect(result.current.selectedId).toBeNull();
  });

  it("openSelected calls onOpen with the selected module and nothing else routes", () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useBrainNavigation({ reducedMotion: true, onOpen }),
    );
    act(() => result.current.openSelected());
    expect(onOpen).not.toHaveBeenCalled(); // nothing selected yet

    act(() => result.current.enterModule("grow"));
    act(() => result.current.openSelected());
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "grow", href: "/grow" }));
  });

  it("Escape returns toward home while a module is engaged", () => {
    const { result } = renderHook(() => useBrainNavigation({ reducedMotion: true }));
    act(() => result.current.enterModule("goals"));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.phase).toBe("home");
  });
});
