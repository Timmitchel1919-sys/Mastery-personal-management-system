import { describe, expect, it } from "vitest";
import { AppError, isAppError, normalizeError } from "./app-error";

describe("AppError", () => {
  it("defaults code to unknown and is not retryable", () => {
    const error = new AppError("boom");
    expect(error.code).toBe("unknown");
    expect(error.retryable).toBe(false);
    expect(isAppError(error)).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it("marks transient codes retryable by default", () => {
    expect(new AppError("x", { code: "network" }).retryable).toBe(true);
    expect(new AppError("x", { code: "rate-limited" }).retryable).toBe(true);
  });

  it("honors an explicit retryable override", () => {
    expect(new AppError("x", { code: "network", retryable: false }).retryable).toBe(false);
  });

  it("serializes to a plain object", () => {
    expect(new AppError("nope", { code: "not-found" }).toJSON()).toEqual({
      name: "AppError",
      message: "nope",
      code: "not-found",
      retryable: false,
    });
  });
});

describe("normalizeError", () => {
  it("returns AppError instances unchanged", () => {
    const original = new AppError("keep", { code: "conflict" });
    expect(normalizeError(original)).toBe(original);
  });

  it("wraps a native Error, infers a code, and preserves the cause", () => {
    const native = new Error("The request timed out");
    const normalized = normalizeError(native);
    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.code).toBe("timeout");
    expect(normalized.cause).toBe(native);
  });

  it("wraps a non-empty string", () => {
    expect(normalizeError("something broke").message).toBe("something broke");
  });

  it("wraps an arbitrary value", () => {
    const normalized = normalizeError({ weird: true });
    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.code).toBe("unknown");
    expect(normalized.context).toEqual({ original: { weird: true } });
  });
});
