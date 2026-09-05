import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (Layer 21). They drive a real browser against the app running with the
 * Firebase Emulator Suite, so no test ever touches a real Firebase project or the AI
 * providers.
 *
 * Prerequisites (CI, and locally):
 *   1. `npx playwright install --with-deps chromium`
 *   2. `firebase emulators:start --only auth,firestore,storage` (or `emulators:exec`)
 *   3. The dev server started by `webServer` below picks up
 *      `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` from the environment.
 *
 * Run: `npm run test:e2e` (headless) / `npm run test:e2e:ui` (Playwright UI).
 */

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
      NEXT_PUBLIC_APP_ENV: "test",
    },
  },
});
