import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { kpiRepository, listActiveKpis } from "@/features/kpis/kpi-repository";
import { kpiEntryRepository, listRecentKpiEntries } from "@/features/kpis/kpi-entry-repository";
import { kpiAttainment } from "@/features/kpis/schema";
import type { KpiCreate } from "@/features/kpis/schema";

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
    pillarIds: ["personal"],
    unit: "hours",
    direction: "higher-is-better",
    targetValue: 8,
    weight: 3,
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

describe("kpis repository", () => {
  it("creates a KPI linked to a goal, logs entries, and archives it", async () => {
    const user = await signUpFresh("alice");

    const goal = await goalRepository.create({
      title: "Improve wellbeing",
      description: "",
      pillarIds: ["personal"],
      parentPlanId: null,
      startDate: null,
      targetDate: null,
      goalStatus: "in-progress",
      priority: "high",
      progress: 0,
      measurementType: "binary",
      targetValue: null,
      currentValue: null,
      unit: "",
      reviewFrequency: "none",
      notes: "",
    });

    const kpi = await kpiRepository.create(kpiInput({ goalId: goal.id }));
    expect(kpi.goalId).toBe(goal.id);
    expect(kpi.createdBy).toBe(user.uid);

    await kpiEntryRepository.create({ kpiId: kpi.id, date: "2026-09-01", value: 4, note: "" });
    const entry2 = await kpiEntryRepository.create({
      kpiId: kpi.id,
      date: "2026-09-05",
      value: 8,
      note: "Slept in",
    });

    const entries = await listRecentKpiEntries();
    expect(entries.map((e) => e.id).sort()).toEqual(
      [entry2.id, entries.find((e) => e.date === "2026-09-01")!.id].sort(),
    );
    expect(kpiAttainment(kpi, entry2.value)).toBe(100);

    await kpiRepository.archive(kpi.id);
    expect(await listActiveKpis()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await kpiRepository.create(kpiInput({ title: "Private KPI" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveKpis()).toHaveLength(0);
    expect(await listRecentKpiEntries()).toHaveLength(0);
  });
});
