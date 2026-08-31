import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import {
  listRecentSessions,
  pomodoroSessionRepository,
} from "@/features/pomodoro/pomodoro-session-repository";
import type { PomodoroSessionCreate } from "@/features/pomodoro/schema";

const PROJECT_ID = "demo-mastery";
const AUTH_HOST = "http://127.0.0.1:9099";
const FIRESTORE_HOST = "http://127.0.0.1:8080";

async function resetEmulators() {
  await fetch(`${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
  await fetch(
    `${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
}

function uniqueEmail(tag: string) {
  return `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUpFresh(tag: string) {
  return authService.signUpWithEmail({
    email: uniqueEmail(tag),
    password: "sup3rsecret",
    displayName: tag,
  });
}

function sessionInput(over: Partial<PomodoroSessionCreate> = {}): PomodoroSessionCreate {
  return {
    label: "Write the report",
    goalId: null,
    projectId: null,
    outcome: "completed",
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    plannedCycles: 4,
    completedWorkIntervals: 4,
    focusMinutes: 100,
    startedAt: "2026-08-31T09:00:00.000Z",
    endedAt: "2026-08-31T11:10:00.000Z",
    notes: "",
    ...over,
  };
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("pomodoro session repository", () => {
  it("stores a finished session and lists it back, newest first", async () => {
    const user = await signUpFresh("alice");

    const first = await pomodoroSessionRepository.create(
      sessionInput({ label: "Morning focus", completedWorkIntervals: 2, focusMinutes: 50 }),
    );
    const second = await pomodoroSessionRepository.create(
      sessionInput({ label: "Afternoon focus", outcome: "abandoned" }),
    );

    expect(first.createdBy).toBe(user.uid);

    const recent = await listRecentSessions(10);
    expect(recent.map((session) => session.id)).toEqual([second.id, first.id]);
    expect(recent[0]?.outcome).toBe("abandoned");
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await pomodoroSessionRepository.create(sessionInput({ label: "Private focus" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listRecentSessions(10)).toHaveLength(0);
  });
});
