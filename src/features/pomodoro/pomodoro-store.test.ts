import { beforeEach, describe, expect, it } from "vitest";
import { createPomodoroStore, POMODORO_STORAGE_KEY } from "./pomodoro-store";
import type { PomodoroConfig } from "./schema";

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

const MIN = 60_000;

const config: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  plannedCycles: 2,
  label: "Write the report",
  goalId: null,
  projectId: null,
};

let clock: number;
let storage: Storage;

beforeEach(() => {
  clock = 1_000_000;
  storage = fakeStorage();
});

function makeStore() {
  return createPomodoroStore({ storage, now: () => clock });
}

describe("pomodoro store", () => {
  it("starts a work phase with a full countdown", () => {
    const store = makeStore();
    store.start(config);
    const snap = store.getSnapshot();
    expect(snap.phase).toBe("work");
    expect(snap.running).toBe(true);
    expect(snap.displayRemainingMs).toBe(25 * MIN);
    expect(snap.startedAt).not.toBeNull();
  });

  it("advances work → short break → work and credits full focus intervals", () => {
    const store = makeStore();
    store.start(config);

    clock += 25 * MIN;
    store.tick();
    let snap = store.getSnapshot();
    expect(snap.phase).toBe("short-break");
    expect(snap.cyclesDone).toBe(1);
    expect(snap.focusMs).toBe(25 * MIN);

    clock += 5 * MIN;
    store.tick();
    snap = store.getSnapshot();
    expect(snap.phase).toBe("work");
    expect(snap.cyclesDone).toBe(1);
  });

  it("produces a completed session once the planned intervals are done", () => {
    const store = makeStore();
    store.start(config);

    clock += 25 * MIN; // interval 1
    store.tick();
    clock += 5 * MIN; // break
    store.tick();
    clock += 25 * MIN; // interval 2 → target reached
    store.tick();

    const snap = store.getSnapshot();
    expect(snap.phase).toBe("idle");
    expect(snap.running).toBe(false);
    expect(snap.pendingCompletion).toMatchObject({
      outcome: "completed",
      completedWorkIntervals: 2,
      focusMinutes: 50,
    });

    store.acknowledgeCompletion();
    expect(store.getSnapshot().pendingCompletion).toBeNull();
  });

  it("uses a long break after every fourth interval", () => {
    const store = makeStore();
    store.start({ ...config, plannedCycles: 6 });
    for (let i = 0; i < 4; i += 1) {
      clock += 25 * MIN;
      store.tick();
      if (i < 3) {
        clock += 5 * MIN;
        store.tick();
      }
    }
    expect(store.getSnapshot().phase).toBe("long-break");
  });

  it("freezes the countdown on pause and continues from it on resume", () => {
    const store = makeStore();
    store.start(config);

    clock += 1 * MIN;
    store.pause();
    let snap = store.getSnapshot();
    expect(snap.running).toBe(false);
    expect(snap.displayRemainingMs).toBe(24 * MIN);

    clock += 10 * MIN; // time passes while paused — must not count down
    expect(store.getSnapshot().displayRemainingMs).toBe(24 * MIN);

    store.resume();
    snap = store.getSnapshot();
    expect(snap.running).toBe(true);
    expect(snap.displayRemainingMs).toBe(24 * MIN);
  });

  it("credits a partial interval when a work phase is skipped", () => {
    const store = makeStore();
    store.start(config);
    clock += 10 * MIN;
    store.skip();
    const snap = store.getSnapshot();
    expect(snap.phase).toBe("short-break");
    expect(snap.focusMs).toBe(10 * MIN);
  });

  it("ends early with an abandoned completion and pro-rata focus", () => {
    const store = makeStore();
    store.start(config);
    clock += 5 * MIN;
    store.cancel();
    const snap = store.getSnapshot();
    expect(snap.phase).toBe("idle");
    expect(snap.pendingCompletion).toMatchObject({
      outcome: "abandoned",
      completedWorkIntervals: 0,
      focusMinutes: 5,
    });
  });

  it("restores a running session from storage in another instance", () => {
    const first = makeStore();
    first.start(config);
    clock += 3 * MIN;
    first.pause();

    expect(storage.getItem(POMODORO_STORAGE_KEY)).toBeTruthy();

    const second = createPomodoroStore({ storage, now: () => clock });
    const snap = second.getSnapshot();
    expect(snap.phase).toBe("work");
    expect(snap.running).toBe(false);
    expect(snap.displayRemainingMs).toBe(22 * MIN);
  });

  it("ignores a corrupt persisted blob", () => {
    storage.setItem(POMODORO_STORAGE_KEY, "{ not valid json");
    const store = createPomodoroStore({ storage, now: () => clock });
    expect(store.getSnapshot().phase).toBe("idle");
  });
});
