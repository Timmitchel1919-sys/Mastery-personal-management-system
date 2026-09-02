import { createFirestoreRepository } from "@/lib/repository";
import {
  matrixItemCreateSchema,
  matrixItemSchema,
  matrixItemUpdateSchema,
  type MatrixItem,
  type MatrixItemCreate,
  type MatrixItemUpdate,
} from "./schema";

export const priorityMatrixRepository = createFirestoreRepository<
  MatrixItem,
  MatrixItemCreate,
  MatrixItemUpdate
>({
  collectionName: "priorityMatrixItems",
  schema: matrixItemSchema,
  createSchema: matrixItemCreateSchema,
  updateSchema: matrixItemUpdateSchema,
  defaultOrderBy: "createdAt",
  defaultDirection: "asc",
});

/** Bounded fetch of active (non-archived) matrix items, oldest first. */
export async function listActiveMatrixItems(limit = 200): Promise<MatrixItem[]> {
  const page = await priorityMatrixRepository.list({
    limit,
    orderBy: "createdAt",
    direction: "asc",
  });
  return page.items.filter((item) => item.status === "active");
}
