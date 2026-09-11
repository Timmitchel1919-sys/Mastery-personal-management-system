"use client";

import { useCallback, useState } from "react";
import {
  summarizeCalibration,
  type CalibrationEntry,
  type CalibrationSummary,
  type CalibrationVerdict,
  type Forecast,
} from "./foresight-model";

/**
 * Layer U — prediction calibration log.
 *
 * A per-viewer localStorage record of forecasts and, where the user chooses to
 * confirm one, their eventual outcome. There is no automated ground-truth
 * source for most forecast types (goal trajectory, strategic projections), so
 * calibration here is explicit and user-confirmed rather than invented —
 * honest about what MASTERY can and cannot verify on its own.
 */

const KEY = "mastery.foresight.calibration";
const CAP = 100;

function read(): CalibrationEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as CalibrationEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: CalibrationEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // per-viewer convenience only
  }
}

export function useCalibration(): {
  entries: CalibrationEntry[];
  summary: CalibrationSummary;
  recordForecast: (forecast: Forecast) => void;
  recordOutcome: (id: string, verdict: CalibrationVerdict, note?: string) => void;
} {
  const [entries, setEntries] = useState<CalibrationEntry[]>(() => read());

  const persist = useCallback((next: CalibrationEntry[]) => {
    setEntries(next);
    write(next);
  }, []);

  const recordForecast = useCallback(
    (forecast: Forecast) => {
      if (entries.some((entry) => entry.forecastId === forecast.id)) return;
      const entry: CalibrationEntry = {
        id: `cal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        forecastId: forecast.id,
        forecastType: forecast.type,
        statement: forecast.statement,
        predictedAt: forecast.createdAt,
        verdict: "UNRESOLVED",
        note: null,
        evaluatedAt: null,
      };
      persist([entry, ...entries].slice(0, CAP));
    },
    [entries, persist],
  );

  const recordOutcome = useCallback(
    (id: string, verdict: CalibrationVerdict, note?: string) => {
      persist(
        entries.map((entry) =>
          entry.id === id
            ? { ...entry, verdict, note: note ?? entry.note, evaluatedAt: new Date().toISOString() }
            : entry,
        ),
      );
    },
    [entries, persist],
  );

  return { entries, summary: summarizeCalibration(entries), recordForecast, recordOutcome };
}
