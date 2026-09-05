# functions/src/recovery

Recovery Center server-mediated access — **Layer 15**. Per `docs/RECOVERY_PRIVACY.md` §3,
relapse/setback records, coach sessions, and accountability configuration are written only
by Cloud Functions; the Firestore rules reject a direct client write for those paths.

- `record-recovery-setback.ts` — **Layer 15C** — `recordRecoverySetback` onCall: verifies
  the goal belongs to the caller, then writes `users/{uid}/recoveryGoals/{goalId}/relapses/{id}`
  via the Admin SDK. `handleRecordRecoverySetback(request, db?)` takes an injectable
  Firestore so it is unit-tested against a fake — no real Firestore or network.
- `recovery-coach-query.ts` + `recovery-coach-context.ts` — **Layer 15E** —
  `recoveryCoachQuery` onCall: a fully isolated AI endpoint. Its own system prompt
  (`RECOVERY_COACH_SYSTEM` — supportive, non-judgmental, immediate safe next step, no
  diagnosis, recommends professional/emergency help on risk), its own context builder that
  reads **only** the caller's recovery collections (goal + check-ins + setbacks + coping
  toolkit), and its own storage `users/{uid}/recoveryCoachSessions/{id}` (rules reject a
  direct client write). It shares only the per-user AI spend counters
  (`aiUsageDaily`/`aiUsageMonthly`) — nothing recovery-derived is written to
  `coachExchanges` or `aiCallLogs`. `handleRecoveryCoachQuery(request, { db, provider, now? })`
  takes injectable deps so it is unit-tested against fakes.
- Accountability-partner access (15F) — scoped projections only.

Written and unit-tested; **not deployed** — the project is on the Spark plan (ADR-0017/0018).
