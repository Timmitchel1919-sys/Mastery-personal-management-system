import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

const ALICE = "alice";
const BOB = "bob";

function baseProfile(uid: string) {
  return {
    id: uid,
    displayName: "Test User",
    email: `${uid}@example.com`,
    photoURL: null,
    role: "user",
    language: "en",
    theme: "system",
    timezone: "UTC",
    accentColorPreference: null,
    onboardingCompleted: false,
    status: "active",
    version: 1,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
    createdBy: uid,
    updatedBy: uid,
  };
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-mastery",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function seedProfile(uid: string, overrides: Record<string, unknown> = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", uid), { ...baseProfile(uid), ...overrides });
  });
}

describe("users/{uid} — ownership", () => {
  it("lets a user create their own profile with role 'user'", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, "users", ALICE), baseProfile(ALICE)));
  });

  it("rejects creating a profile with an elevated role", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(setDoc(doc(db, "users", ALICE), { ...baseProfile(ALICE), role: "admin" }));
  });

  it("rejects creating a profile at another user's uid", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(setDoc(doc(db, "users", BOB), baseProfile(BOB)));
  });

  it("lets a user read their own profile", async () => {
    await seedProfile(ALICE);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, "users", ALICE)));
  });

  it("denies reading another user's profile", async () => {
    await seedProfile(ALICE);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(db, "users", ALICE)));
  });

  it("denies listing the users collection", async () => {
    await seedProfile(ALICE);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(getDocs(collection(db, "users")));
  });

  it("denies an unauthenticated read", async () => {
    await seedProfile(ALICE);
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users", ALICE)));
  });
});

describe("users/{uid} — updates", () => {
  it("allows updating an editable field", async () => {
    await seedProfile(ALICE);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "users", ALICE), { displayName: "Renamed", updatedBy: ALICE }),
    );
  });

  it("rejects changing the role after creation", async () => {
    await seedProfile(ALICE);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(db, "users", ALICE), { role: "admin", updatedBy: ALICE }));
  });

  it("rejects tampering with createdBy / createdAt", async () => {
    await seedProfile(ALICE);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(db, "users", ALICE), { createdBy: BOB, updatedBy: ALICE }));
  });

  it("denies deleting a profile", async () => {
    await seedProfile(ALICE);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(deleteDoc(doc(db, "users", ALICE)));
  });
});

function auditedDoc(uid: string, extra: Record<string, unknown> = {}) {
  return {
    title: "Ship v1",
    createdBy: uid,
    updatedBy: uid,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
    ...extra,
  };
}

async function seedSubdoc(uid: string, id: string, extra: Record<string, unknown> = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", uid, "goals", id), auditedDoc(uid, extra));
  });
}

describe("users/{uid}/** — subcollections (owner + audit fields)", () => {
  it("lets the owner create an audited subcollection doc and read it back", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "goals", "g1"), auditedDoc(ALICE)));
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "goals", "g1")));
  });

  it("rejects a create whose createdBy is not the caller", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(db, "users", ALICE, "goals", "g2"), auditedDoc(ALICE, { createdBy: BOB })),
    );
  });

  it("rejects a create that omits audit fields", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(setDoc(doc(db, "users", ALICE, "goals", "g3"), { title: "no audit" }));
  });

  it("lets the owner update, keeping createdBy / createdAt", async () => {
    await seedSubdoc(ALICE, "g4");
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "users", ALICE, "goals", "g4"), {
        title: "Renamed",
        updatedBy: ALICE,
        updatedAt: "2026-08-29T00:00:00.000Z",
      }),
    );
  });

  it("rejects an update that rewrites createdBy", async () => {
    await seedSubdoc(ALICE, "g5");
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      updateDoc(doc(db, "users", ALICE, "goals", "g5"), { createdBy: BOB, updatedBy: ALICE }),
    );
  });

  it("denies cross-user access to subcollection docs", async () => {
    await seedSubdoc(ALICE, "g6");
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(db, "users", ALICE, "goals", "g6")));
    await assertFails(setDoc(doc(db, "users", ALICE, "goals", "g7"), auditedDoc(BOB)));
  });
});
