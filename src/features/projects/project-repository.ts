import { createFirestoreRepository } from "@/lib/repository";
import {
  projectCreateSchema,
  projectSchema,
  projectUpdateSchema,
  type Project,
  type ProjectCreate,
  type ProjectUpdate,
} from "./schema";

export const projectRepository = createFirestoreRepository<Project, ProjectCreate, ProjectUpdate>({
  collectionName: "projects",
  schema: projectSchema,
  createSchema: projectCreateSchema,
  updateSchema: projectUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

export async function listActiveProjects(): Promise<Project[]> {
  const page = await projectRepository.list({
    limit: 100,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((project) => project.status === "active");
}
