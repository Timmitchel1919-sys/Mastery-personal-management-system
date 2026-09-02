import { conflictedBlockCount, detectConflicts } from "./detect-conflicts";
import { blockDurationMinutes, type TimeBlock } from "./schema";

export interface TimeBlockStats {
  blocks: number;
  planned: number;
  done: number;
  skipped: number;
  /** Minutes across `planned` + `done` blocks (what is on the schedule). */
  scheduledMinutes: number;
  /** Minutes across `done` blocks only. */
  completedMinutes: number;
  /** Distinct blocks involved in at least one overlap. */
  conflictedBlocks: number;
}

/** Roll a set of time blocks into headline statistics. Pure. */
export function summarizeTimeBlocks(blocks: TimeBlock[]): TimeBlockStats {
  let planned = 0;
  let done = 0;
  let skipped = 0;
  let scheduledMinutes = 0;
  let completedMinutes = 0;

  for (const block of blocks) {
    const minutes = blockDurationMinutes(block);
    if (block.blockStatus === "planned") {
      planned += 1;
      scheduledMinutes += minutes;
    } else if (block.blockStatus === "done") {
      done += 1;
      scheduledMinutes += minutes;
      completedMinutes += minutes;
    } else {
      skipped += 1;
    }
  }

  return {
    blocks: blocks.length,
    planned,
    done,
    skipped,
    scheduledMinutes,
    completedMinutes,
    conflictedBlocks: conflictedBlockCount(detectConflicts(blocks)),
  };
}
