"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * `false` during SSR and the first client render, `true` afterwards. Hydration-safe way
 * to branch on client-only values (the wall clock, `window`, media queries) without a
 * mismatch warning.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
