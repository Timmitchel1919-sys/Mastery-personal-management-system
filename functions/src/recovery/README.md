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
- `configure-accountability-partner.ts` — **Layer 15F** — `configureAccountabilityPartner`
  onCall (`op: "create" | "update" | "revoke"`): the only writer of
  `users/{uid}/recoveryAccountabilityPartners/{id}` (rules reject a direct client write).
  Every op is owner-scoped.
- `get-accountability-projection.ts` + `accountability-projection.ts` — **Layer 15F** —
  `getAccountabilityProjection` onCall: the only way a partner sees anything. The caller
  (the partner) must present a verified email matching an active, unexpired, unrevoked
  grant; the response is nothing but the scope's projection (streak / status / checked-in /
  a short summary / a custom field subset, optionally a bare setback count). Never returns
  reflections, HALT, triggers, setback narratives, coping actions, or coach sessions.
  Both handlers take injectable deps so they are unit-tested against fakes.

Written and unit-tested; **not deployed** — the project is on the Spark plan (ADR-0017/0018).
