import { MATRIX_QUADRANTS, type MatrixItem, type MatrixQuadrant } from "./schema";

export interface MatrixStats {
  total: number;
  completed: number;
  open: number;
  /** Open (not completed) item count per quadrant. */
  openByQuadrant: Record<MatrixQuadrant, number>;
}

/** Roll a set of matrix items into headline counts. Pure. */
export function summarizeMatrix(items: MatrixItem[]): MatrixStats {
  const openByQuadrant = Object.fromEntries(
    MATRIX_QUADRANTS.map((quadrant) => [quadrant, 0]),
  ) as Record<MatrixQuadrant, number>;

  let completed = 0;
  for (const item of items) {
    if (item.completed) {
      completed += 1;
    } else {
      openByQuadrant[item.quadrant] += 1;
    }
  }

  return {
    total: items.length,
    completed,
    open: items.length - completed,
    openByQuadrant,
  };
}
