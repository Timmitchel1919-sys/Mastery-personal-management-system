"use client";

import { IntelligencePanel } from "@/features/intelligence";
import { usePersonalizationSettings } from "../personalization-store";
import { PersonalPatternsPanel } from "./PersonalPatternsPanel";

/**
 * The adaptive slice of the dashboard, gated by the user's personalization
 * switches:
 *  - `adaptiveDashboard` → the Layer 9 IntelligencePanel (compact).
 *  - `personalizedRecommendations` → observed personal patterns.
 *
 * With both off the dashboard loses only these extras — every core section stays.
 */
export function DashboardAdaptive() {
  const { settings } = usePersonalizationSettings();

  return (
    <>
      {settings.adaptiveDashboard ? (
        <IntelligencePanel variant="compact" limit={2} />
      ) : null}
      {settings.personalizedRecommendations ? <PersonalPatternsPanel limit={2} /> : null}
    </>
  );
}
