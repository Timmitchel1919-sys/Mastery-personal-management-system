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

export interface ProjectOption {
  id: string;
  title: string;
}

/** Active projects as `{ id, title }` — for pickers that link something to a project. */
export async function listProjectOptions(): Promise<ProjectOption[]> {
  return (await listActiveProjects()).map((project) => ({
    id: project.id,
    title: project.title,
  }));
}
