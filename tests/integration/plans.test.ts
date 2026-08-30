import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { getPlanRepository, listActivePlans } from "@/features/plans/repositories";
import { PLAN_HORIZONS, type PlanCreate, type PlanHorizon } from "@/features/plans/schema";

function planInput(
  fields: Pick<PlanCreate, "horizon" | "title" | "objective" | "pillarIds"> & Partial<PlanCreate>,
): PlanCreate {
  return {
    desiredOutcomes: [],
    keyMeasures: [],
    startDate: null,
    endDate: null,
    planStatus: "planned",
    progress: 0,
    reviewNotes: "",
    parentId: null,
    ...fields,
  };
}

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

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("plan repositories", () => {
  it("keeps every tier in its own collection", async () => {
    await signUpFresh("alice");

    const titleByHorizon: Record<PlanHorizon, string> = {
      "five-year": "Financial base",
      "one-year": "Save 20%",
      quarter: "Ship the MVP",
      month: "Draft the plan",
      week: "Outline it",
    };

    for (const horizon of PLAN_HORIZONS) {
      await getPlanRepository(horizon).create(
        planInput({
          horizon,
          title: titleByHorizon[horizon],
          objective: `Objective for ${horizon}.`,
          pillarIds: ["personal"],
        }),
      );
    }

    for (const horizon of PLAN_HORIZONS) {
      const plans = await listActivePlans(horizon);
      expect(plans.map((plan) => plan.title)).toEqual([titleByHorizon[horizon]]);
    }
  });

  it("defaults, then updates progress and status, then archives", async () => {
    await signUpFresh("alice");
    const created = await getPlanRepository("five-year").create(
      planInput({
        horizon: "five-year",
        title: "Health",
        objective: "Be strong at 60.",
        pillarIds: ["personal", "spiritual"],
      }),
    );
    expect(created.planStatus).toBe("planned");
    expect(created.progress).toBe(0);
    expect(created.startDate).toBeNull();
    expect(created.parentId).toBeNull();

    const updated = await getPlanRepository("five-year").update(created.id, {
      progress: 55,
      planStatus: "active",
    });
    expect(updated.progress).toBe(55);
    expect(updated.planStatus).toBe("active");
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await getPlanRepository("five-year").archive(created.id);
    expect(await listActivePlans("five-year")).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await getPlanRepository("one-year").create(
      planInput({
        horizon: "one-year",
        title: "Private plan",
        objective: "…",
        pillarIds: ["personal"],
      }),
    );
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActivePlans("one-year")).toHaveLength(0);
  });

  it("wires a repository for every planning tier", () => {
    for (const horizon of PLAN_HORIZONS) {
      expect(() => getPlanRepository(horizon)).not.toThrow();
    }
  });
});
