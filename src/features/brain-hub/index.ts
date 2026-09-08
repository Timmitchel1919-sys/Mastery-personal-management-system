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
export { BrainHub } from "./components/BrainHub";
export { BrainScene } from "./components/BrainScene";
export { BrainHubView } from "./components/BrainHubView";
export { ModuleEnvironment } from "./components/ModuleEnvironment";
export { SubmoduleCard } from "./components/SubmoduleCard";
