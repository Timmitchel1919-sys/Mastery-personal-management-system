import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { goalRepository } from "@/features/goals/goal-repository";
import { skillRepository, listActiveSkills } from "@/features/skills/skill-repository";
import {
  skillReviewRepository,
  listRecentSkillReviews,
} from "@/features/skills/skill-review-repository";
import { currentProficiency } from "@/features/skills/schema";
import type { SkillCreate } from "@/features/skills/schema";

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

function skillInput(over: Partial<SkillCreate> = {}): SkillCreate {
  return {
    title: "Public speaking",
    description: "",
    category: "interpersonal",
    startingProficiency: 2,
    targetProficiency: 4,
    practicePlan: "Present weekly",
    evidence: [],
    resources: [],
    goalId: null,
    pillarIds: ["societal"],
    nextReviewDate: "2026-09-15",
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

describe("skills repository", () => {
  it("creates a skill linked to a goal, logs reviews that derive current proficiency, and archives it", async () => {
    const user = await signUpFresh("alice");

    const goal = await goalRepository.create({
      title: "Grow as a leader",
      description: "",
      pillarIds: ["societal"],
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

    const skill = await skillRepository.create(skillInput({ goalId: goal.id }));
    expect(skill.goalId).toBe(goal.id);
    expect(skill.createdBy).toBe(user.uid);
    expect(currentProficiency(skill, [])).toBe(2);

    const review1 = await skillReviewRepository.create({
      skillId: skill.id,
      date: "2026-09-05",
      proficiency: 3,
      notes: "Getting more comfortable",
    });
    const review2 = await skillReviewRepository.create({
      skillId: skill.id,
      date: "2026-09-12",
      proficiency: 4,
      notes: "Led the retro",
    });

    const reviews = await listRecentSkillReviews();
    expect(reviews.map((r) => r.id).sort()).toEqual([review1.id, review2.id].sort());
    expect(currentProficiency(skill, reviews)).toBe(4);

    await skillRepository.archive(skill.id);
    expect(await listActiveSkills()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await skillRepository.create(skillInput({ title: "Private skill" }));
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveSkills()).toHaveLength(0);
    expect(await listRecentSkillReviews()).toHaveLength(0);
  });
});
