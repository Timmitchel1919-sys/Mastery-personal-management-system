import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

/**
 * Recovery Center gets "stronger controls" per `docs/RECOVERY_PRIVACY.md` — this is a
 * dedicated regression test for `recoveryProfiles` specifically (rather than relying only
 * on the generic subcollection coverage in `firestore.rules.test.ts`), so a future rules
 * change to this path is caught immediately. Layer 15A's `recoveryProfiles` is currently
 * covered by the same generic owner-only rule as any subcollection — see the comment in
 * `firestore.rules` about restructuring it once a later sublayer (15C/E/F) adds a
 * collection that needs Cloud-Function-only writes.
 */

let testEnv: RulesTestEnvironment;

const ALICE = "alice";
const BOB = "bob";

function lockDoc(uid: string, extra: Record<string, unknown> = {}) {
  return {
    id: uid,
    lockMethod: "pin",
    pinHash: "a".repeat(64),
    pinSalt: "b".repeat(32),
    failedAttempts: 0,
    lockedUntil: null,
    status: "active",
    version: 1,
    createdAt: "2026-09-08T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
    createdBy: uid,
    updatedBy: uid,
    ...extra,
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

async function seedLock(uid: string, extra: Record<string, unknown> = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "users", uid, "recoveryProfiles", uid),
      lockDoc(uid, extra),
    );
  });
}

describe("users/{uid}/recoveryProfiles/{uid} — Recovery Center privacy gate", () => {
  it("lets the owner create their own lock config", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(db, "users", ALICE, "recoveryProfiles", ALICE), lockDoc(ALICE)),
    );
  });

  it("lets the owner read their own lock config", async () => {
    await seedLock(ALICE);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "recoveryProfiles", ALICE)));
  });

  it("lets the owner update failedAttempts/lockedUntil after a wrong PIN", async () => {
    await seedLock(ALICE);
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "users", ALICE, "recoveryProfiles", ALICE), {
        failedAttempts: 1,
        updatedBy: ALICE,
        updatedAt: "2026-09-08T01:00:00.000Z",
      }),
    );
  });

  it("denies another signed-in user from reading it", async () => {
    await seedLock(ALICE);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(db, "users", ALICE, "recoveryProfiles", ALICE)));
  });

  it("denies another signed-in user from writing to it", async () => {
    await seedLock(ALICE);
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(
      updateDoc(doc(db, "users", ALICE, "recoveryProfiles", ALICE), {
        failedAttempts: 0,
        updatedBy: BOB,
      }),
    );
    await assertFails(setDoc(doc(db, "users", ALICE, "recoveryProfiles", "other"), lockDoc(BOB)));
  });

  it("denies an unauthenticated read", async () => {
    await seedLock(ALICE);
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users", ALICE, "recoveryProfiles", ALICE)));
  });

  it("rejects a create whose createdBy is not the caller", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(
        doc(db, "users", ALICE, "recoveryProfiles", ALICE),
        lockDoc(ALICE, { createdBy: BOB }),
      ),
    );
  });
});

function goalDoc(uid: string, extra: Record<string, unknown> = {}) {
  return {
    behavior: "Private goal",
    description: "",
    motivation: "",
    startDate: null,
    triggers: [],
    warningSigns: [],
    copingStrategies: [],
    supportNotes: "",
    faithBasedEncouragement: false,
    recoveryStatus: "active",
    status: "active",
    version: 1,
    createdAt: "2026-09-08T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
    createdBy: uid,
    updatedBy: uid,
    archivedAt: null,
    ...extra,
  };
}

describe("users/{uid}/recoveryGoals/{goalId} — Layer 15B", () => {
  it("lets the owner create and read their own recovery goal", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "recoveryGoals", "g1"), goalDoc(ALICE)));
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "recoveryGoals", "g1")));
  });

  it("denies another signed-in user from reading or writing a recovery goal", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users", ALICE, "recoveryGoals", "g1"), goalDoc(ALICE));
    });
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(db, "users", ALICE, "recoveryGoals", "g1")));
    await assertFails(setDoc(doc(db, "users", ALICE, "recoveryGoals", "g2"), goalDoc(BOB)));
  });

  it("rejects a create missing audit fields", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(doc(db, "users", ALICE, "recoveryGoals", "g3"), { behavior: "no audit" }),
    );
  });
});

function auditedNested(uid: string, extra: Record<string, unknown> = {}) {
  return {
    createdBy: uid,
    updatedBy: uid,
    createdAt: "2026-09-08T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
    ...extra,
  };
}

describe("recoveryGoals subcollections — Layer 15C", () => {
  it("lets the owner create and read a check-in (client-writable)", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(
        doc(db, "users", ALICE, "recoveryGoals", "g1", "checkIns", "c1"),
        auditedNested(ALICE),
      ),
    );
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "recoveryGoals", "g1", "checkIns", "c1")));
  });

  it("REJECTS a direct client write to a relapse (Cloud-Function-mediated per §3)", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(
      setDoc(
        doc(db, "users", ALICE, "recoveryGoals", "g1", "relapses", "r1"),
        auditedNested(ALICE, { whatHappened: "attempt" }),
      ),
    );
  });

  it("still lets the owner READ a relapse (written by the Admin SDK)", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "users", ALICE, "recoveryGoals", "g1", "relapses", "r1"),
        auditedNested(ALICE, { whatHappened: "seeded server-side" }),
      );
    });
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "recoveryGoals", "g1", "relapses", "r1")));
  });

  it("denies another signed-in user from reading a check-in or relapse", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "users", ALICE, "recoveryGoals", "g1", "checkIns", "c1"),
        auditedNested(ALICE),
      );
      await setDoc(
        doc(context.firestore(), "users", ALICE, "recoveryGoals", "g1", "relapses", "r1"),
        auditedNested(ALICE),
      );
    });
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(db, "users", ALICE, "recoveryGoals", "g1", "checkIns", "c1")));
    await assertFails(getDoc(doc(db, "users", ALICE, "recoveryGoals", "g1", "relapses", "r1")));
  });
});

describe("recoveryGoals copingActions — Layer 15D", () => {
  it("lets the owner create, read, and archive a coping action (client-writable)", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    const ref = doc(db, "users", ALICE, "recoveryGoals", "g1", "copingActions", "a1");
    await assertSucceeds(
      setDoc(ref, auditedNested(ALICE, { title: "Box breathing", category: "physical" })),
    );
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(
      updateDoc(ref, {
        status: "archived",
        updatedBy: ALICE,
        updatedAt: "2026-09-05T01:00:00.000Z",
      }),
    );
  });

  it("denies another signed-in user from reading or writing a coping action", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "users", ALICE, "recoveryGoals", "g1", "copingActions", "a1"),
        auditedNested(ALICE, { title: "Box breathing", category: "physical" }),
      );
    });
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(
      getDoc(doc(db, "users", ALICE, "recoveryGoals", "g1", "copingActions", "a1")),
    );
    await assertFails(
      setDoc(
        doc(db, "users", ALICE, "recoveryGoals", "g1", "copingActions", "a2"),
        auditedNested(BOB, { title: "sneaky", category: "other" }),
      ),
    );
  });
});
