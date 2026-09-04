import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { journalRepository, listRecentJournalEntries } from "@/features/journal/journal-repository";
import type { JournalEntryCreate } from "@/features/journal/schema";

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

function entryInput(over: Partial<JournalEntryCreate> = {}): JournalEntryCreate {
  return {
    title: "A good day",
    entryType: "free-form",
    entryDate: "2026-09-02",
    content: "Today was productive.",
    gratitudeItems: [],
    moodRating: 4,
    energyLevel: 3,
    pillarIds: ["personal"],
    goalId: null,
    tags: ["work"],
    isPrivate: false,
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

describe("journal repository", () => {
  it("creates an entry linked to a goal, lists newest first, updates it, and archives it", async () => {
    const user = await signUpFresh("alice");

    const goal = await goalRepository.create({
      title: "Ship v1",
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

    const first = await journalRepository.create(
      entryInput({ title: "First entry", goalId: goal.id }),
    );
    expect(first.goalId).toBe(goal.id);
    expect(first.createdBy).toBe(user.uid);

    const second = await journalRepository.create(entryInput({ title: "Second entry" }));

    const listed = await listRecentJournalEntries();
    expect(listed.map((entry) => entry.title)).toEqual(["Second entry", "First entry"]);

    const updated = await journalRepository.update(first.id, { moodRating: 5, isPrivate: true });
    expect(updated.moodRating).toBe(5);
    expect(updated.isPrivate).toBe(true);
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await journalRepository.archive(first.id);
    expect((await listRecentJournalEntries()).map((entry) => entry.id)).toEqual([second.id]);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await journalRepository.create(entryInput({ title: "Private thoughts" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listRecentJournalEntries()).toHaveLength(0);
  });
});
