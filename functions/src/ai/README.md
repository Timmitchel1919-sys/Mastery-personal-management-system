# functions/src/ai

General AI Coach endpoints — **Layer 13**. `masteryCoachQuery` plus supporting
endpoints (`generatePlanningRecommendations`, `generateGoalBreakdown`,
`generateReflectionQuestions`, `analyzeExecutionPatterns`). Provider keys live in
Functions secrets only; every request is authenticated, validated, rate-limited, and
audited. See `docs/AI_ARCHITECTURE.md`.
