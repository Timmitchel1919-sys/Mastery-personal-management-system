import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { listRecentReports, reportRepository } from "@/features/reports/report-repository";

const PROJECT_ID = "demo-mastery";
const AUTH_HOST = "http://127.0.0.1:9099";
const FIRESTORE_HOST = "http://127.0.0.1:8080";

async function resetEmulators() {
  await fetch(`${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
  await fetch(
    `${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
}

function uniqueEmail(tag: string) {
  return `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUpFresh(tag: string) {
  return authService.signUpWithEmail({
    email: uniqueEmail(tag),
    password: "sup3rsecret",
    displayName: tag,
  });
}

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("report metadata records", () => {
  it("creates, lists, and archives a report metadata record for the owner", async () => {
    await signUpFresh("owner");

    const created = await reportRepository.create({
      title: "Last 7 days · 2026-09-05",
      period: "weekly",
      periodStart: "2026-08-30",
      periodEnd: "2026-09-05",
      sections: ["summary", "goals"],
      format: "pdf",
      generatedAt: "2026-09-05T12:00:00.000Z",
    });
    expect(created.createdBy).toBeTruthy();
    expect(created.sections).toEqual(["summary", "goals"]);

    expect(await listRecentReports()).toHaveLength(1);

    await reportRepository.archive(created.id);
    expect(await listRecentReports()).toEqual([]);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await reportRepository.create({
      title: "Alice report",
      period: "monthly",
      periodStart: "2026-08-06",
      periodEnd: "2026-09-05",
      sections: ["summary"],
      format: "pdf",
      generatedAt: "2026-09-05T12:00:00.000Z",
    });
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listRecentReports()).toEqual([]);
  });
});
