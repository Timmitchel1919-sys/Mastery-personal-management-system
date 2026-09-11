import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useUserContext } from "./user-context-store";

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
});

describe("useUserContext", () => {
  it("adds an explicit note and persists it to localStorage", () => {
    const { result } = renderHook(() => useUserContext());
    act(() => {
      result.current.add({ title: "Depends on vendor contract", body: "Blocked until signed", tags: ["risk"] });
    });
    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0]?.title).toBe("Depends on vendor contract");
    expect(result.current.notes[0]?.status).toBe("active");
    expect(localStorage.getItem("mastery.context.notes")).toContain("vendor contract");
  });

  it("edits, archives and deletes notes", () => {
    const { result } = renderHook(() => useUserContext());
    let id = "";
    act(() => {
      id = result.current.add({ title: "A", body: "b" }).id;
    });
    act(() => result.current.update(id, { body: "updated" }));
    expect(result.current.notes[0]?.body).toBe("updated");
    act(() => result.current.setStatus(id, "archived"));
    expect(result.current.notes[0]?.status).toBe("archived");
    act(() => result.current.remove(id));
    expect(result.current.notes).toHaveLength(0);
  });

  it("links and unlinks a note to a domain record without duplicates", () => {
    const { result } = renderHook(() => useUserContext());
    let id = "";
    act(() => {
      id = result.current.add({ title: "A", body: "b" }).id;
    });
    act(() => result.current.link(id, { type: "GOAL", sourceId: "g1" }));
    act(() => result.current.link(id, { type: "GOAL", sourceId: "g1" }));
    expect(result.current.notes[0]?.links).toHaveLength(1);
    act(() => result.current.unlink(id, { type: "GOAL", sourceId: "g1" }));
    expect(result.current.notes[0]?.links).toHaveLength(0);
  });

  it("marks a source irrelevant and can restore it", () => {
    const { result } = renderHook(() => useUserContext());
    act(() => result.current.markIrrelevant("t1"));
    act(() => result.current.markIrrelevant("t1")); // idempotent
    expect(result.current.irrelevantSourceIds).toEqual(["t1"]);
    act(() => result.current.restoreRelevance("t1"));
    expect(result.current.irrelevantSourceIds).toEqual([]);
  });
});
