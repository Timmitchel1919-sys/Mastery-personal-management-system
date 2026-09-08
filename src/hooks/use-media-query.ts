"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query. Hydration-safe: `serverValue` (default `false`) is used
 * during SSR and the first client render, then the real match takes over. Built on
 * `matchMedia` via `useSyncExternalStore` — no effect, no state, no mismatch warning.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
      }
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return serverValue;
    }
    return window.matchMedia(query).matches;
  }, [query, serverValue]);

  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}

/** True at Tailwind's `lg` breakpoint and up (>= 1024px). */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)", true);
}
