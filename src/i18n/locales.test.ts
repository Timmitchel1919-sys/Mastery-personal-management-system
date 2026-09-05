import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, isLocale, LOCALES, readStoredLocale } from "./locales";
import { messagesFor } from "./messages";

afterEach(() => {
  window.localStorage.clear();
});

describe("locales", () => {
  it("ships English and Dutch with English the default", () => {
    expect([...LOCALES]).toEqual(["en", "nl"]);
    expect(DEFAULT_LOCALE).toBe("en");
    expect(isLocale("nl")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("reads a stored locale, else falls back", () => {
    expect(readStoredLocale()).toBe("en");
    window.localStorage.setItem("mastery.locale", "nl");
    expect(readStoredLocale()).toBe("nl");
    window.localStorage.setItem("mastery.locale", "zz");
    expect(readStoredLocale()).toBe("en");
  });
});

describe("messagesFor", () => {
  it("returns the requested catalogue and falls back to English for an unknown one", () => {
    expect((messagesFor("nl") as { common: { save: string } }).common.save).toBe("Opslaan");
    // @ts-expect-error deliberately passing an unsupported locale
    expect((messagesFor("xx") as { common: { save: string } }).common.save).toBe("Save");
  });

  it("keeps English and Dutch catalogues structurally in sync", () => {
    const flatKeys = (obj: unknown, prefix = ""): string[] =>
      obj && typeof obj === "object"
        ? Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
            v && typeof v === "object" ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
          )
        : [];
    const en = flatKeys(messagesFor("en")).sort();
    const nl = flatKeys(messagesFor("nl")).sort();
    expect(nl).toEqual(en);
  });
});
