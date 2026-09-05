import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import {
  listActiveRecoveryGoals,
  recoveryGoalRepository,
} from "@/features/recovery/recovery-goal-repository";
import type { RecoveryGoalCreate } from "@/features/recovery/recovery-goal-schema";

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

function goalInput(over: Partial<RecoveryGoalCreate> = {}): RecoveryGoalCreate {
  return {
    behavior: "Late-night doomscrolling",
    description: "",
    motivation: "Reclaim my mornings",
    startDate: "2026-09-01",
    triggers: ["Boredom after dinner"],
    warningSigns: ["Phone in bed"],
    copingStrategies: ["Charge phone in the kitchen"],
    supportNotes: "",
    faithBasedEncouragement: false,
    recoveryStatus: "active",
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

describe("recovery goals repository", () => {
  it("creates, updates the status, and archives a recovery goal", async () => {
    const user = await signUpFresh("alice");

    const goal = await recoveryGoalRepository.create(goalInput());
    expect(goal.behavior).toBe("Late-night doomscrolling");
    expect(goal.createdBy).toBe(user.uid);

    const updated = await recoveryGoalRepository.update(goal.id, { recoveryStatus: "challenging" });
    expect(updated.recoveryStatus).toBe("challenging");
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await recoveryGoalRepository.archive(goal.id);
    expect(await listActiveRecoveryGoals()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await recoveryGoalRepository.create(goalInput({ behavior: "Private goal" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveRecoveryGoals()).toHaveLength(0);
  });
});
