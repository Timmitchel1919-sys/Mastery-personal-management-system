import { expect, test } from "@playwright/test";
import { PASSWORD, registerAndSignIn, uniqueEmail } from "./_helpers";

// Critical journeys 1 (registration), 2 (login), 4 (password recovery), 6 (protected routes).

test("an unauthenticated visit to a protected route redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/);
  await expect(page).toHaveURL(/next=%2Fdashboard/);
});

test("register, sign out, and sign back in", async ({ page }) => {
  const email = await registerAndSignIn(page, "auth");
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("button", { name: /account|user menu|profile/i }).click();
  await page.getByRole("menuitem", { name: /sign out|log out/i }).click();
  await page.waitForURL(/\/login/);

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/dashboard/);
});

test("the forgot-password page accepts an email and confirms", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel(/email/i).fill(uniqueEmail("reset"));
  await page.getByRole("button", { name: /send|reset|email/i }).click();
  await expect(page.getByText(/check your (inbox|email)|sent|link/i)).toBeVisible();
});
