import { describe, expect, it } from "vitest";
import { quickNoteCreateSchema, quickNoteSchema, quickNoteUpdateSchema } from "./quick-note";

const audit = {
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
};

describe("quickNoteCreateSchema", () => {
  it("trims and requires a non-empty body", () => {
    expect(quickNoteCreateSchema.parse({ body: "  hello  " })).toEqual({ body: "hello" });
    expect(quickNoteCreateSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("caps the body length", () => {
    expect(quickNoteCreateSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("quickNoteUpdateSchema", () => {
  it("is a partial patch", () => {
    expect(quickNoteUpdateSchema.safeParse({}).success).toBe(true);
  });
});

describe("quickNoteSchema", () => {
  it("is a full audited record", () => {
    const note = quickNoteSchema.parse({ id: "n1", body: "note", ...audit });
    expect(note.body).toBe("note");
    expect(note.status).toBe("active");
    expect(note.version).toBe(1);
  });
});
