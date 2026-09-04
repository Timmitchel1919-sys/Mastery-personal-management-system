import { createFirestoreRepository } from "@/lib/repository";
import {
  skillReviewCreateSchema,
  skillReviewSchema,
  skillReviewUpdateSchema,
  type SkillReview,
  type SkillReviewCreate,
  type SkillReviewUpdate,
} from "./schema";

export const skillReviewRepository = createFirestoreRepository<
  SkillReview,
  SkillReviewCreate,
  SkillReviewUpdate
>({
  collectionName: "skillReviews",
  schema: skillReviewSchema,
  createSchema: skillReviewCreateSchema,
  updateSchema: skillReviewUpdateSchema,
  defaultOrderBy: "date",
  defaultDirection: "desc",
});

/**
 * Bounded fetch of the user's most recent skill reviews across all skills (active only).
 * Grouping by `skillId` happens client-side — avoids a composite index, the same
 * trade-off habit/routine logs make.
 */
export async function listRecentSkillReviews(limit = 300): Promise<SkillReview[]> {
  const page = await skillReviewRepository.list({
    limit,
    orderBy: "date",
    direction: "desc",
  });
  return page.items.filter((review) => review.status === "active");
}
