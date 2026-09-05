# Mastery — AI Architecture

All AI runs server-side. Provider keys never reach the client. The general planning AI and
the Recovery Coach are fully isolated from each other.

Built in **Layer 13** (general architecture) and **Layer 14** (weekly summary); the
Recovery Coach is **Layer 15E** and governed by `RECOVERY_PRIVACY.md`.

> **Layer 13 status:** the five general-coach endpoints below (everything except
> `generateWeeklySummary` and `recoveryCoachQuery`) are implemented in `functions/src/ai/`
> and unit-tested, using Anthropic Claude as the concrete `AiProvider`. They are **not
> deployed** — the Firebase project is on the Spark plan and the owner chose to defer the
> Blaze upgrade this session. See ADR-0017 in `docs/DECISIONS.md` and the Layer 13 entry in
> `docs/BUILD_PROGRESS.md`.

---

## 1. Principles

- Every AI request goes through an authenticated Firebase Cloud Function. No client-side
  provider SDK, no key in the bundle.
- The AI is given **only the context necessary for the current request** — never blanket
  access to all user data.
- The AI never invents user records, never makes irreversible changes automatically, and
  always lets the user accept / edit / reject a suggestion.
- Every recommendation explains which information influenced it and states its assumptions.
- Recommendations stay aligned with the user's defined values and priorities.

## 2. Endpoints

| Function | Purpose |
|---|---|
| `masteryCoachQuery` | primary general coach Q&A over authorized context |
| `generateWeeklySummary` | scheduled 7-day review (Layer 14) |
| `generatePlanningRecommendations` | assisted planning cascade suggestions |
| `generateGoalBreakdown` | goal → projects/milestones/tasks proposal |
| `generateReflectionQuestions` | journaling / review prompts |
| `analyzeExecutionPatterns` | planned-vs-actual pattern analysis |
| `recoveryCoachQuery` | **separate** Recovery Coach — isolated context & system prompt |

## 3. Context retrieval

- Retrieval from Firestore happens **only in trusted server code**, scoped to the caller's
  uid.
- The general coach may use: plans, goals, tasks, habits, KPIs, and **user-approved**
  journal context. Journal entries marked private are excluded unless the user explicitly
  shares them for the request.
- A per-request context builder selects the minimal slice (e.g. "this goal + its children +
  last 4 weeks of related KPI entries"), logs what was included, and returns that list to
  the client alongside the answer.
- Recovery data is **never** part of general-coach context.

## 4. Request / response contract

```
request  = { intent, targetRef?, userMessage?, options? }   // Zod-validated
response = {
  answer,                       // structured recommendation
  influencedBy: ContextRef[],   // what the model saw
  assumptions: string[],
  suggestedActions: Action[],   // each individually accept/edit/reject-able, none auto-applied
  disclaimers?: string[]
}                               // Zod-validated before returning
```

## 5. Infrastructure requirements

Authentication · authorization · input validation · output validation · rate limiting ·
request logging · error normalization · timeouts · safe retry strategy · cost controls ·
token limits · usage quotas · audit records · provider abstraction · safety controls ·
privacy boundaries.

- **Provider abstraction:** an `AiProvider` interface in `functions/src/ai/shared`; the
  concrete implementation and its secret are swappable without touching endpoints.
- **Cost controls:** per-user daily/monthly token quotas; max tokens per request; monthly
  spend ceiling with alerting; every call recorded (tokens, latency, cost, outcome).
- **Safety:** output validation, refusal handling, no medical/psychological diagnosis, and
  for the Recovery Coach a distinct non-judgmental system prompt that recommends
  professional/emergency help where appropriate.

## 6. Weekly AI Summary (Layer 14)

- Scheduled function evaluates the previous 7 days per user (respecting timezone and
  opt-in).
- Produces: accomplishments, completed goals/milestones/tasks, habit consistency, focus
  time, planning accuracy, delays, cancelled/postponed tasks, execution patterns, KPI
  movement, lessons, suggested priorities for next week.
- Stored at `users/{uid}/weeklySummaries/{summaryId}`. User is notified. User can review,
  archive, delete.
- Recovery data is excluded from the weekly summary.

## 7. Isolation between general AI and Recovery Coach

- Separate endpoints, separate system prompts, separate context builders, separate
  conversation storage (`recoveryCoachSessions` vs general coach history).
- Recovery Coach context never flows into the general planning AI, and recovery data is
  never used for unrelated analytics or personalization.
