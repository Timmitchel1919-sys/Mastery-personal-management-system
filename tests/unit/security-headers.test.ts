import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}
const config = JSON.parse(readFileSync("firebase.json", "utf8")) as {
  hosting: { headers: HeaderRule[] };
};

const globalRule = config.hosting.headers.find((h) => h.source === "**");
const get = (key: string) =>
  globalRule?.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

describe("Firebase Hosting security headers (Layer 20)", () => {
  it("applies a header block to every path", () => {
    expect(globalRule).toBeDefined();
  });

  it("ships a Content-Security-Policy with the load-bearing directives", () => {
    const csp = get("Content-Security-Policy");
    expect(csp).toBeDefined();
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "worker-src 'self'",
    ]) {
      expect(csp).toContain(directive);
    }
    // Firebase endpoints must be reachable from the browser.
    expect(csp).toMatch(/connect-src[^;]*googleapis\.com/);
    // Google sign-in popup / App Check reCAPTCHA frames.
    expect(csp).toMatch(/frame-src[^;]*firebaseapp\.com/);
    expect(csp).toMatch(/frame-src[^;]*accounts\.google\.com/);
  });

  it("locks down transport and framing", () => {
    expect(get("Strict-Transport-Security")).toMatch(/max-age=\d{7,}/);
    expect(get("Strict-Transport-Security")).toContain("includeSubDomains");
    expect(get("X-Content-Type-Options")).toBe("nosniff");
    expect(get("X-Frame-Options")).toBe("DENY");
    expect(get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("allows auth popups but nothing more (COOP)", () => {
    expect(get("Cross-Origin-Opener-Policy")).toBe("same-origin-allow-popups");
  });

  it("denies every powerful feature via Permissions-Policy", () => {
    const pp = get("Permissions-Policy") ?? "";
    for (const feature of ["camera", "microphone", "geolocation", "payment", "usb"]) {
      expect(pp).toContain(`${feature}=()`);
    }
  });
});
