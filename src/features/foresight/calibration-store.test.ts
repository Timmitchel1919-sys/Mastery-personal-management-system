import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Forecast } from "./foresight-model";
import { useCalibration } from "./calibration-store";

const NOW = "2026-09-11T09:00:00.000Z";

function forecast(over: Partial<Forecast> & { id: string }): Forecast {
  return {
    id: over.id,
    type: over.type ?? "DEADLINE_RISK",
    horizon: over.horizon ?? "next-7-days",
    kind: over.kind ?? "PREDICTION",
    statement: over.statement ?? "statement",
    evidence: [],
    assumptions: [],
    confidence: "medium",
    impact: "high",
    target: { kind: "schedule", id: null, label: "x" },
    recommendation: null,
    createdAt: NOW,
    expiresAt: NOW,
    status: "active",
  };
}

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
});

describe("useCalibration", () => {
  it("records a forecast once, as UNRESOLVED, and persists it", () => {
    const { result } = renderHook(() => useCalibration());
    act(() => result.current.recordForecast(forecast({ id: "fc1" })));
    act(() => result.current.recordForecast(forecast({ id: "fc1" }))); // idempotent
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]?.verdict).toBe("UNRESOLVED");
    expect(localStorage.getItem("mastery.foresight.calibration")).toContain("fc1");
  });

  it("records a user-confirmed outcome and updates the summary", () => {
    const { result } = renderHook(() => useCalibration());
    act(() => result.current.recordForecast(forecast({ id: "fc1" })));
    const entryId = result.current.entries[0]!.id;
    act(() => result.current.recordOutcome(entryId, "CORRECT", "confirmed"));
    expect(result.current.entries[0]?.verdict).toBe("CORRECT");
    expect(result.current.entries[0]?.evaluatedAt).not.toBeNull();
    expect(result.current.summary.accuracyRate).toBe(1);
  });

  it("never fabricates accuracy before anything is evaluated", () => {
    const { result } = renderHook(() => useCalibration());
    act(() => result.current.recordForecast(forecast({ id: "fc1" })));
    expect(result.current.summary.accuracyRate).toBeNull();
  });
});
