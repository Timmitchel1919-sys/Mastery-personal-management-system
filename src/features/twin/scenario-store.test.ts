import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useScenarioLibrary } from "./scenario-store";

const emptyScenarioInput = {
  name: "Focus Goal A — Q4",
  horizon: "3m" as const,
  changes: [],
  assumptions: [],
};

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
});

describe("useScenarioLibrary", () => {
  it("creates a scenario as a DRAFT at version 1 and persists it", () => {
    const { result } = renderHook(() => useScenarioLibrary());
    act(() => {
      result.current.create(emptyScenarioInput);
    });
    expect(result.current.scenarios).toHaveLength(1);
    expect(result.current.scenarios[0]).toMatchObject({ status: "DRAFT", version: 1, name: "Focus Goal A — Q4" });
    expect(localStorage.getItem("mastery.twin.scenarios")).toContain("Focus Goal A");
  });

  it("updates a scenario and moves it through statuses", () => {
    const { result } = renderHook(() => useScenarioLibrary());
    let id = "";
    act(() => {
      id = result.current.create(emptyScenarioInput).id;
    });
    act(() => result.current.update(id, { name: "Renamed" }));
    expect(result.current.scenarios[0]?.name).toBe("Renamed");
    act(() => result.current.setStatus(id, "SIMULATED"));
    act(() => result.current.setStatus(id, "APPLIED"));
    expect(result.current.scenarios[0]?.status).toBe("APPLIED");
  });

  it("duplicates a scenario as the next version without overwriting the original", () => {
    const { result } = renderHook(() => useScenarioLibrary());
    let id = "";
    act(() => {
      id = result.current.create(emptyScenarioInput).id;
    });
    act(() => {
      result.current.duplicate(id);
    });
    expect(result.current.scenarios).toHaveLength(2);
    const [copy, original] = result.current.scenarios;
    expect(original?.version).toBe(1);
    expect(copy?.version).toBe(2);
    expect(copy?.name).toContain("v2");
    expect(copy?.status).toBe("DRAFT");
  });

  it("deletes a scenario", () => {
    const { result } = renderHook(() => useScenarioLibrary());
    let id = "";
    act(() => {
      id = result.current.create(emptyScenarioInput).id;
    });
    act(() => result.current.remove(id));
    expect(result.current.scenarios).toHaveLength(0);
  });
});
