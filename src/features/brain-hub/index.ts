export {
  BRAIN_MODULES,
  brainModule,
  nodePosition,
  type BrainModule,
  type BrainModuleId,
  type BrainModuleStatus,
  type BrainHubPhase,
} from "./brain-modules";
export { useBrainNavigation, type BrainNavigationState } from "./brain-navigation";
export { supportsWebgl } from "./webgl";
export {
  MODULE_REGISTRY,
  moduleDef,
  submoduleDef,
  type ModuleDef,
  type SubmoduleDef,
} from "./module-registry";
export {
  buildBrainSystemState,
  deriveModuleStatus,
  deriveOverallActivity,
  makeNeutralBrainSystemState,
  type BrainModuleSignal,
  type BrainModuleVisual,
  type BrainOverallActivity,
  type BrainSystemState,
} from "./brain-state";
export { useBrainSystemState } from "./use-brain-system-state";
export { BrainHub } from "./components/BrainHub";
export { BrainScene } from "./components/BrainScene";
export { BrainHubView } from "./components/BrainHubView";
export { ModuleEnvironment } from "./components/ModuleEnvironment";
export { SubmoduleCard } from "./components/SubmoduleCard";
export { SubmoduleWorkspace } from "./components/SubmoduleWorkspace";
