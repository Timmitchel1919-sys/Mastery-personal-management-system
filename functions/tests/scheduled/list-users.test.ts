import { describe, expect, it } from "vitest";
import { listActiveUserIds } from "../../src/scheduled/weekly-summary/list-users";
import { asFirestore, createFakeFirestore } from "../ai/fakes";

describe("listActiveUserIds", () => {
  it("returns every active user, paginating across multiple pages", async () => {
    const fake = createFakeFirestore();
    fake.seedDoc("users/u1", { status: "active" });
    fake.seedDoc("users/u2", { status: "active" });
    fake.seedDoc("users/u3", { status: "active" });
    fake.seedDoc("users/u4", { status: "disabled" });
    const db = asFirestore(fake);

    const ids = await listActiveUserIds(db, 2);
    expect(ids.sort()).toEqual(["u1", "u2", "u3"]);
  });

  it("returns an empty list when there are no active users", async () => {
    const fake = createFakeFirestore();
    const db = asFirestore(fake);
    expect(await listActiveUserIds(db)).toEqual([]);
  });
});
