import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// `globals: false`, so Testing Library's auto-cleanup is not registered — do it here.
afterEach(() => {
  cleanup();
});
