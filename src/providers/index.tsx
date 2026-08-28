"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./theme-provider";

/**
 * App-wide client providers. Later layers add I18nProvider (Layer 18) and
 * AuthProvider (Layer 4) around these.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}
