export {
  usePersonalizationSettings,
  DEFAULT_SETTINGS,
  type PersonalizationSettings,
} from "./personalization-store";
export {
  dataSufficiency,
  classifyTrend,
  acceptanceFromHistory,
  buildPersonalPatterns,
  detectSignificantChange,
  SUFFICIENCY_THRESHOLDS,
  SUFFICIENCY_LABEL,
  type DataSufficiency,
  type PersonalTrend,
  type PersonalPattern,
  type AcceptanceSignal,
} from "./personal-signals";
export { usePersonalization } from "./use-personalization";
export { PersonalPatternCard } from "./components/PersonalPatternCard";
export { PersonalPatternsPanel } from "./components/PersonalPatternsPanel";
export { PersonalizationSettingsCard } from "./components/PersonalizationSettings";
export { DashboardAdaptive } from "./components/DashboardAdaptive";
