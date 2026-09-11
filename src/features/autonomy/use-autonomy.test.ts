import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAutonomy } from "./use-autonomy";

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
});

describe("useAutonomy", () => {
  it("persists policy changes to localStorage", () => {
    const { result } = renderHook(() => useAutonomy());
    act(() => result.current.setPolicy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"] }));
    expect(result.current.policy.autonomyLevel).toBe(3);
    expect(localStorage.getItem("mastery.autonomy.policy")).toContain("SUMMARIZE_TODAY");
  });

  it("rejects a prohibited action at enqueue and records it in history", () => {
    const { result } = renderHook(() => useAutonomy());
    let rejected: string | null = null;
    act(() => {
      rejected = result.current.enqueue({ actionType: "MOVE_MONEY", reason: "test" }).rejected;
    });
    expect(rejected).toMatch(/never be executed autonomously/i);
    expect(result.current.history[0]?.status).toBe("REJECTED");
  });

  it("routes a non-permitted low-risk action to WAITING_APPROVAL", () => {
    const { result } = renderHook(() => useAutonomy());
    act(() => {
      result.current.enqueue({ actionType: "SUMMARIZE_TODAY", reason: "morning" });
    });
    expect(result.current.pending).toHaveLength(1);
    expect(result.current.pending[0]?.status).toBe("WAITING_APPROVAL");
  });

  it("auto-queues a low-risk permitted action at level 3 and executes + verifies it", () => {
    const { result } = renderHook(() => useAutonomy());
    act(() => result.current.setPolicy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"] }));
    let actionId = "";
    act(() => {
      actionId = result.current.enqueue({ actionType: "SUMMARIZE_TODAY", reason: "morning" }).action!.id;
    });
    expect(result.current.queue[0]?.status).toBe("QUEUED");
    let outcome: { ok: boolean; message: string } = { ok: false, message: "" };
    act(() => {
      outcome = result.current.execute(actionId);
    });
    expect(outcome.ok).toBe(true);
    expect(result.current.queue[0]?.status).toBe("COMPLETED");
    expect(result.current.history[0]).toMatchObject({ status: "COMPLETED", verified: true });
  });

  it("approves a pending action, moving it to QUEUED, then executes it", () => {
    const { result } = renderHook(() => useAutonomy());
    let id = "";
    act(() => {
      id = result.current.enqueue({ actionType: "PREPARE_BRIEFING", reason: "brief" }).action!.id;
    });
    act(() => result.current.approve(id));
    expect(result.current.queue[0]?.status).toBe("QUEUED");
    act(() => {
      result.current.execute(id);
    });
    expect(result.current.queue[0]?.status).toBe("COMPLETED");
  });

  it("emergency stop blocks execution", () => {
    const { result } = renderHook(() => useAutonomy());
    act(() => result.current.setPolicy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"] }));
    let id = "";
    act(() => {
      id = result.current.enqueue({ actionType: "SUMMARIZE_TODAY", reason: "x" }).action!.id;
    });
    act(() => result.current.pauseAll());
    let outcome: { ok: boolean; message: string } = { ok: true, message: "" };
    act(() => {
      outcome = result.current.execute(id);
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.message).toMatch(/paused/i);
    act(() => result.current.resumeAll());
    expect(result.current.paused).toBe(false);
  });

  it("rejects a duplicate idempotency key", () => {
    const { result } = renderHook(() => useAutonomy());
    act(() => result.current.setPolicy({ autonomyLevel: 3, allowedActions: ["SUMMARIZE_TODAY"] }));
    let firstId = "";
    act(() => {
      firstId = result.current.enqueue({ actionType: "SUMMARIZE_TODAY", reason: "same", idempotencyKey: "k" }).action!.id;
    });
    act(() => {
      result.current.execute(firstId);
    });
    let rejected: string | null = null;
    act(() => {
      rejected = result.current.enqueue({ actionType: "SUMMARIZE_TODAY", reason: "same", idempotencyKey: "k" }).rejected;
    });
    expect(rejected).toMatch(/already run/i);
  });

  it("manages automation rules", () => {
    const { result } = renderHook(() => useAutonomy());
    act(() => result.current.addRule("Recalc on completion", "TASK_COMPLETED", "RECALCULATE_ANALYTICS"));
    expect(result.current.rules).toHaveLength(1);
    const id = result.current.rules[0]!.id;
    act(() => result.current.toggleRule(id));
    expect(result.current.rules[0]?.enabled).toBe(false);
    act(() => result.current.removeRule(id));
    expect(result.current.rules).toHaveLength(0);
  });

  it("rolls back a completed reversible action", () => {
    const { result } = renderHook(() => useAutonomy());
    act(() => result.current.setPolicy({ autonomyLevel: 3, allowedActions: ["RECALCULATE_ANALYTICS"] }));
    let id = "";
    act(() => {
      id = result.current.enqueue({ actionType: "RECALCULATE_ANALYTICS", reason: "x" }).action!.id;
    });
    act(() => {
      result.current.execute(id);
    });
    act(() => result.current.rollback(id));
    expect(result.current.queue[0]?.status).toBe("ROLLED_BACK");
    expect(result.current.history[0]).toMatchObject({ status: "ROLLED_BACK", rolledBack: true });
  });
});
