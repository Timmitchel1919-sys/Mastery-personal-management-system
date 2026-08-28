import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadString } from "firebase/storage";

let testEnv: RulesTestEnvironment;

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

describe("storage.rules — Layer 3 deny-all baseline", () => {
  it("denies uploads for an authenticated client", async () => {
    const storage = testEnv.authenticatedContext("alice").storage();
    await assertFails(uploadString(ref(storage, "users/alice/avatar.png"), "data"));
  });

  it("denies downloads for an unauthenticated client", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(getBytes(ref(storage, "users/alice/avatar.png")));
  });
});
