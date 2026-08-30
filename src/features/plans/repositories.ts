import { AppError } from "@/lib/errors";
import { createFirestoreRepository, type Repository } from "@/lib/repository";
import {
  PLAN_HORIZON_META,
  planCreateSchema,
  planSchema,
  planUpdateSchema,
  type Plan,
  type PlanCreate,
  type PlanHorizon,
  type PlanUpdate,
} from "./schema";

export type PlanRepository = Repository<Plan, PlanCreate, PlanUpdate>;

function makePlanRepository(horizon: PlanHorizon): PlanRepository {
  return createFirestoreRepository<Plan, PlanCreate, PlanUpdate>({
    collectionName: PLAN_HORIZON_META[horizon].collectionName,
    schema: planSchema,
    createSchema: planCreateSchema,
    updateSchema: planUpdateSchema,
    defaultOrderBy: "createdAt",
    defaultDirection: "asc",
  });
}

/** All five planning tiers (8B: five-year / one-year · 8C: quarter / month / week). */
export const PLAN_REPOSITORIES: Record<PlanHorizon, PlanRepository> = {
  "five-year": makePlanRepository("five-year"),
  "one-year": makePlanRepository("one-year"),
  quarter: makePlanRepository("quarter"),
  month: makePlanRepository("month"),
  week: makePlanRepository("week"),
};

export function getPlanRepository(horizon: PlanHorizon): PlanRepository {
  const repository = PLAN_REPOSITORIES[horizon];
  if (!repository) {
    throw new AppError(`No repository is wired for the "${horizon}" planning tier`, {
      code: "unavailable",
    });
  }
  return repository;
}

export async function listActivePlans(horizon: PlanHorizon): Promise<Plan[]> {
  const page = await getPlanRepository(horizon).list({
    limit: 100,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((plan) => plan.status === "active");
}
