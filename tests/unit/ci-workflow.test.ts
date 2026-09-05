import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

const ci = parse(readFileSync(".github/workflows/ci.yml", "utf8")) as {
  on: { push: { branches: string[] }; pull_request: { branches: string[] } };
  jobs: Record<string, { needs?: string[]; if?: string; steps: { run?: string }[] }>;
};
const runs = (job: string) => (ci.jobs[job]?.steps ?? []).map((s) => s.run ?? "").join("\n");

describe(".github/workflows/ci.yml", () => {
  it("runs on push and PR to main", () => {
    expect(ci.on.push.branches).toContain("main");
    expect(ci.on.pull_request.branches).toContain("main");
  });

  it("has the five expected jobs", () => {
    expect(Object.keys(ci.jobs).sort()).toEqual(
      ["app", "deploy", "e2e", "emulator", "functions"].sort(),
    );
  });

  it("the app job runs the full §9 gate plus the bundle-budget check", () => {
    const app = runs("app");
    for (const cmd of [
      "npm run typecheck",
      "npm run lint",
      "npm run format:check",
      "npm run test:coverage",
      "npm run build",
      "npm run analyze",
    ]) {
      expect(app).toContain(cmd);
    }
  });

  it("the emulator job runs rules + integration", () => {
    const e = runs("emulator");
    expect(e).toContain("npm run test:rules");
    expect(e).toContain("npm run test:integration");
  });

  it("the e2e job installs browsers and runs against the emulator", () => {
    const e = runs("e2e");
    expect(e).toContain("npm run test:e2e:install");
    expect(e).toMatch(/emulators:exec[\s\S]*npm run test:e2e/);
  });

  it("deploy is gated on every check and only on a push to main", () => {
    const deploy = ci.jobs.deploy;
    expect(deploy).toBeDefined();
    expect(deploy?.needs?.slice().sort()).toEqual(["app", "e2e", "emulator", "functions"].sort());
    expect(deploy?.if).toContain("refs/heads/main");
    expect(deploy?.if).toContain("push");
  });

  it("deploy ships hosting + rules + indexes + storage, never functions (Spark plan)", () => {
    const deploy = runs("deploy");
    expect(deploy).toContain("firebase deploy");
    expect(deploy).toContain("--only hosting,firestore:rules,firestore:indexes,storage");
    expect(deploy).not.toMatch(/--only[^"\n]*functions/);
  });
});
