# functions/src/recovery

Recovery Center server-mediated access — **Layer 15**. Per `docs/RECOVERY_PRIVACY.md` §3,
relapse/setback records, coach sessions, and accountability configuration are written only
by Cloud Functions; the Firestore rules reject a direct client write for those paths.

- `record-recovery-setback.ts` — **Layer 15C** — `recordRecoverySetback` onCall: verifies
  the goal belongs to the caller, then writes `users/{uid}/recoveryGoals/{goalId}/relapses/{id}`
  via the Admin SDK. `handleRecordRecoverySetback(request, db?)` takes an injectable
  Firestore so it is unit-tested against a fake — no real Firestore or network.
- `recoveryCoachQuery` (15E) — isolated system prompt + context, never mixed with the
  general AI.
- Accountability-partner access (15F) — scoped projections only.

Written and unit-tested; **not deployed** — the project is on the Spark plan (ADR-0017/0018).
