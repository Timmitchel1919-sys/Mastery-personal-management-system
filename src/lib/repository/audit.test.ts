import { describe, expect, it } from "vitest";
import { buildCreateAudit, buildUpdateAudit } from "./audit";

describe("audit builders", () => {
  it("buildCreateAudit stamps the caller and initial lifecycle", () => {
    const audit = buildCreateAudit("u1");
    expect(audit.createdBy).toBe("u1");
    expect(audit.updatedBy).toBe("u1");
    expect(audit.status).toBe("active");
    expect(audit.version).toBe(1);
    expect(audit.archivedAt).toBeNull();
    // serverTimestamp() sentinels — present but opaque
    expect(audit.createdAt).toBeTruthy();
    expect(audit.updatedAt).toBeTruthy();
  });

  it("buildUpdateAudit sets updatedBy and a version increment", () => {
    const audit = buildUpdateAudit("u2");
    expect(audit.updatedBy).toBe("u2");
    expect(audit.updatedAt).toBeTruthy();
    expect(audit.version).toBeTruthy();
    expect(audit).not.toHaveProperty("createdBy");
    expect(audit).not.toHaveProperty("createdAt");
  });
});
