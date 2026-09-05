import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/unit/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "json-summary"],
      reportsDirectory: "./coverage",
      // Only the code this suite actually exercises. Emulator-backed code (repositories,
      // rules helpers) and Cloud Functions have their own suites; e2e-only flows aren't
      // counted here.
      include: [
        "src/features/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "src/i18n/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
        "src/config/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.d.ts",
        "**/index.ts",
        "src/app/**",
        "src/test/**",
        "**/*-repository.ts",
        "**/*-client.ts",
        "src/lib/firebase/**",
        "src/providers/**",
      ],
      // CI gate — the current baseline, rounded down, so coverage can only hold or rise.
      thresholds: {
        lines: 53,
        functions: 43,
        statements: 51,
        branches: 58,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
