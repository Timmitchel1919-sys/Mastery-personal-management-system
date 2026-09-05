export {
  AI_INTENTS,
  AI_INTENT_LABEL,
  aiIntentSchema,
  coachCallResultSchema,
  coachExchangeSchema,
  type AiIntent,
  type CoachAction,
  type ContextRef,
  type TargetRef,
  type CoachCallResult,
  type CoachExchange,
} from "./schema";
export { callCoach, type CallCoachOptions } from "./ai-coach-client";
export { listRecentCoachExchanges } from "./coach-exchange-repository";
export { useAiCoach } from "./use-ai-coach";
export { AiCoachView } from "./components/AiCoachView";
