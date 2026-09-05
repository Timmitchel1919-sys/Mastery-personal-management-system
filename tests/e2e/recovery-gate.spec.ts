import { expect, test } from "@playwright/test";
import { registerAndSignIn } from "./_helpers";

// Critical journey 20 (Recovery privacy gate): the module stays locked behind a PIN.

test("the Recovery Center is gated by a PIN and unlocks with it", async ({ page }) => {
  await registerAndSignIn(page, "recovery");
  await page.goto("/recovery");

  // First visit — set up a PIN. The recovery goals list must not be reachable yet.
  await expect(page.getByRole("heading", { name: /recovery center/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /new recovery goal/i })).toHaveCount(0);

  const pin = "2468";
  const pinInputs = page.getByLabel(/pin|passcode/i);
  await pinInputs.first().fill(pin);
  if ((await pinInputs.count()) > 1) await pinInputs.nth(1).fill(pin); // confirm field
  await page
    .getByRole("button", { name: /set|save|create|continue/i })
    .first()
    .click();

  // Now unlocked — the goals area is available.
  await expect(page.getByRole("button", { name: /new recovery goal/i })).toBeVisible();

  // Lock again and confirm it re-gates.
  await page.getByRole("button", { name: /^lock$/i }).click();
  await expect(page.getByRole("button", { name: /new recovery goal/i })).toHaveCount(0);
});
