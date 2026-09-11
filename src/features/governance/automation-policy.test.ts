import { describe, expect, it } from "vitest";
import { describePolicyPreview, parseAutomationRequest, reviseDraft, testPolicyDraft } from "./automation-policy";

const NOW = "2026-09-11T09:00:00.000Z";

describe("parseAutomationRequest", () => {
  it("recognizes 'every weekday remind me to review my goals' as a reminder policy", () => {
    const draft = parseAutomationRequest("Every weekday remind me to review my goals.", NOW);
    expect(draft?.actionType).toBe("CREATE_INTERNAL_REMINDER");
    expect(draft?.approvalRequired).toBe(true);
    expect(draft?.version).toBe(1);
  });

  it("recognizes 'automatically organize my low-priority tasks'", () => {
    const draft = parseAutomationRequest("Automatically organize my low-priority tasks.", NOW);
    expect(draft?.actionType).toBe("CLASSIFY_INBOX");
    expect(draft?.conditions.some((c) => c.toLowerCase().includes("low priority"))).toBe(true);
  });

  it("recognizes 'keep my Friday afternoon available for deep work'", () => {
    const draft = parseAutomationRequest("Keep my Friday afternoon available for deep work.", NOW);
    expect(draft?.trigger).toBe("WEEKLY_REVIEW");
  });

  it("never falls back to an unrestricted interpretation — unrecognized text returns null", () => {
    expect(parseAutomationRequest("Please transfer $500 to my landlord every month.", NOW)).toBeNull();
  });
});

describe("describePolicyPreview", () => {
  it("states what will happen, when, and that nothing executes without approval", () => {
    const draft = parseAutomationRequest("Every weekday remind me to review my goals.", NOW)!;
    const preview = describePolicyPreview(draft);
    expect(preview).toMatch(/every weekday morning/i);
    expect(preview).toMatch(/wait for your approval/i);
  });

  it("is honest about low-risk automation that does not require approval", () => {
    const draft = parseAutomationRequest("Automatically organize my low-priority tasks.", NOW)!;
    expect(describePolicyPreview(draft)).toMatch(/no other data is touched/i);
  });
});

describe("reviseDraft", () => {
  it("creates a new version rather than mutating the original", () => {
    const original = parseAutomationRequest("Every weekday remind me to review my goals.", NOW)!;
    const revised = reviseDraft(original, { approvalRequired: false }, NOW);
    expect(revised.version).toBe(2);
    expect(original.version).toBe(1);
    expect(original.approvalRequired).toBe(true);
    expect(revised.approvalRequired).toBe(false);
  });
});

describe("testPolicyDraft", () => {
  it("evaluates against current data without creating or executing anything", () => {
    const draft = parseAutomationRequest("Automatically organize my low-priority tasks.", NOW)!;
    expect(testPolicyDraft(draft, true).wouldFire).toBe(true);
    expect(testPolicyDraft(draft, false).wouldFire).toBe(false);
  });
});
