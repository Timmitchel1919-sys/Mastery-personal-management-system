import { progressToTarget } from "./schema";
import type { Skill, SkillReview } from "./schema";

export interface SkillsStats {
  total: number;
  dueForReview: number;
  avgProgressToTarget: number | null;
}

/** Roll a set of skills + their reviews into headline stats. Pure. */
export function summarizeSkills(
  skills: Skill[],
  reviewsBySkill: Map<string, SkillReview[]>,
  today: string = new Date().toISOString().slice(0, 10),
): SkillsStats {
  if (skills.length === 0) {
    return { total: 0, dueForReview: 0, avgProgressToTarget: null };
  }

  let dueForReview = 0;
  let progressSum = 0;

  for (const skill of skills) {
    if (skill.nextReviewDate && skill.nextReviewDate <= today) dueForReview += 1;
    progressSum += progressToTarget(skill, reviewsBySkill.get(skill.id) ?? []);
  }

  return {
    total: skills.length,
    dueForReview,
    avgProgressToTarget: Math.round(progressSum / skills.length),
  };
}
