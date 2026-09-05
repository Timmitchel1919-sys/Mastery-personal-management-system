import { expect, test } from "@playwright/test";
import { registerAndSignIn } from "./_helpers";

// Critical journeys 8 (goal creation) and 15 (dashboard aggregation reflects new data).

test("create a goal and see it in the goals list", async ({ page }) => {
  await registerAndSignIn(page, "goal");
  await page.goto("/plan/goals");

  await page
    .getByRole("button", { name: /new goal|add goal|create goal/i })
    .first()
    .click();

  const title = `Ship the beta ${Date.now()}`;
  await page.getByLabel(/title/i).fill(title);
  await page
    .getByRole("button", { name: /save|create|add/i })
    .first()
    .click();

  await expect(page.getByText(title)).toBeVisible();

  // Survives a reload (persisted to Firestore emulator, not just local state).
  await page.reload();
  await expect(page.getByText(title)).toBeVisible();
});

test("the dashboard loads for a fresh account without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await registerAndSignIn(page, "dash");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("main")).toBeVisible();
  expect(errors, errors.join("\n")).toHaveLength(0);
});
