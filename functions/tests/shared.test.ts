import { describe, expect, it } from "vitest";
import { z } from "zod";
import { HttpsError, toHttpsError } from "../src/shared/errors";
import { validateRequest, validateResponse } from "../src/shared/validation";

describe("validateRequest", () => {
  it("returns parsed data on success", () => {
    expect(validateRequest(z.object({ name: z.string() }), { name: "Mia" })).toEqual({
      name: "Mia",
    });
  });

  it("throws an invalid-argument HttpsError on failure", () => {
    try {
      validateRequest(z.object({ count: z.number() }), { count: "no" });
      throw new Error("expected validateRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpsError);
      expect((error as HttpsError).code).toBe("invalid-argument");
    }
  });
});

describe("validateResponse", () => {
  it("throws a plain internal error (not the caller's fault) on mismatch", () => {
    expect(() => validateResponse(z.object({ ok: z.boolean() }), { ok: "yes" })).toThrow(
      /Response validation failed/,
    );
  });
});

describe("toHttpsError", () => {
  it("passes an HttpsError through untouched", () => {
    const original = new HttpsError("not-found", "missing");
    expect(toHttpsError(original)).toBe(original);
  });

  it("wraps a native error as internal without leaking the message publicly", () => {
    const wrapped = toHttpsError(new Error("db exploded"));
    expect(wrapped).toBeInstanceOf(HttpsError);
    expect(wrapped.code).toBe("internal");
    expect(wrapped.message).toBe("An unexpected error occurred");
  });
});
