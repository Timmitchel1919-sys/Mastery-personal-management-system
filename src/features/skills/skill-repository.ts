import { createFirestoreRepository } from "@/lib/repository";
import {
  skillCreateSchema,
  skillSchema,
  skillUpdateSchema,
  type Skill,
  type SkillCreate,
  type SkillUpdate,
} from "./schema";

export const skillRepository = createFirestoreRepository<Skill, SkillCreate, SkillUpdate>({
  collectionName: "skills",
  schema: skillSchema,
  createSchema: skillCreateSchema,
  updateSchema: skillUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/** Bounded fetch of active (non-archived) skills. */
export async function listActiveSkills(limit = 100): Promise<Skill[]> {
  const page = await skillRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((skill) => skill.status === "active");
}

export interface SkillOption {
  id: string;
  title: string;
}

/** Active skills as `{ id, title }` — for pickers that link something to a skill. */
export async function listSkillOptions(): Promise<SkillOption[]> {
  return (await listActiveSkills()).map((skill) => ({ id: skill.id, title: skill.title }));
}
