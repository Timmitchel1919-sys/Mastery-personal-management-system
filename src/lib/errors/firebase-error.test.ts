import { describe, expect, it } from "vitest";
import { AppError } from "./app-error";
import { mapFirebaseError } from "./firebase-error";

describe("mapFirebaseError", () => {
  it("maps a bare gRPC status code", () => {
    const mapped = mapFirebaseError({ code: "permission-denied", message: "nope" });
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.code).toBe("permission-denied");
    expect(mapped.message).toBe("nope");
    expect(mapped.context).toMatchObject({ firebaseCode: "permission-denied" });
  });

  it("maps an auth/* code", () => {
    expect(mapFirebaseError({ code: "auth/user-not-found" }).code).toBe("not-found");
    expect(mapFirebaseError({ code: "auth/too-many-requests" }).code).toBe("rate-limited");
    expect(mapFirebaseError({ code: "auth/network-request-failed" }).retryable).toBe(true);
  });

  it("strips a service prefix like firestore/", () => {
    expect(mapFirebaseError({ code: "firestore/unavailable" }).code).toBe("unavailable");
  });

  it("keeps storage/* codes intact", () => {
    expect(mapFirebaseError({ code: "storage/object-not-found" }).code).toBe("not-found");
  });

  it("falls back to unknown for an unrecognized code", () => {
    expect(mapFirebaseError({ code: "some/weird-code" }).code).toBe("unknown");
  });

  it("passes an AppError through untouched", () => {
    const original = new AppError("keep", { code: "conflict" });
    expect(mapFirebaseError(original)).toBe(original);
  });

  it("wraps a plain Error", () => {
    const mapped = mapFirebaseError(new Error("raw failure"));
    expect(mapped.code).toBe("unknown");
    expect(mapped.message).toBe("raw failure");
  });
});
