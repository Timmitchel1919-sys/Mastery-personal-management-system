/**
 * The Mastery component system — branded composite components that give every
 * area of the product one visual language.
 *
 * Primitives (Button, Input, Dialog, Badge, Progress, …) live in
 * `@/components/ui`; generic states (EmptyState, LoadingState, ErrorState) in
 * `@/components/shared`. This barrel re-exports the ones that form the Mastery
 * surface so feature code has a single import site.
 */

export { MetricCard, type MetricCardProps } from "./MetricCard";
export { ModuleCard, type ModuleCardProps } from "./ModuleCard";
export { StatusBadge, type StatusBadgeProps, type StatusKind } from "./StatusBadge";

// Re-exports — shared Mastery pieces that already live elsewhere.
export {
  GlassPanel,
  GlassCard,
  ProgressRing,
  SectionHeader,
  type GlassPanelProps,
} from "@/components/ui";
export { EmptyState, LoadingState, ErrorState } from "@/components/shared";
