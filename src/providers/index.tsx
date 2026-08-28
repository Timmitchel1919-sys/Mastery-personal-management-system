"use client";

import type { ReactNode } from "react";

/**
 * App-wide client providers. Currently a passthrough. Later layers compose:
 *   - ThemeProvider  (Layer 2 / Layer 18)
 *   - I18nProvider   (Layer 18)
 *   - AuthProvider   (Layer 4)
 */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
