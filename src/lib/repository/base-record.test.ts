import { describe, expect, it } from "vitest";
import { z } from "zod";
import { BASE_RECORD_KEYS, baseRecordSchema, defineRecordSchema } from "./base-record";

const audit = {
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
  createdBy: "u1",
  updatedBy: "u1",
};

describe("baseRecordSchema", () => {
  it("applies defaults for status, version, and archivedAt", () => {
    const parsed = baseRecordSchema.parse({ id: "r1", ...audit });
    expect(parsed.status).toBe("active");
    expect(parsed.version).toBe(1);
    expect(parsed.archivedAt).toBeNull();
  });

  it("rejects a record missing audit fields", () => {
    expect(baseRecordSchema.safeParse({ id: "r1" }).success).toBe(false);
  });

  it("rejects a non-ISO timestamp", () => {
    expect(baseRecordSchema.safeParse({ id: "r1", ...audit, createdAt: "yesterday" }).success).toBe(
      false,
    );
  });

  it("exposes the audit field names", () => {
    expect(BASE_RECORD_KEYS).toEqual(
      expect.arrayContaining([
        "id",
        "status",
        "version",
        "createdAt",
        "updatedAt",
        "createdBy",
        "updatedBy",
        "archivedAt",
      ]),
    );
  });
});

describe("defineRecordSchema", () => {
  const noteSchema = defineRecordSchema({ title: z.string().min(1), body: z.string() });

  it("extends the base record with feature fields", () => {
    const note = noteSchema.parse({ id: "n1", title: "Hi", body: "there", ...audit });
    expect(note.title).toBe("Hi");
    expect(note.version).toBe(1);
  });

  it("still enforces feature-field validation", () => {
    expect(noteSchema.safeParse({ id: "n1", title: "", body: "x", ...audit }).success).toBe(false);
  });
});
