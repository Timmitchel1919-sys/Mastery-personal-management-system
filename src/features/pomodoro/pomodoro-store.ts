import {
  DEFAULT_POMODORO_CONFIG,
  pomodoroLiveStateSchema,
  type PomodoroConfig,
  type PomodoroLiveState,
  type PomodoroOutcome,
  type PomodoroPhase,
} from "./schema";

/**
 * The pomodoro timer as an external store for `useSyncExternalStore`. Remaining time is
 * always derived from a wall-clock `phaseEndsAt` timestamp, so the countdown stays correct
 * across tab-throttling, sleep, reload, and navigation. The serialisable slice is mirrored
 * to `localStorage` on every change; a terminal session surfaces as `pendingCompletion`
 * for the hook to persist to Firestore.
 */

export const POMODORO_STORAGE_KEY = "mastery.pomodoro.v1";

const MINUTE_MS = 60_000;
const LONG_BREAK_EVERY = 4;

export interface PomodoroCompletion {
  outcome: PomodoroOutcome;
  config: PomodoroConfig;
  completedWorkIntervals: number;
  focusMinutes: number;
  startedAt: string;
  endedAt: string;
}

export interface PomodoroSnapshot extends PomodoroLiveState {
  /** Live remaining milliseconds in the current phase (0 when idle). */
  displayRemainingMs: number;
  /** 0–1 progress through the current phase. */
  phaseProgress: number;
  pendingCompletion: PomodoroCompletion | null;
}

export interface PomodoroStoreDeps {
  storage?: Storage | null;
  now?: () => number;
}

function phaseDurationMs(phase: PomodoroPhase, config: PomodoroConfig): number {
  switch (phase) {
    case "work":
      return config.workMinutes * MINUTE_MS;
    case "short-break":
      return config.shortBreakMinutes * MINUTE_MS;
    case "long-break":
      return config.longBreakMinutes * MINUTE_MS;
    default:
      return config.workMinutes * MINUTE_MS;
  }
}

function idleState(config: PomodoroConfig): PomodoroLiveState {
  return {
    phase: "idle",
    running: false,
    phaseEndsAt: null,
    remainingMs: config.workMinutes * MINUTE_MS,
    cyclesDone: 0,
    focusMs: 0,
    startedAt: null,
    config,
  };
}

const BASE_CONFIG: PomodoroConfig = { ...DEFAULT_POMODORO_CONFIG };

export function createPomodoroStore(deps: PomodoroStoreDeps = {}) {
  const now = deps.now ?? (() => Date.now());
  const storage =
    deps.storage !== undefined
      ? deps.storage
      : typeof window !== "undefined"
        ? window.localStorage
        : null;

  const listeners = new Set<() => void>();
  let live: PomodoroLiveState = readPersisted() ?? idleState(BASE_CONFIG);
  let pendingCompletion: PomodoroCompletion | null = null;
  let snapshot: PomodoroSnapshot = deriveSnapshot();
  const serverSnapshot: PomodoroSnapshot = {
    ...idleState(BASE_CONFIG),
    displayRemainingMs: BASE_CONFIG.workMinutes * MINUTE_MS,
    phaseProgress: 0,
    pendingCompletion: null,
  };

  function readPersisted(): PomodoroLiveState | null {
    if (!storage) return null;
    try {
      const raw = storage.getItem(POMODORO_STORAGE_KEY);
      if (!raw) return null;
      const parsed = pomodoroLiveStateSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  function persist(): void {
    if (!storage) return;
    try {
      storage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(live));
    } catch {
      // storage unavailable — the session is memory-only for this tab, non-fatal
    }
  }

  function currentRemainingMs(): number {
    if (live.phase === "idle") return live.config.workMinutes * MINUTE_MS;
    if (!live.running || live.phaseEndsAt === null) return Math.max(0, live.remainingMs);
    return Math.max(0, live.phaseEndsAt - now());
  }

  function deriveSnapshot(): PomodoroSnapshot {
    const displayRemainingMs = currentRemainingMs();
    const total = phaseDurationMs(live.phase, live.config);
    const phaseProgress =
      live.phase === "idle" || total === 0
        ? 0
        : Math.min(1, Math.max(0, 1 - displayRemainingMs / total));
    return { ...live, displayRemainingMs, phaseProgress, pendingCompletion };
  }

  function emit(): void {
    snapshot = deriveSnapshot();
    for (const listener of listeners) listener();
  }

  function setLive(next: PomodoroLiveState): void {
    live = next;
    persist();
    emit();
  }

  function nextBreakPhase(cyclesDone: number): PomodoroPhase {
    return cyclesDone % LONG_BREAK_EVERY === 0 ? "long-break" : "short-break";
  }

  /** Move past the current phase — used by both a natural expiry and an explicit skip. */
  function advance(): void {
    const timestamp = now();

    if (live.phase === "work") {
      const total = phaseDurationMs("work", live.config);
      const elapsed =
        live.running && live.phaseEndsAt !== null
          ? Math.min(total, Math.max(0, total - (live.phaseEndsAt - timestamp)))
          : total - Math.max(0, live.remainingMs);
      const cyclesDone = live.cyclesDone + 1;
      const focusMs = live.focusMs + Math.min(total, Math.max(0, elapsed));

      if (cyclesDone >= live.config.plannedCycles) {
        finishSession("completed", cyclesDone, focusMs, timestamp);
        return;
      }
      const breakPhase = nextBreakPhase(cyclesDone);
      setLive({
        ...live,
        phase: breakPhase,
        cyclesDone,
        focusMs,
        phaseEndsAt: timestamp + phaseDurationMs(breakPhase, live.config),
        remainingMs: phaseDurationMs(breakPhase, live.config),
        running: true,
      });
      return;
    }

    // Leaving a break → back to work.
    setLive({
      ...live,
      phase: "work",
      phaseEndsAt: timestamp + phaseDurationMs("work", live.config),
      remainingMs: phaseDurationMs("work", live.config),
      running: true,
    });
  }

  function finishSession(
    outcome: PomodoroOutcome,
    completedWorkIntervals: number,
    focusMs: number,
    timestamp: number,
  ): void {
    pendingCompletion = {
      outcome,
      config: live.config,
      completedWorkIntervals,
      focusMinutes: Math.round((focusMs / MINUTE_MS) * 10) / 10,
      startedAt: live.startedAt ?? new Date(timestamp).toISOString(),
      endedAt: new Date(timestamp).toISOString(),
    };
    live = idleState(live.config);
    persist();
    emit();
  }

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== POMODORO_STORAGE_KEY) return;
        const next = readPersisted();
        if (next) {
          live = next;
          emit();
        }
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },

    getSnapshot(): PomodoroSnapshot {
      return snapshot;
    },

    getServerSnapshot(): PomodoroSnapshot {
      return serverSnapshot;
    },

    /** Called once per second by the hook. Advances on expiry, otherwise refreshes the countdown. */
    tick(): void {
      if (!live.running || live.phaseEndsAt === null) return;
      if (now() >= live.phaseEndsAt) {
        advance();
      } else {
        emit();
      }
    },

    start(config: PomodoroConfig): void {
      const timestamp = now();
      setLive({
        phase: "work",
        running: true,
        phaseEndsAt: timestamp + config.workMinutes * MINUTE_MS,
        remainingMs: config.workMinutes * MINUTE_MS,
        cyclesDone: 0,
        focusMs: 0,
        startedAt: new Date(timestamp).toISOString(),
        config,
      });
    },

    pause(): void {
      if (!live.running || live.phase === "idle") return;
      setLive({
        ...live,
        running: false,
        remainingMs: currentRemainingMs(),
        phaseEndsAt: null,
      });
    },

    resume(): void {
      if (live.running || live.phase === "idle") return;
      setLive({
        ...live,
        running: true,
        phaseEndsAt: now() + Math.max(0, live.remainingMs),
      });
    },

    /** Skip to the end of the current phase. */
    skip(): void {
      if (live.phase === "idle") return;
      advance();
    },

    /** End the session now; a work interval in progress is credited pro-rata. */
    cancel(): void {
      if (live.phase === "idle") return;
      const timestamp = now();
      let focusMs = live.focusMs;
      if (live.phase === "work") {
        const total = phaseDurationMs("work", live.config);
        const elapsed =
          live.running && live.phaseEndsAt !== null
            ? Math.min(total, Math.max(0, total - (live.phaseEndsAt - timestamp)))
            : total - Math.max(0, live.remainingMs);
        focusMs += Math.min(total, Math.max(0, elapsed));
      }
      finishSession("abandoned", live.cyclesDone, focusMs, timestamp);
    },

    /** The hook calls this once it has written (or discarded) a pending completion. */
    acknowledgeCompletion(): void {
      if (pendingCompletion === null) return;
      pendingCompletion = null;
      emit();
    },

    /** Replace the idle preview config (used by the setup form before starting). */
    previewConfig(config: PomodoroConfig): void {
      if (live.phase !== "idle") return;
      setLive(idleState(config));
    },

    reset(): void {
      pendingCompletion = null;
      setLive(idleState({ ...BASE_CONFIG }));
    },
  };
}

export type PomodoroStore = ReturnType<typeof createPomodoroStore>;

export const pomodoroStore = createPomodoroStore();
