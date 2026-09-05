import { describe, expect, it } from "vitest";
import { collectWeekFacts, toDateKey } from "../../src/scheduled/weekly-summary/collect-week-data";
import type { WeekRange } from "../../src/scheduled/weekly-summary/week-window";
import { asFirestore, createFakeFirestore } from "../ai/fakes";

const range: WeekRange = { startIso: "2026-08-31", endIso: "2026-09-07" };

describe("toDateKey", () => {
  it("reads a plain ISO string", () => {
    expect(toDateKey("2026-09-01T10:00:00.000Z")).toBe("2026-09-01");
  });

  it("reads a Firestore-Timestamp-shaped object via toDate()", () => {
    expect(toDateKey({ toDate: () => new Date("2026-09-01T10:00:00.000Z") })).toBe("2026-09-01");
  });

  it("returns null for anything else", () => {
    expect(toDateKey(undefined)).toBeNull();
    expect(toDateKey(42)).toBeNull();
  });
});

describe("collectWeekFacts", () => {
  it("returns all-zero/null facts for a user with no data", async () => {
    const db = asFirestore(createFakeFirestore());
    const facts = await collectWeekFacts(db, "u1", range);
    expect(facts).toEqual({
      goalsCompleted: [],
      milestonesCompleted: [],
      tasksCompleted: 0,
      tasksCompletedOnTime: 0,
      tasksCompletedLate: 0,
      tasksCancelled: 0,
      tasksStillOverdue: 0,
      habitConsistencyPercent: null,
      focusMinutes: 0,
      kpiMovements: [],
    });
  });

  it("counts goals/milestones completed within the week, by updatedAt", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/goals/g1", {
      title: "Ship v1",
      goalStatus: "achieved",
      updatedAt: "2026-09-02T10:00:00.000Z",
    });
    fake.seedDoc("users/u1/goals/g2", {
      title: "Old goal",
      goalStatus: "achieved",
      updatedAt: "2026-01-01T10:00:00.000Z",
    });
    fake.seedDoc("users/u1/milestones/m1", {
      title: "Beta launch",
      milestoneStatus: "done",
      updatedAt: "2026-09-03T10:00:00.000Z",
    });
    const db = asFirestore(fake);

    const facts = await collectWeekFacts(db, "u1", range);
    expect(facts.goalsCompleted).toEqual(["Ship v1"]);
    expect(facts.milestonesCompleted).toEqual(["Beta launch"]);
  });

  it("classifies tasks: completed on time, completed late, cancelled, still overdue", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/tasks/t1", {
      taskStatus: "done",
      dueDate: "2026-09-03",
      completedAt: "2026-09-02T10:00:00.000Z",
    });
    fake.seedDoc("users/u1/tasks/t2", {
      taskStatus: "done",
      dueDate: "2026-09-01",
      completedAt: "2026-09-03T10:00:00.000Z",
    });
    fake.seedDoc("users/u1/tasks/t3", {
      taskStatus: "cancelled",
      updatedAt: "2026-09-02T10:00:00.000Z",
    });
    fake.seedDoc("users/u1/tasks/t4", {
      taskStatus: "todo",
      dueDate: "2026-09-01",
    });
    fake.seedDoc("users/u1/tasks/t5", {
      taskStatus: "todo",
      dueDate: "2026-09-10",
    });
    const db = asFirestore(fake);

    const facts = await collectWeekFacts(db, "u1", range);
    expect(facts.tasksCompleted).toBe(2);
    expect(facts.tasksCompletedOnTime).toBe(1);
    expect(facts.tasksCompletedLate).toBe(1);
    expect(facts.tasksCancelled).toBe(1);
    expect(facts.tasksStillOverdue).toBe(1);
  });

  it("computes habit consistency as completed logs over (active habits * 7)", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/habits/h1", { status: "active" });
    fake.seedDoc("users/u1/habits/h2", { status: "active" });
    fake.seedDoc("users/u1/habits/h3", { status: "archived" });
    const datesInRange = [
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ];
    datesInRange.forEach((date, i) => {
      fake.seedDoc(`users/u1/habitLogs/l${i}`, { habitId: "h1", date, logStatus: "completed" });
    });
    const db = asFirestore(fake);

    const facts = await collectWeekFacts(db, "u1", range);
    // 7 completed logs over 2 active habits * 7 expected days = 50%
    expect(facts.habitConsistencyPercent).toBe(50);
  });

  it("returns null habit consistency with no active habits", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/habits/h1", { status: "archived" });
    const db = asFirestore(fake);

    const facts = await collectWeekFacts(db, "u1", range);
    expect(facts.habitConsistencyPercent).toBeNull();
  });

  it("sums focus minutes for sessions started within the week", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/focusSessions/f1", {
      startedAt: "2026-09-02T09:00:00.000Z",
      actualMinutes: 45,
    });
    fake.seedDoc("users/u1/focusSessions/f2", {
      startedAt: "2026-01-01T09:00:00.000Z",
      actualMinutes: 999,
    });
    const db = asFirestore(fake);

    const facts = await collectWeekFacts(db, "u1", range);
    expect(facts.focusMinutes).toBe(45);
  });

  it("computes KPI movement from first to last entry within the week", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/kpis/k1", { title: "Sleep hours", status: "active" });
    fake.seedDoc("users/u1/kpiEntries/e1", { kpiId: "k1", date: "2026-09-01", value: 6 });
    fake.seedDoc("users/u1/kpiEntries/e2", { kpiId: "k1", date: "2026-09-05", value: 8 });
    fake.seedDoc("users/u1/kpiEntries/e3", { kpiId: "k1", date: "2026-01-01", value: 3 });
    const db = asFirestore(fake);

    const facts = await collectWeekFacts(db, "u1", range);
    expect(facts.kpiMovements).toEqual([{ title: "Sleep hours", from: 6, to: 8 }]);
  });

  it("reports a single in-week entry with a null 'from'", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1/kpis/k1", { title: "Sleep hours", status: "active" });
    fake.seedDoc("users/u1/kpiEntries/e1", { kpiId: "k1", date: "2026-09-01", value: 7 });
    const db = asFirestore(fake);

    const facts = await collectWeekFacts(db, "u1", range);
    expect(facts.kpiMovements).toEqual([{ title: "Sleep hours", from: null, to: 7 }]);
  });
});
