import { defineConfig } from "vitest/config";

/**
 * Security-rules tests. Run via `npm run test:rules`, which starts the Firestore +
 * Storage emulators (`firebase emulators:exec`) before invoking this config.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
