# functions/src/scheduled

`generateWeeklySummary` — **Layer 14**. Runs daily; for every active, opted-in user whose
local calendar day is Monday (`weekly-summary/week-window.ts`), collects a bounded set of
facts about their past 7 days (`weekly-summary/collect-week-data.ts` — goals/milestones
completed, task completion/cancellation/overdue counts, habit consistency, focus minutes,
KPI movement), asks the AI provider for "lessons" and "suggested priorities for next week"
grounded only in those facts, and persists the result to `users/{uid}/weeklySummaries` plus
a `users/{uid}/notifications` record. Idempotent against a rerun for the same week.
Recovery data is never included — see `docs/RECOVERY_PRIVACY.md`.

Reminder sweeps join this directory in **Layer 17**.

Not yet deployed — see the note in `functions/src/index.ts` and ADR-0017.
