import { describe, expect, it } from "vitest";
import { generateSalt, hashPin, verifyPin } from "./pin-crypto";

describe("generateSalt", () => {
  it("returns a 32-character hex string, different each time", () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });
});

describe("hashPin + verifyPin", () => {
  it("hashes deterministically for the same pin + salt", async () => {
    const salt = generateSalt();
    const a = await hashPin("1234", salt);
    const b = await hashPin("1234", salt);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a different hash for a different salt or pin", async () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(await hashPin("1234", salt1)).not.toBe(await hashPin("1234", salt2));
    expect(await hashPin("1234", salt1)).not.toBe(await hashPin("5678", salt1));
  });

  it("verifyPin confirms a correct pin and rejects a wrong one", async () => {
    const salt = generateSalt();
    const hash = await hashPin("2468", salt);
    expect(await verifyPin("2468", salt, hash)).toBe(true);
    expect(await verifyPin("1111", salt, hash)).toBe(false);
  });
});
