"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n";
import { OfflineBanner, ServiceWorkerRegister } from "@/components/pwa";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";

/** App-wide client providers. `I18nProvider` (Layer 18) is outermost so every string,
 * including provider-level copy, resolves against the active locale. The PWA bootstrap
 * (Layer 19) registers the service worker and shows the offline banner on every route. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={200} skipDelayDuration={300}>
            <ServiceWorkerRegister />
            <OfflineBanner />
            {children}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
