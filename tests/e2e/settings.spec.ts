import { expect, test } from "@playwright/test";
import { registerAndSignIn } from "./_helpers";

// Critical journeys 16 (language persistence) and 17 (theme persistence).

test("language choice persists across a reload", async ({ page }) => {
  await registerAndSignIn(page, "lang");
  await page.goto("/settings");

  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Nederlands" }).click();

  await expect(page.getByRole("heading", { name: "Instellingen" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(page.getByRole("heading", { name: "Instellingen" })).toBeVisible();
});

test("theme choice persists across a reload", async ({ page }) => {
  await registerAndSignIn(page, "theme");
  await page.goto("/settings");

  await page.getByRole("radio", { name: /dark/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
