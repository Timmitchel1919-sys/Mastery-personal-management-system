import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { kpiRepository } from "@/features/kpis/kpi-repository";
import { kpiEntryRepository } from "@/features/kpis/kpi-entry-repository";
import type { KpiCreate } from "@/features/kpis/schema";
import { computeLifeScore } from "@/features/life-score/life-score";
import {
  lifeScoreEntryRepository,
  listRecentLifeScoreEntries,
} from "@/features/life-score/life-score-entry-repository";
import { lifeScoreEntryInputFromResult } from "@/features/life-score/schema";

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

function kpiInput(over: Partial<KpiCreate> = {}): KpiCreate {
  return {
    title: "Sleep hours",
    description: "",
    category: "Health",
    pillarIds: [],
    unit: "hours",
    direction: "higher-is-better",
    targetValue: 8,
    weight: 2,
    goalId: null,
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

describe("life score", () => {
  it("computes a score from real KPI entries and saves/overwrites today's snapshot", async () => {
    const user = await signUpFresh("alice");

    const kpi = await kpiRepository.create(kpiInput());
    await kpiEntryRepository.create({ kpiId: kpi.id, date: "2026-09-01", value: 4, note: "" });

    const result = computeLifeScore([kpi], new Map([[kpi.id, 4]]));
    expect(result.score).toBe(50);
    expect(result.factors).toHaveLength(1);

    const input = lifeScoreEntryInputFromResult(result.score!, result.factors, "2026-09-05", "");
    const saved = await lifeScoreEntryRepository.create(input);
    expect(saved.createdBy).toBe(user.uid);
    expect(saved.score).toBe(50);

    // A second save on the same date overwrites, rather than duplicating, the day's entry
    // (the app-level `useLifeScore.saveToday` upserts by date; here we exercise the update
    // path directly against the repository).
    const updated = await lifeScoreEntryRepository.update(saved.id, {
      ...input,
      score: 75,
    });
    expect(updated.score).toBe(75);

    const history = await listRecentLifeScoreEntries();
    expect(history).toHaveLength(1);
    expect(history[0]?.score).toBe(75);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await lifeScoreEntryRepository.create(
      lifeScoreEntryInputFromResult(60, [], "2026-09-01", "private"),
    );
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listRecentLifeScoreEntries()).toHaveLength(0);
  });
});
