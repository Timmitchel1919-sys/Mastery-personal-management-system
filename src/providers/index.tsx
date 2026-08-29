"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * App-wide client providers. Later layers add I18nProvider (Layer 18) around these.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider delayDuration={200} skipDelayDuration={300}>
          {children}
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
