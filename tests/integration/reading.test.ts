import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { bookRepository, listActiveBooks } from "@/features/reading/book-repository";
import type { BookCreate } from "@/features/reading/schema";

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

function bookInput(over: Partial<BookCreate> = {}): BookCreate {
  return {
    title: "Deep Work",
    author: "Cal Newport",
    readingStatus: "currently-reading",
    currentPage: 50,
    totalPages: 200,
    startedDate: "2026-09-01",
    completedDate: null,
    highlights: [{ id: "h1", quote: "Focus is a skill.", pageNumber: 12 }],
    lessons: ["Protect deep work blocks"],
    actionItems: [{ id: "a1", title: "Block 2h tomorrow", completed: false }],
    notes: "",
    pillarIds: ["personal"],
    goalId: null,
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

describe("reading repository", () => {
  it("creates a book linked to a goal, completes an action item, marks it finished, and archives it", async () => {
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

    const book = await bookRepository.create(bookInput({ goalId: goal.id }));
    expect(book.goalId).toBe(goal.id);
    expect(book.highlights[0]?.quote).toBe("Focus is a skill.");
    expect(book.createdBy).toBe(user.uid);

    const withActionDone = await bookRepository.update(book.id, {
      actionItems: [{ id: "a1", title: "Block 2h tomorrow", completed: true }],
    });
    expect(withActionDone.actionItems[0]?.completed).toBe(true);
    expect(withActionDone.version).toBeGreaterThanOrEqual(2);

    const finished = await bookRepository.update(book.id, {
      readingStatus: "completed",
      currentPage: 200,
      completedDate: "2026-09-10",
    });
    expect(finished.readingStatus).toBe("completed");

    await bookRepository.archive(book.id);
    expect(await listActiveBooks()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await bookRepository.create(bookInput({ title: "Private reading" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveBooks()).toHaveLength(0);
  });
});
