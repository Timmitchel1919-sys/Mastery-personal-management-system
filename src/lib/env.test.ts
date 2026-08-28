import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("applies defaults when values are absent", () => {
    const result = parseEnv({}, { server: false });
    expect(result.NEXT_PUBLIC_APP_ENV).toBe("development");
    expect(result.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("accepts a valid app environment", () => {
    const result = parseEnv({ NEXT_PUBLIC_APP_ENV: "production" }, { server: false });
    expect(result.NEXT_PUBLIC_APP_ENV).toBe("production");
  });

  it("rejects an unknown app environment", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_APP_ENV: "prod" }, { server: false })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it("rejects an invalid NODE_ENV on the server", () => {
    expect(() => parseEnv({ NODE_ENV: "staging" }, { server: true })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it("trims and rejects a blank app URL", () => {
    expect(
      parseEnv({ NEXT_PUBLIC_APP_URL: "  https://x.dev  " }, { server: false }).NEXT_PUBLIC_APP_URL,
    ).toBe("https://x.dev");
    expect(() => parseEnv({ NEXT_PUBLIC_APP_URL: "   " }, { server: false })).toThrow();
  });

  it("defaults the emulator flag to false and accepts explicit values", () => {
    expect(parseEnv({}, { server: false }).NEXT_PUBLIC_USE_FIREBASE_EMULATORS).toBe("false");
    expect(
      parseEnv({ NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true" }, { server: false })
        .NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
    ).toBe("true");
    expect(() =>
      parseEnv({ NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "yes" }, { server: false }),
    ).toThrow(/Invalid environment configuration/);
  });

  it("treats the Firebase web config as optional", () => {
    const result = parseEnv({}, { server: false });
    expect(result.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBeUndefined();
    expect(
      parseEnv({ NEXT_PUBLIC_FIREBASE_PROJECT_ID: " demo " }, { server: false })
        .NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ).toBe("demo");
  });
});
