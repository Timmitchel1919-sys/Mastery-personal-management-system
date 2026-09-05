# functions/src/ai

General AI Coach endpoints — **Layer 13**. `masteryCoachQuery` plus supporting endpoints
(`generatePlanningRecommendations`, `generateGoalBreakdown`, `generateReflectionQuestions`,
`analyzeExecutionPatterns`) all share one flow in `shared/handler.ts`: authenticate,
validate, enforce a per-user quota, build a minimal per-intent context
(`shared/context-builder.ts`), call the provider (`shared/ai-provider.ts` — Anthropic
Claude today, swappable), validate the model's structured JSON output, record usage/audit,
persist the exchange to `coachExchanges`, and return the documented contract from
`docs/AI_ARCHITECTURE.md` §4.

Provider keys live in Functions secrets only (`ANTHROPIC_API_KEY`, bound per-callable).
`generateWeeklySummary` is Layer 14; `recoveryCoachQuery` is a separate, isolated endpoint
(Layer 15E) that must never share context or storage with these.

**Not yet deployed** — the Firebase project is on the Spark (free) plan; Cloud Functions
deploy requires Blaze, which is the owner's call, not built into this layer. The code is
written and unit-tested (`functions/tests/ai/`).
