import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { loadDashboardAggregate } from "@/features/dashboard/dashboard-aggregate";
import { quickNoteRepository } from "@/features/dashboard/quick-note";

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

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("dashboard aggregate", () => {
  it("returns the user's quick notes and null placeholders for future features", async () => {
    await authService.signUpWithEmail({
      email: uniqueEmail("alice"),
      password: "sup3rsecret",
      displayName: "Alice",
    });

    await quickNoteRepository.create({ body: "first" });
    await quickNoteRepository.create({ body: "second" });

    const aggregate = await loadDashboardAggregate();

    expect(aggregate.quickNotes.map((note) => note.body).sort()).toEqual(["first", "second"]);
    expect(aggregate.tasksCompletedToday).toBeNull();
    expect(aggregate.focusMinutesToday).toBeNull();
    expect(aggregate.lifeScore).toBeNull();
    expect(aggregate.upcomingMilestones).toEqual([]);
    expect(Number.isNaN(Date.parse(aggregate.generatedAt))).toBe(false);
  });

  it("is scoped to the signed-in user", async () => {
    await authService.signUpWithEmail({
      email: uniqueEmail("alice"),
      password: "sup3rsecret",
      displayName: "Alice",
    });
    await quickNoteRepository.create({ body: "alice-only" });
    await authService.signOut();

    await authService.signUpWithEmail({
      email: uniqueEmail("bob"),
      password: "sup3rsecret",
      displayName: "Bob",
    });

    const aggregate = await loadDashboardAggregate();
    expect(aggregate.quickNotes).toHaveLength(0);
  });
});
