import { describe, expect, it } from "vitest";
import {
  journalEntryCreateSchema,
  journalEntryFormSchema,
  journalEntryInputFromForm,
  journalEntrySchema,
  journalEntryUpdateSchema,
  type JournalEntryFormValues,
} from "./schema";

const full = {
  title: "A good day",
  entryType: "free-form" as const,
  entryDate: "2026-09-02",
  content: "Today was productive.",
  gratitudeItems: [] as string[],
  moodRating: 4,
  energyLevel: 3,
  pillarIds: ["personal" as const],
  goalId: null,
  tags: ["work"],
  isPrivate: false,
};

describe("journalEntryCreateSchema", () => {
  it("accepts a fully specified entry", () => {
    expect(journalEntryCreateSchema.parse(full).title).toBe("A good day");
  });

  it("requires either content or a gratitude item", () => {
    expect(
      journalEntryCreateSchema.safeParse({ ...full, content: "", gratitudeItems: [] }).success,
    ).toBe(false);
    expect(
      journalEntryCreateSchema.safeParse({ ...full, content: "", gratitudeItems: ["Coffee"] })
        .success,
    ).toBe(true);
  });

  it("rejects an unknown entry type or an out-of-range rating", () => {
    expect(journalEntryCreateSchema.safeParse({ ...full, entryType: "vent" }).success).toBe(false);
    expect(journalEntryCreateSchema.safeParse({ ...full, moodRating: 6 }).success).toBe(false);
    expect(journalEntryCreateSchema.safeParse({ ...full, energyLevel: 0 }).success).toBe(false);
  });

  it("allows a blank title and an empty pillar list", () => {
    expect(journalEntryCreateSchema.safeParse({ ...full, title: "", pillarIds: [] }).success).toBe(
      true,
    );
  });
});

describe("journalEntryUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(journalEntryUpdateSchema.safeParse({}).success).toBe(true);
    expect(journalEntryUpdateSchema.safeParse({ isPrivate: true }).success).toBe(true);
  });
});

describe("journalEntryFormSchema + journalEntryInputFromForm", () => {
  const gratitudeForm: JournalEntryFormValues = {
    title: "",
    entryType: "gratitude",
    entryDate: "2026-09-02",
    content: "",
    gratitudeItemsText: "My family\nA sunny walk\nMy family",
    moodRating: 5,
    energyLevel: 4,
    pillarIds: [],
    goalId: "",
    tagsText: "gratitude, gratitude, reflection",
    isPrivate: false,
  };

  it("rejects an entry with neither content nor gratitude text", () => {
    expect(
      journalEntryFormSchema.safeParse({ ...gratitudeForm, gratitudeItemsText: "" }).success,
    ).toBe(false);
  });

  it("only keeps gratitude items for a gratitude entry, dedupes tags", () => {
    const input = journalEntryInputFromForm(gratitudeForm);
    expect(input.gratitudeItems).toEqual(["My family", "A sunny walk", "My family"]);
    expect(input.tags).toEqual(["gratitude", "reflection"]);
    expect(input.goalId).toBeNull();
    expect(journalEntryCreateSchema.safeParse(input).success).toBe(true);
  });

  it("drops gratitude items for a non-gratitude entry even if the text field is filled", () => {
    const input = journalEntryInputFromForm({
      ...gratitudeForm,
      entryType: "free-form",
      content: "Some notes",
    });
    expect(input.gratitudeItems).toEqual([]);
  });
});

describe("journalEntrySchema", () => {
  it("validates a stored record", () => {
    const record = journalEntrySchema.parse({
      id: "j1",
      ...full,
      status: "active",
      version: 1,
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
      createdBy: "u1",
      updatedBy: "u1",
    });
    expect(record.entryType).toBe("free-form");
  });
});
