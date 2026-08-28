import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { AppError } from "@/lib/errors";
import { makeConverter } from "./converters";

const goalSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
});

function fakeTimestamp(iso: string) {
  const date = new Date(iso);
  return { toDate: () => date, seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
}

function fakeSnapshot(id: string, data: Record<string, unknown>) {
  return {
    id,
    ref: { path: `users/u1/goals/${id}` },
    data: () => data,
  } as unknown as QueryDocumentSnapshot;
}

describe("makeConverter", () => {
  const converter = makeConverter(goalSchema);

  it("normalizes timestamps, injects the id, and validates on read", () => {
    const result = converter.fromFirestore(
      fakeSnapshot("g1", {
        title: "Ship v1",
        createdAt: fakeTimestamp("2026-08-27T10:00:00.000Z"),
      }),
      {},
    );
    expect(result).toEqual({ id: "g1", title: "Ship v1", createdAt: "2026-08-27T10:00:00.000Z" });
  });

  it("throws a normalized AppError when the document does not match the schema", () => {
    try {
      converter.fromFirestore(fakeSnapshot("g2", { title: 123 }), {});
      throw new Error("expected converter to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("invalid-input");
      expect((error as AppError).context).toMatchObject({ path: "users/u1/goals/g2" });
    }
  });

  it("drops id and stamps updatedAt on write", () => {
    const out = converter.toFirestore({
      id: "g3",
      title: "Keep",
      createdAt: "2026-08-27T10:00:00.000Z",
    });
    expect(out).not.toHaveProperty("id");
    expect(out.title).toBe("Keep");
    expect(out).toHaveProperty("updatedAt");
  });
});
