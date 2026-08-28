import { afterEach, describe, expect, it, vi } from "vitest";
import { getSystemTheme, isTheme, resolveTheme } from "./theme";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("isTheme", () => {
  it("accepts the three known values", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isTheme("")).toBe(false);
    expect(isTheme("blue")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});

describe("getSystemTheme", () => {
  it("returns light when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(getSystemTheme()).toBe("light");
  });

  it("reflects the OS preference when matchMedia is available", () => {
    stubMatchMedia(true);
    expect(getSystemTheme()).toBe("dark");
    stubMatchMedia(false);
    expect(getSystemTheme()).toBe("light");
  });
});

describe("resolveTheme", () => {
  it("passes concrete values through", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("resolves system to the OS preference", () => {
    stubMatchMedia(true);
    expect(resolveTheme("system")).toBe("dark");
  });
});
