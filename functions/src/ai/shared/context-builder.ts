import type { Firestore } from "firebase-admin/firestore";
import type { AiIntent, ContextRef, TargetRef } from "./contracts";

/**
 * Per-intent context retrieval, per `docs/AI_ARCHITECTURE.md` §3: a minimal, bounded
 * slice of the caller's own data, never the whole domain. Reads defensively (loose field
 * access) rather than importing the client's Zod schemas — `functions/` and `src/` are
 * separate packages with no shared schema module today.
 */

export interface BuiltContext {
  text: string;
  refs: ContextRef[];
}

function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
}

function labelFor(data: Record<string, unknown>, fallback: string): string {
  return typeof data.title === "string" && data.title.trim().length > 0 ? data.title : fallback;
}

async function loadTarget(db: Firestore, uid: string, targetRef: TargetRef | null) {
  if (!targetRef) return null;
  const snap = await db.doc(`users/${uid}/${targetRef.collection}/${targetRef.id}`).get();
  if (!snap.exists) return null;
  const data = asRecord(snap.data());
  const ref: ContextRef = {
    collection: targetRef.collection,
    id: targetRef.id,
    label: labelFor(data, targetRef.id),
  };
  return { ref, data };
}

async function loadActiveGoals(db: Firestore, uid: string, max = 15) {
  const snap = await db
    .collection(`users/${uid}/goals`)
    .where("status", "==", "active")
    .limit(max)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, data: asRecord(doc.data()) }));
}

async function loadRecentJournal(db: Firestore, uid: string, includePrivate: boolean, max = 10) {
  const snap = await db
    .collection(`users/${uid}/journalEntries`)
    .orderBy("createdAt", "desc")
    .limit(max)
    .get();
  return snap.docs
    .map((doc) => ({ id: doc.id, data: asRecord(doc.data()) }))
    .filter((entry) => includePrivate || entry.data.isPrivate !== true);
}

async function loadRecentTasks(db: Firestore, uid: string, max = 30) {
  const snap = await db
    .collection(`users/${uid}/tasks`)
    .orderBy("updatedAt", "desc")
    .limit(max)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, data: asRecord(doc.data()) }));
}

export async function buildContext(
  db: Firestore,
  uid: string,
  intent: AiIntent,
  targetRef: TargetRef | null,
  includePrivateJournal: boolean,
): Promise<BuiltContext> {
  const refs: ContextRef[] = [];
  const parts: string[] = [];

  const target = await loadTarget(db, uid, targetRef);
  if (target) {
    refs.push(target.ref);
    parts.push(
      `Target (${targetRef!.collection} — ${target.ref.label}): ${JSON.stringify(target.data)}`,
    );
  }

  switch (intent) {
    case "coach-query":
    case "planning-recommendations": {
      const goals = await loadActiveGoals(db, uid);
      for (const goal of goals)
        refs.push({ collection: "goals", id: goal.id, label: labelFor(goal.data, goal.id) });
      if (goals.length > 0) {
        parts.push(
          `Active goals:\n${goals
            .map(
              (goal) =>
                `- ${labelFor(goal.data, goal.id)} (status: ${String(goal.data.goalStatus ?? "unknown")}, progress: ${String(goal.data.progress ?? "?")}%)`,
            )
            .join("\n")}`,
        );
      }
      break;
    }
    case "goal-breakdown": {
      // The target goal (loaded above) is the primary context; a first pass needs nothing further.
      break;
    }
    case "reflection-questions": {
      const entries = await loadRecentJournal(db, uid, includePrivateJournal);
      for (const entry of entries) {
        refs.push({
          collection: "journalEntries",
          id: entry.id,
          label: labelFor(entry.data, entry.id),
        });
      }
      if (entries.length > 0) {
        parts.push(
          `Recent journal entries:\n${entries
            .map(
              (entry) =>
                `- (${String(entry.data.entryType ?? "entry")}) ${labelFor(entry.data, "untitled")}`,
            )
            .join("\n")}`,
        );
      }
      break;
    }
    case "execution-patterns": {
      const tasks = await loadRecentTasks(db, uid);
      for (const task of tasks)
        refs.push({ collection: "tasks", id: task.id, label: labelFor(task.data, task.id) });
      if (tasks.length > 0) {
        parts.push(
          `Recent tasks:\n${tasks
            .map(
              (task) =>
                `- ${labelFor(task.data, task.id)} (status: ${String(task.data.taskStatus ?? "unknown")}, due: ${String(task.data.dueDate ?? "none")})`,
            )
            .join("\n")}`,
        );
      }
      break;
    }
  }

  return { text: parts.join("\n\n"), refs };
}
