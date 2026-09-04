import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import {
  learningItemRepository,
  listActiveLearningItems,
} from "@/features/learning/learning-item-repository";
import {
  listRecentStudySessions,
  studySessionRepository,
} from "@/features/learning/study-session-repository";
import type { LearningItemCreate } from "@/features/learning/schema";

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

function itemInput(over: Partial<LearningItemCreate> = {}): LearningItemCreate {
  return {
    title: "Advanced TypeScript",
    description: "",
    itemType: "course",
    learningStatus: "in-progress",
    provider: "Frontend Masters",
    targetCompletionDate: null,
    resources: [],
    lessons: [{ id: "l1", title: "Generics", completed: false }],
    assessmentNotes: "",
    notes: "",
    pillarIds: ["personal"],
    goalId: null,
    skillId: null,
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

describe("learning repository", () => {
  it("creates an item linked to a goal, toggles a lesson, logs a session, and archives it", async () => {
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

    const item = await learningItemRepository.create(itemInput({ goalId: goal.id }));
    expect(item.goalId).toBe(goal.id);
    expect(item.createdBy).toBe(user.uid);

    const lessonDone = await learningItemRepository.update(item.id, {
      lessons: [{ id: "l1", title: "Generics", completed: true }],
    });
    expect(lessonDone.lessons[0]?.completed).toBe(true);
    expect(lessonDone.version).toBeGreaterThanOrEqual(2);

    const session = await studySessionRepository.create({
      learningItemId: item.id,
      date: "2026-09-02",
      minutes: 45,
      notes: "",
    });
    expect(session.learningItemId).toBe(item.id);
    expect(session.createdBy).toBe(user.uid);

    const sessions = await listRecentStudySessions();
    expect(sessions).toHaveLength(1);

    await learningItemRepository.archive(item.id);
    expect(await listActiveLearningItems()).toHaveLength(0);
    // Archiving the item does not delete its study sessions.
    expect(await listRecentStudySessions()).toHaveLength(1);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await learningItemRepository.create(itemInput({ title: "Private course" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveLearningItems()).toHaveLength(0);
    expect(await listRecentStudySessions()).toHaveLength(0);
  });
});
