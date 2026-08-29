import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { doc, getDoc } from "firebase/firestore";
import { authService } from "@/features/auth/auth-service";
import { getFirebaseClient } from "@/lib/firebase/client";
import { AppError } from "@/lib/errors";
import { createFirestoreRepository, defineRecordSchema } from "@/lib/repository";

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

/* ── Fixture entity (repository machinery only; not a real domain model) ── */
const noteSchema = defineRecordSchema({ title: z.string().min(1), body: z.string() });
const noteCreateSchema = z.object({ title: z.string().min(1), body: z.string() });
const noteUpdateSchema = noteCreateSchema.partial();
type Note = z.infer<typeof noteSchema>;

const notes = createFirestoreRepository<
  Note,
  z.infer<typeof noteCreateSchema>,
  z.infer<typeof noteUpdateSchema>
>({
  collectionName: "notes",
  schema: noteSchema,
  createSchema: noteCreateSchema,
  updateSchema: noteUpdateSchema,
});

beforeEach(async () => {
  await resetEmulators();
  await authService.signOut().catch(() => {});
});

afterAll(async () => {
  await authService.signOut().catch(() => {});
});

describe("createFirestoreRepository — create / get", () => {
  it("stamps audit fields and reads back an ISO-normalized record", async () => {
    const user = await signUpFresh("alice");

    const created = await notes.create({ title: "First", body: "hello" });
    expect(created.id).toBeTruthy();
    expect(created.title).toBe("First");
    expect(created.status).toBe("active");
    expect(created.version).toBe(1);
    expect(created.archivedAt).toBeNull();
    expect(created.createdBy).toBe(user.uid);
    expect(created.updatedBy).toBe(user.uid);

    const fetched = await notes.get(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe("First");
    expect(Number.isNaN(Date.parse(fetched!.createdAt))).toBe(false);
  });

  it("returns null for a missing id", async () => {
    await signUpFresh("alice");
    expect(await notes.get("does-not-exist")).toBeNull();
  });
});

describe("createFirestoreRepository — pagination", () => {
  it("walks pages with an opaque cursor", async () => {
    await signUpFresh("alice");
    for (const title of ["a", "b", "c", "d", "e"]) {
      await notes.create({ title, body: title });
    }

    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page = await notes.list({ limit: 2, orderBy: "title", direction: "asc", cursor });
      seen.push(...page.items.map((note) => note.title));
      cursor = page.nextCursor ?? undefined;
      pages += 1;
      if (page.hasMore) expect(page.nextCursor).toBeTruthy();
      else expect(page.nextCursor).toBeNull();
    } while (cursor);

    expect(pages).toBe(3);
    expect(seen).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("createFirestoreRepository — update / archive", () => {
  it("increments version and preserves creation audit on update", async () => {
    await signUpFresh("alice");
    const created = await notes.create({ title: "Draft", body: "x" });

    const updated = await notes.update(created.id, { title: "Final" });
    expect(updated.title).toBe("Final");
    expect(updated.version).toBeGreaterThanOrEqual(2);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.createdBy).toBe(created.createdBy);
  });

  it("archives and unarchives", async () => {
    await signUpFresh("alice");
    const created = await notes.create({ title: "Temp", body: "x" });

    await notes.archive(created.id);
    const archived = await notes.get(created.id);
    expect(archived?.status).toBe("archived");
    expect(archived?.archivedAt).not.toBeNull();

    await notes.unarchive(created.id);
    const restored = await notes.get(created.id);
    expect(restored?.status).toBe("active");
    expect(restored?.archivedAt).toBeNull();
  });
});

describe("createFirestoreRepository — ownership & auth", () => {
  it("scopes every read to the signed-in user's path", async () => {
    const alice = await signUpFresh("alice");
    const created = await notes.create({ title: "Alice only", body: "secret" });
    await authService.signOut();

    await signUpFresh("bob");
    // Bob's repo looks under users/bob/notes — Alice's note is simply not there.
    expect(await notes.get(created.id)).toBeNull();

    // And a raw read of Alice's path while signed in as Bob is denied by the rules.
    await expect(
      getDoc(doc(getFirebaseClient().db, "users", alice.uid, "notes", created.id)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects writes when no one is signed in", async () => {
    await signUpFresh("alice");
    await authService.signOut();
    await expect(notes.create({ title: "x", body: "y" })).rejects.toBeInstanceOf(AppError);
    await expect(notes.create({ title: "x", body: "y" })).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });
});
