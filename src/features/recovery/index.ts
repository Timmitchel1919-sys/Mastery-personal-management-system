export {
  LOCK_METHODS,
  lockMethodSchema,
  PIN_PATTERN,
  recoveryProfileSchema,
  recoveryProfileCreateSchema,
  recoveryProfileUpdateSchema,
  pinFormSchema,
  pinEntrySchema,
  type LockMethod,
  type RecoveryProfile,
  type RecoveryProfileCreate,
  type RecoveryProfileUpdate,
  type PinFormValues,
  type PinEntryValues,
} from "./schema";
export { generateSalt, hashPin, verifyPin } from "./pin-crypto";
export {
  getRecoveryLock,
  setRecoveryPin,
  verifyRecoveryPin,
  resetRecoveryPin,
} from "./recovery-lock-repository";
export { useRecoveryLock } from "./use-recovery-lock";
export {
  RECOVERY_GOAL_STATUSES,
  RECOVERY_GOAL_STATUS_LABEL,
  recoveryGoalStatusSchema,
  recoveryGoalSchema,
  recoveryGoalCreateSchema,
  recoveryGoalUpdateSchema,
  recoveryGoalFormSchema,
  recoveryGoalInputFromForm,
  type RecoveryGoal,
  type RecoveryGoalCreate,
  type RecoveryGoalUpdate,
  type RecoveryGoalFormValues,
  type RecoveryGoalStatus,
} from "./recovery-goal-schema";
export { recoveryGoalRepository, listActiveRecoveryGoals } from "./recovery-goal-repository";
export { useRecoveryGoals } from "./use-recovery-goals";
export {
  MAX_URGE,
  EMPTY_HALT,
  HALT_LABEL,
  recoveryCheckInSchema,
  recoveryCheckInCreateSchema,
  recoveryCheckInUpdateSchema,
  recoveryCheckInFormSchema,
  recoveryCheckInInputFromForm,
  type Halt,
  type RecoveryCheckIn,
  type RecoveryCheckInCreate,
  type RecoveryCheckInUpdate,
  type RecoveryCheckInFormValues,
} from "./recovery-checkin-schema";
export {
  listRecentCheckIns,
  getCheckInForDate,
  createCheckIn,
  updateCheckIn,
} from "./recovery-checkin-repository";
export { summarizeRecoveryProgress, type RecoveryProgress } from "./recovery-progress";
export { useRecoveryCheckIns } from "./use-recovery-checkins";
export {
  recoveryRelapseSchema,
  recoveryRelapseRequestSchema,
  recoveryRelapseResultSchema,
  recoveryRelapseFormSchema,
  recoveryRelapseRequestFromForm,
  type RecoveryRelapse,
  type RecoveryRelapseRequest,
  type RecoveryRelapseResult,
  type RecoveryRelapseFormValues,
} from "./recovery-relapse-schema";
export { listRecoveryRelapses, recordRecoverySetback } from "./recovery-relapse-client";
export { useRecoveryRelapses } from "./use-recovery-relapses";
export {
  COPING_CATEGORIES,
  COPING_CATEGORY_LABEL,
  COPING_SUGGESTIONS,
  copingCategorySchema,
  recoveryCopingActionSchema,
  recoveryCopingActionCreateSchema,
  recoveryCopingActionUpdateSchema,
  recoveryCopingActionFormSchema,
  copingInputFromSuggestion,
  type CopingCategory,
  type CopingSuggestion,
  type RecoveryCopingAction,
  type RecoveryCopingActionCreate,
  type RecoveryCopingActionUpdate,
  type RecoveryCopingActionFormValues,
} from "./recovery-coping-schema";
export {
  listCopingActions,
  createCopingAction,
  updateCopingAction,
  archiveCopingAction,
} from "./recovery-coping-repository";
export { useRecoveryCoping } from "./use-recovery-coping";
export {
  MAX_COACH_MESSAGE,
  recoveryCoachRequestSchema,
  recoveryCoachResultSchema,
  recoveryCoachSessionSchema,
  recoveryCoachFormSchema,
  type RecoveryCoachStep,
  type RecoveryCoachContextRef,
  type RecoveryCoachRequest,
  type RecoveryCoachResult,
  type RecoveryCoachSession,
  type RecoveryCoachFormValues,
} from "./recovery-coach-schema";
export { askRecoveryCoach, listRecoveryCoachSessions } from "./recovery-coach-client";
export { useRecoveryCoach } from "./use-recovery-coach";
export {
  ACCOUNTABILITY_SCOPES,
  ACCOUNTABILITY_SCOPE_LABEL,
  ACCOUNTABILITY_SCOPE_DESCRIPTION,
  ACCOUNTABILITY_CUSTOM_FIELDS,
  ACCOUNTABILITY_CUSTOM_FIELD_LABEL,
  accountabilityScopeSchema,
  recoveryAccountabilityPartnerSchema,
  configureAccountabilityRequestSchema,
  configureAccountabilityResultSchema,
  accountabilityProjectionSchema,
  getAccountabilityProjectionRequestSchema,
  accountabilityFormSchema,
  type AccountabilityScope,
  type AccountabilityCustomField,
  type RecoveryAccountabilityPartner,
  type ConfigureAccountabilityRequest,
  type ConfigureAccountabilityResult,
  type AccountabilityProjection,
  type GetAccountabilityProjectionRequest,
  type AccountabilityFormValues,
} from "./recovery-accountability-schema";
export {
  configureAccountabilityPartner,
  listAccountabilityPartners,
  getAccountabilityProjection,
} from "./recovery-accountability-client";
export { useRecoveryAccountability } from "./use-recovery-accountability";
export { useAccountabilityProjection } from "./use-accountability-projection";
export { PartnerProjectionView, PartnerProjectionPage } from "./components/PartnerProjectionView";
export { RecoveryGate } from "./components/RecoveryGate";
export { RecoveryHomeView } from "./components/RecoveryHomeView";
