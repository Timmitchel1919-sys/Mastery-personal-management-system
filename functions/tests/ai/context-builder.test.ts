import { describe, expect, it } from "vitest";
import { buildContext } from "../../src/ai/shared/context-builder";
import { asFirestore, createFakeFirestore } from "./fakes";

describe("buildContext", () => {
  it("loads the target record and its ref when a targetRef is given", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/goals/g1", { title: "Ship v1", status: "active" });
    const db = asFirestore(fake);

    const context = await buildContext(
      db,
      "u1",
      "goal-breakdown",
      { collection: "goals", id: "g1" },
      false,
    );

    expect(context.refs).toEqual([{ collection: "goals", id: "g1", label: "Ship v1" }]);
    expect(context.text).toContain("Ship v1");
  });

  it("returns no refs when the targetRef doesn't exist", async () => {
    const fake = createFakeFirestore();
    const db = asFirestore(fake);

    const context = await buildContext(
      db,
      "u1",
      "goal-breakdown",
      { collection: "goals", id: "missing" },
      false,
    );
    expect(context.refs).toEqual([]);
  });

  it("pulls active goals for coach-query and planning-recommendations", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/goals/g1", {
      title: "Ship v1",
      status: "active",
      goalStatus: "in-progress",
      progress: 40,
    });
    fake.seedDoc("users/u1/goals/g2", { title: "Old goal", status: "archived" });
    const db = asFirestore(fake);

    const context = await buildContext(db, "u1", "coach-query", null, false);

    expect(context.refs).toEqual([{ collection: "goals", id: "g1", label: "Ship v1" }]);
    expect(context.text).toContain("Ship v1");
    expect(context.text).not.toContain("Old goal");
  });

  it("excludes private journal entries unless includePrivateJournal is true", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/journalEntries/j1", {
      title: "Public",
      entryType: "free-form",
      isPrivate: false,
    });
    fake.seedDoc("users/u1/journalEntries/j2", {
      title: "Private",
      entryType: "free-form",
      isPrivate: true,
    });
    const db = asFirestore(fake);

    const excluded = await buildContext(db, "u1", "reflection-questions", null, false);
    expect(excluded.refs.map((ref) => ref.id)).toEqual(["j1"]);

    const included = await buildContext(db, "u1", "reflection-questions", null, true);
    expect(included.refs.map((ref) => ref.id).sort()).toEqual(["j1", "j2"]);
  });

  it("pulls recent tasks for execution-patterns", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/tasks/t1", {
      title: "Write report",
      taskStatus: "done",
      dueDate: "2026-09-01",
    });
    const db = asFirestore(fake);

    const context = await buildContext(db, "u1", "execution-patterns", null, false);
    expect(context.refs).toEqual([{ collection: "tasks", id: "t1", label: "Write report" }]);
    expect(context.text).toContain("done");
  });

  it("returns empty context when nothing relevant exists", async () => {
    const fake = createFakeFirestore();
    const db = asFirestore(fake);

    const context = await buildContext(db, "u1", "coach-query", null, false);
    expect(context).toEqual({ text: "", refs: [] });
  });
});
