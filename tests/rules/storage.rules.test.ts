import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadBytes, uploadString } from "firebase/storage";

let testEnv: RulesTestEnvironment;
const ALICE = "alice";
const BOB = "bob";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-mastery",
    storage: {
      rules: readFileSync("storage.rules", "utf8"),
      host: "127.0.0.1",
      port: 9199,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("storage.rules — owner-only user files", () => {
  it("lets the owner upload an image to their own path", async () => {
    const storage = testEnv.authenticatedContext(ALICE).storage();
    await assertSucceeds(
      uploadBytes(ref(storage, `users/${ALICE}/avatar.png`), PNG, { contentType: "image/png" }),
    );
  });

  it("denies uploading to another user's path", async () => {
    const storage = testEnv.authenticatedContext(BOB).storage();
    await assertFails(
      uploadBytes(ref(storage, `users/${ALICE}/avatar.png`), PNG, { contentType: "image/png" }),
    );
  });

  it("denies an unauthenticated download", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(getBytes(ref(storage, `users/${ALICE}/avatar.png`)));
  });

  it("rejects a disallowed content type", async () => {
    const storage = testEnv.authenticatedContext(ALICE).storage();
    await assertFails(
      uploadString(ref(storage, `users/${ALICE}/notes.txt`), "hello", "raw", {
        contentType: "text/plain",
      }),
    );
  });

  it("denies writes outside users/**", async () => {
    const storage = testEnv.authenticatedContext(ALICE).storage();
    await assertFails(
      uploadBytes(ref(storage, `public/${ALICE}.png`), PNG, { contentType: "image/png" }),
    );
  });
});
