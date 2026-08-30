import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { authService } from "@/features/auth/auth-service";
import { lifeVisionRepository, listActiveVisions } from "@/features/vision/vision-repository";

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

describe("life vision repository", () => {
  it("creates, lists, updates, and archives a vision item with its pillars", async () => {
    const user = await signUpFresh("alice");

    const created = await lifeVisionRepository.create({
      category: "mission",
      title: "Serve well",
      content: "Be useful to the people around me.",
      pillarIds: ["spiritual", "personal"],
    });
    expect(created.category).toBe("mission");
    expect(created.pillarIds).toEqual(["spiritual", "personal"]);
    expect(created.createdBy).toBe(user.uid);

    expect((await listActiveVisions()).map((item) => item.title)).toEqual(["Serve well"]);

    const updated = await lifeVisionRepository.update(created.id, {
      pillarIds: ["personal", "societal"],
      content: "Serve people and communities.",
    });
    expect(updated.pillarIds).toEqual(["personal", "societal"]);
    expect(updated.version).toBeGreaterThanOrEqual(2);

    await lifeVisionRepository.archive(created.id);
    expect(await listActiveVisions()).toHaveLength(0);
  });

  it("is scoped to the signed-in user", async () => {
    await signUpFresh("alice");
    await lifeVisionRepository.create({
      category: "values",
      title: "Honesty",
      content: "Always tell the truth.",
      pillarIds: ["personal"],
    });
    await authService.signOut();

    await signUpFresh("bob");
    expect(await listActiveVisions()).toHaveLength(0);
  });
});
