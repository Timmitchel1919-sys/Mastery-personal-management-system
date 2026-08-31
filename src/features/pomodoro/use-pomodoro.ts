"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/providers/auth-provider";
import { pomodoroStore } from "./pomodoro-store";
import { pomodoroSessionRepository } from "./pomodoro-session-repository";
import type { PomodoroConfig } from "./schema";

interface UsePomodoroOptions {
  /** Called after a terminal session has been written to Firestore. */
  onSaved?: () => void;
}

export function usePomodoro({ onSaved }: UsePomodoroOptions = {}) {
  const { status: authStatus } = useAuth();
  const state = useSyncExternalStore(
    pomodoroStore.subscribe,
    pomodoroStore.getSnapshot,
    pomodoroStore.getServerSnapshot,
  );

  // A single 1-second clock drives phase changes and the visible countdown.
  useEffect(() => {
    const id = window.setInterval(() => pomodoroStore.tick(), 1000);
    return () => window.clearInterval(id);
  }, []);

  // When the machine produces a terminal session, persist it then clear it.
  useEffect(() => {
    const completion = state.pendingCompletion;
    if (!completion) return;
    let cancelled = false;

    const persist = async () => {
      if (authStatus === "authenticated") {
        try {
          await pomodoroSessionRepository.create({
            label: completion.config.label,
            goalId: completion.config.goalId,
            projectId: completion.config.projectId,
            outcome: completion.outcome,
            workMinutes: completion.config.workMinutes,
            shortBreakMinutes: completion.config.shortBreakMinutes,
            longBreakMinutes: completion.config.longBreakMinutes,
            plannedCycles: completion.config.plannedCycles,
            completedWorkIntervals: completion.completedWorkIntervals,
            focusMinutes: completion.focusMinutes,
            startedAt: completion.startedAt,
            endedAt: completion.endedAt,
            notes: "",
          });
          if (!cancelled) onSaved?.();
        } catch {
          // Losing one session log should not block the UI.
        }
      }
      pomodoroStore.acknowledgeCompletion();
    };

    void persist();
    return () => {
      cancelled = true;
    };
  }, [state.pendingCompletion, authStatus, onSaved]);

  const start = useCallback((config: PomodoroConfig) => pomodoroStore.start(config), []);
  const pause = useCallback(() => pomodoroStore.pause(), []);
  const resume = useCallback(() => pomodoroStore.resume(), []);
  const skip = useCallback(() => pomodoroStore.skip(), []);
  const cancel = useCallback(() => pomodoroStore.cancel(), []);
  const previewConfig = useCallback(
    (config: PomodoroConfig) => pomodoroStore.previewConfig(config),
    [],
  );

  return { state, start, pause, resume, skip, cancel, previewConfig };
}
