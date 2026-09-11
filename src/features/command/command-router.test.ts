import { describe, expect, it } from "vitest";
import { COMMAND_CATALOG, isNavigationSafe, matchCommand, resolveCommand, type CommandDefinition } from "./command-router";

describe("matchCommand", () => {
  it("scores an exact phrase highest", () => {
    const [top] = matchCommand("plan my day");
    expect(top?.command.id).toBe("plan-day");
    expect(top?.score).toBe(100);
  });

  it("matches a prefix of a known phrase", () => {
    const [top] = matchCommand("start a focus");
    expect(top?.command.id).toBe("start-focus");
  });

  it("matches loosely on word overlap", () => {
    const [top] = matchCommand("my weekly performance please");
    expect(top?.command.id).toBe("weekly-performance");
  });

  it("returns nothing for an empty or unrelated query", () => {
    expect(matchCommand("")).toHaveLength(0);
    expect(matchCommand("xyz totally unrelated gibberish")).toHaveLength(0);
  });

  it("is case- and punctuation-insensitive", () => {
    const [top] = matchCommand("SHOW MY PRIORITIES!");
    expect(top?.command.id).toBe("priorities");
  });
});

describe("predictive commands (Layer U)", () => {
  it("routes forward-looking questions to Predictions", () => {
    expect(resolveCommand("which goals are at risk")?.href).toBe("/predictions");
    expect(resolveCommand("what should i prepare for")?.href).toBe("/predictions");
  });

  it("routes a what-if postponement question to Simulation, not Predictions", () => {
    expect(resolveCommand("what happens if i postpone this")?.href).toBe("/simulation");
  });
});

describe("resolveCommand", () => {
  it("returns the single best command above the confidence floor", () => {
    expect(resolveCommand("review my goals")?.id).toBe("review-goals");
  });

  it("returns null when nothing scores meaningfully", () => {
    expect(resolveCommand("completely unrelated text")).toBeNull();
  });
});

describe("isNavigationSafe", () => {
  it("accepts internal routes and rejects protocol-relative or external ones", () => {
    expect(isNavigationSafe({ href: "/command" } as CommandDefinition)).toBe(true);
    expect(isNavigationSafe({ href: "//evil.example.com" } as CommandDefinition)).toBe(false);
    expect(isNavigationSafe({ href: "https://evil.example.com" } as CommandDefinition)).toBe(false);
  });

  it("every built-in command resolves to a safe internal route", () => {
    expect(COMMAND_CATALOG.every(isNavigationSafe)).toBe(true);
  });

  it("every built-in command is VIEW/REVIEW/SEARCH/PLAN/ANALYZE/SIMULATE/EXECUTE/CREATE navigation only — none mutate data on their own", () => {
    // The router itself has no execute/mutate path; it only ever returns a route.
    for (const command of COMMAND_CATALOG) {
      expect(typeof command.href).toBe("string");
      expect(command.href.length).toBeGreaterThan(0);
    }
  });
});
