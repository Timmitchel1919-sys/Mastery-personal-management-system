import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8")) as {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
  shortcuts?: { name: string; url: string }[];
};

describe("web app manifest", () => {
  it("declares the fields a browser needs to offer installation", () => {
    expect(manifest.name).toBe("Mastery");
    expect(manifest.short_name).toBe("Mastery");
    expect(manifest.start_url).toBe("/dashboard");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("ships a 192, a 512, and a maskable icon", () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith("/")).toBe(true);
      expect(icon.type).toBe("image/png");
    }
  });

  it("all shortcut targets are same-origin absolute paths", () => {
    for (const shortcut of manifest.shortcuts ?? []) {
      expect(shortcut.url.startsWith("/")).toBe(true);
    }
  });
});
