import type { Page } from "@playwright/test";

/** A unique email per test run so parallel specs never collide in the auth emulator. */
export function uniqueEmail(tag: string): string {
  return `${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export const PASSWORD = "sup3r-secret-42";

/** Register a fresh account and land on the dashboard. */
export async function registerAndSignIn(page: Page, tag = "e2e"): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/register");
  await page.getByLabel(/name/i).fill(`${tag} tester`);
  await page.getByLabel(/email/i).fill(email);
  await page
    .getByLabel(/password/i)
    .first()
    .fill(PASSWORD);
  await page.getByRole("button", { name: /create account|sign up|register/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  return email;
}
