import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { authErrorMessage, toAuthError } from "./auth-errors";

describe("toAuthError", () => {
  it("gives a friendly message for a known auth code", () => {
    const err = toAuthError({ code: "auth/invalid-credential", message: "raw" });
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("unauthenticated");
    expect(err.message).toBe("The email or password is incorrect.");
  });

  it("maps email-already-in-use to a conflict", () => {
    const err = toAuthError({ code: "auth/email-already-in-use" });
    expect(err.code).toBe("conflict");
    expect(err.message).toMatch(/already exists/i);
  });

  it("falls back to a code-level message for a generic Firebase error", () => {
    expect(toAuthError({ code: "unavailable" }).message).toMatch(/temporarily unavailable/i);
  });

  it("uses a generic message for an unrecognized failure", () => {
    expect(authErrorMessage(new Error("weird"))).toBe("Something went wrong. Please try again.");
  });

  it("passes an existing AppError's code through", () => {
    expect(toAuthError(new AppError("x", { code: "network" })).code).toBe("network");
  });
});
