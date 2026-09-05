# Changelog

All notable changes to Mastery are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project builds in numbered
layers; each entry maps to a layer.

## [Unreleased]

### Layer 16 — Reports & PDF Export — 2026-09-05

**Added**
- `src/features/reports/` — compose a report for any period (`weekly` / `monthly` /
  `quarterly` / `annual` / `custom`) from a chosen set of sections (`summary`, `goals`,
  `habits`, `focus`, `kpis`, `planning`):
  - `report-data.ts` — `buildReportData(range, sections)`, an aggregation service: one
    `Promise.all` over the goal / milestone / task / habit / habitLog / focusSession / kpi /
    kpiEntry repositories (only those a requested section needs), filtered to the range. It
    **never reads a Recovery Center collection**, so a report can't leak recovery data.
  - `report-schema.ts` / `report-repository.ts` / `use-reports.ts` — the stored
    metadata record (`users/{uid}/reports/{id}` — title, period, range, sections, `format`,
    `generatedAt`; client-written, owner-only), the generate form, and the hook.
  - `ReportDocument` — a branded, fixed-light "paper" page with a stat grid / table per
    section, per-section empty handling, and a "Recovery Center data is never included"
    footer. `ReportsView` at `/analytics/reports` — the generate form + a "Download PDF"
    action (`window.print()`) + a history list.
- `src/app/globals.css` — an `@media print` block isolates `[data-report-print]` and hides
  `[data-print-hide]` app chrome so "Save as PDF" produces a clean report.

**Changed**
- `src/app/(app)/analytics/reports/page.tsx` — `ModulePlaceholder` → `<ReportsView />`.
- `docs/DATA_MODEL.md` describes `reports/{reportId}`; `docs/ARCHITECTURE.md` §1/§5;
  `docs/DECISIONS.md` — ADR-0025.

**Tests:** `report-schema` (form + `resolvePeriodRange` + title + record), `report-data` (8
— section/repo selection, period filtering, habit consistency, focus sums, KPI first-vs-last,
task on-time/late/cancelled/overdue), `ReportDocument` (3), `ReportsView` (4), and a report
metadata integration test (written, not executed in-session).

**Known limitation:** the PDF is the browser's "Save as PDF" — no server-rendered PDF (a
`generateReportPdf` Cloud Function is documented but not built; needs Blaze). Reads are
capped at one repository page per collection, and "completed in period" is approximated
from `updatedAt`.

### Layer 15F — Accountability Partner — 2026-09-05

The final Recovery Center sublayer — **Layer 15 (15A–15F) is complete.**

**Added**
- `functions/src/recovery/configure-accountability-partner.ts` —
  `configureAccountabilityPartner` (`op: "create" | "update" | "revoke"`), the only writer
  of `users/{uid}/recoveryAccountabilityPartners/{id}` (rules reject a direct client write).
- `functions/src/recovery/get-accountability-projection.ts` + `accountability-projection.ts`
  — `getAccountabilityProjection`: the only way a partner sees anything. Requires the
  caller's verified email to match an active, unexpired, unrevoked grant; returns nothing
  but the scope's projection (streak / status / checked-in-today / a short summary / a
  custom field subset, optionally a bare setback count). Never reflections, HALT, triggers,
  setback narratives, coping actions, or coach sessions. Both written and unit-tested;
  **not deployed** (Spark plan).
- `src/features/recovery/recovery-accountability-schema.ts` / `-client.ts` /
  `use-recovery-accountability.ts` / `use-accountability-projection.ts`.
- `AccountabilitySection` (in the goal detail view) with `AccountabilityPartnerDialog` —
  the owner shares a narrow slice of one goal under a permission scope, with an optional
  expiry and revoke; `PartnerProjectionView` + `/recovery/partner` route — the
  partner-facing card, outside the PIN gate.

**Changed**
- `firestore.rules` — `isServerMediatedRecoveryWrite` now also refuses a direct client
  write to the top-level `recoveryAccountabilityPartners` collection.
- `RecoveryHomeView`'s "Coming next" block is removed (Layer 15 is done).
- `functions/tests/ai/fakes.ts` — the fake Firestore doc ref gained `update()`.
- `docs/DATA_MODEL.md`, `docs/RECOVERY_PRIVACY.md` §6; `docs/DECISIONS.md` — ADR-0024.

**Tests:** `configure-accountability-partner` (7), `get-accountability-projection` (9),
`accountability-projection` (3), recovery-accountability schema, `AccountabilitySection`
(5), `PartnerProjectionView` (2), a Layer 15F rules block, and a grant integration test —
the last two written, not executed in-session (emulator restriction).

**Known limitation:** neither Cloud Function is deployed, so configuring a partner or
viewing a shared projection fails in production until Blaze; the partner must already be a
Mastery user with a verified email; reminder delivery is Layer 17.

### Layer 15E — Recovery Coach — 2026-09-05

**Added**
- `functions/src/recovery/recovery-coach-query.ts` + `recovery-coach-context.ts` —
  `recoveryCoachQuery`, a fully isolated AI Cloud Function: its own `RECOVERY_COACH_SYSTEM`
  prompt (supportive, non-judgmental, immediate safe next step, crisis→professional/emergency
  help, no diagnosis), its own context builder that reads **only** the caller's recovery
  data for one goal (goal + check-ins + setbacks + coping toolkit), and its own storage
  `users/{uid}/recoveryCoachSessions/{id}`. Shares only the per-user AI spend counters via
  the new `bumpUsageCounters` (extracted from `recordUsage`); writes nothing to
  `coachExchanges` / `aiCallLogs`. Faith-based encouragement is gated on the goal's opt-in.
  Written and unit-tested; **not deployed** (Spark plan).
- `src/features/recovery/recovery-coach-schema.ts` / `recovery-coach-client.ts` /
  `use-recovery-coach.ts` — client side: `askRecoveryCoach` calls the callable,
  `listRecoveryCoachSessions` reads history back (sessions are Cloud-Function-only).
- `RecoveryCoachPanel` — a goal-scoped section in the recovery goal detail view: a message
  box, "Ask for a next step", and the recent replies with their suggested steps and
  disclaimers.

**Changed**
- `firestore.rules` — `isServerMediatedRecoveryWrite` gained a `collection` parameter and
  now also refuses a direct client write to the top-level `recoveryCoachSessions`
  collection (reads unchanged).
- `functions/src/ai/shared/quota.ts` — `bumpUsageCounters` extracted from `recordUsage`
  (behavior identical; the general endpoints still write their `aiCallLogs` record).
- `RecoveryHomeView`'s "Coming next" list drops to just the accountability partner (15F).
- `docs/AI_ARCHITECTURE.md` §7, `docs/DATA_MODEL.md`, `docs/RECOVERY_PRIVACY.md` updated;
  `docs/DECISIONS.md` — ADR-0023.

**Tests:** `recovery-coach-query` function tests (8), `recovery-coach-context` tests (3),
`bumpUsageCounters` tests (3), recovery-coach schema tests, `RecoveryCoachPanel` component
tests, plus a Layer 15E rules block and a coach integration test (both written, not
executed in-session — emulator restriction).

**Known limitation:** `recoveryCoachQuery` is not deployed, so "Ask for a next step" fails
in production until the owner upgrades to Blaze; the coach is goal-scoped only.

### Layer 15D — Coping Toolkit — 2026-09-05

**Added**
- `src/features/recovery/recovery-coping-schema.ts` / `recovery-coping-repository.ts` /
  `use-recovery-coping.ts` — a per-goal coping toolkit
  (`users/{uid}/recoveryGoals/{goalId}/copingActions`): coping actions with `title`,
  `category` (grounding / physical / social / cognitive / faith / other) and a short
  `howTo`. Client-written under the generic owner-only rule; removal is a reversible
  archive. Includes `COPING_SUGGESTIONS`, an 11-item starter library of evidence-informed
  behavioral prompts (3 faith-based).
- `CopingToolkitSection` in the recovery goal detail view — lists saved coping actions,
  an "Add your own" dialog (`CopingActionDialog`), and a "Quick add" chip row of unused
  suggestions; faith-based suggestions appear only when the goal opts in.

**Changed**
- `RecoveryGoalDetailView` mounts the toolkit between check-ins and setbacks;
  `RecoveryHomeView`'s "Coming next" list drops to Recovery Coach (15E) and accountability
  partner (15F).
- `docs/DATA_MODEL.md` describes `copingActions`; `docs/DECISIONS.md` — ADR-0022;
  `docs/RECOVERY_PRIVACY.md` — Layer 15D status.

**Tests:** recovery-coping schema tests, `CopingToolkitSection` component tests, a coping
emulator integration test, and a Layer 15D rules block (owner create/read/archive; cross-user
denied) — the last two written, not executed in-session (emulator restriction).

**Known limitation:** no Cloud Function and no `firestore.rules` change this layer; hard
delete of coping actions is still deferred, and the suggestion library is English-only
until i18n (Layer 18).

### Layer 15C — Check-ins & Tracking — 2026-09-05

**Added**
- `src/features/recovery/recovery-checkin-schema.ts` / `recovery-checkin-repository.ts` /
  `recovery-progress.ts` / `use-recovery-checkins.ts` — daily recovery check-ins under a
  goal (`date`, `stayedOnTrack`, `urgeIntensity` 0-10, HALT booleans, `triggersToday` /
  `copingUsed`, `reflection`), upserted one-per-day; a bespoke nested repository; and pure
  `summarizeRecoveryProgress` (current / longest streak, days on track, average urge —
  derived on read, never stored).
- `src/features/recovery/recovery-relapse-schema.ts` / `recovery-relapse-client.ts` /
  `use-recovery-relapses.ts` — setback records read by the client but written **only** by
  the `recordRecoverySetback` Cloud Function.
- `functions/src/recovery/record-recovery-setback.ts` — the onCall that validates the
  request, checks the goal exists, and writes `recoveryGoals/{goalId}/relapses/{id}` via
  the Admin SDK. Written and unit-tested; **not deployed** (Spark plan — as with the Layer
  13/14 AI functions).
- `RecoveryGoalDetailView` with a progress grid, recent check-ins, and setbacks list;
  `CheckInDialog` and `RelapseLogDialog` (framed as "restart from here", never failure).
  `RecoveryGoalCard` gains an "Open" button; `RecoveryHomeView` routes to the detail view.
- Tests: `record-recovery-setback` function tests (6), recovery-progress /
  recovery-checkin-schema / recovery-relapse-schema unit tests, `RecoveryGoalDetailView`
  component tests, a check-ins emulator integration test, and a Layer 15C rules block
  (direct relapse client write rejected) — the last two written, not executed in-session.

**Changed**
- `firestore.rules` — the recursive-wildcard owner-only rule now refuses a direct client
  write to `.../relapses/{id}` (`isServerMediatedRecoveryWrite`), making the Cloud Function
  the only writer. Reads unchanged.
- `docs/DATA_MODEL.md` describes `checkIns` and `relapses`; `docs/DECISIONS.md` — ADR-0021.

**Known limitation:** `recordRecoverySetback` is not deployed, so "Log a setback" fails in
production until the owner upgrades to Blaze; check-ins are fully functional (client-only).
Hard delete of recovery data is still deferred.

### Layer 15B — Recovery Data Model — 2026-09-08

**Added**
- `src/features/recovery/recovery-goal-schema.ts` / `recovery-goal-repository.ts` /
  `use-recovery-goals.ts` — the `recoveryGoals` collection: one record per self-identified
  behavior with `behavior`, `motivation`, `startDate`, `triggers`/`warningSigns`/
  `copingStrategies` lists, `supportNotes`, `faithBasedEncouragement` (opt-in), and a
  neutral `recoveryStatus` (`active`/`going-well`/`challenging`/`paused` — no
  shame-framed state). Client-written under the existing owner-only rule.
- `RecoveryGoalForm` / `RecoveryGoalDialog` / `RecoveryGoalCard`, and the Recovery Center
  home now shows the goals list (create / edit / archive) behind the Layer 15A PIN gate,
  with a calm "not medical or psychological advice" disclaimer.
- Tests: recovery-goal schema unit tests; `RecoveryHomeView` rewritten for the goals list;
  a `recoveryGoals` block in the rules regression test; a create/update/archive emulator
  integration test (written; not executed in-session).

**Changed**
- `docs/DATA_MODEL.md` annotates `recoveryGoals` and marks the still-reserved
  subcollections with their planned sublayer.
- `docs/DECISIONS.md` — ADR-0020.

**Known limitation:** archive only — hard deletion of a recovery goal (cascading its
future subcollections) is a dedicated Cloud Function to be built with Layer 15C.

### Layer 15A — Recovery Center Privacy Architecture — 2026-09-08

**Added**
- `src/features/recovery/` — the Recovery Center's privacy gate: a client-side salted
  SHA-256 PIN (`pin-crypto.ts`, Web Crypto, no new dependency), a singleton
  `recoveryProfiles/{uid}` lock config (`lockMethod` extensible for a future WebAuthn
  method, `pinHash`/`pinSalt`, client-tracked failed-attempt lockout), session-scoped
  "unlocked" state (`sessionStorage`, 15-minute TTL, cleared on tab close), and a
  "forgot PIN" reset flow. `RecoveryGate` wraps the entire `/recovery` route so nothing
  behind it renders until unlocked; `RecoveryHomeView` shows the privacy assurances and an
  honest "coming in 15B–15F" list rather than fabricated feature content.
- `/recovery` renders the real gate + home (was a placeholder).
- Tests: pin-crypto/schema unit tests; `RecoveryGate`/`RecoveryHomeView` component tests;
  a dedicated `tests/rules/recovery.rules.test.ts` regression suite for `recoveryProfiles`
  specifically; a lock-flow emulator integration test (written; not executed in-session).

**Changed**
- `firestore.rules` — comment-only: flags that a later sublayer adding a
  Cloud-Function-only-write recovery collection must restructure the generic owner-only
  wildcard rule to exclude it (Firestore ORs every matching rule together, so a narrower
  block alongside it cannot restrict anything on its own).
- `docs/RECOVERY_PRIVACY.md` — added the PIN gate's own access-path row to §8's table and
  a Layer 15A status note.
- `docs/DATA_MODEL.md` annotates `recoveryProfiles`.
- `docs/DECISIONS.md` — ADR-0019.

**Known limitation:** the PIN protects against casual access, not the account owner —
documented explicitly as a privacy shield, not encryption. No behavioral tracking data
(`recoveryGoals`, check-ins, coping toolkit, Recovery Coach, accountability partner)
exists yet — that's Layer 15B onward.

### Layer 14 — Weekly AI Summary — 2026-09-04 — scheduled Cloud Function written and unit-tested, not yet deployed

**Added**
- `functions/src/scheduled/generate-weekly-summary.ts` — a daily `onSchedule` function
  that, for every active user whose local calendar day is Monday (via each user's own
  stored `timezone`) and who hasn't opted out, evaluates their past 7 local days and
  stores a Weekly AI Summary: computed facts (goals/milestones completed, task
  completion/cancellation/overdue, habit consistency, focus time, KPI movement) plus
  AI-generated `lessons`/`suggestedPriorities` grounded only in those facts. Idempotent
  against a rerun for the same week. Also writes the app's first `notifications` document.
- `src/features/auth/schema.ts` — `userProfileSchema` gains `weeklySummaryEnabled`
  (default `true`), the opt-in this layer's scheduler respects.
- `src/features/weekly-summaries/` — reads the summary history and lets the user archive
  or delete an entry (the Cloud Function is the sole writer); surfaced as a new "Weekly
  Summaries" tab on the existing AI Coach page rather than a new nav item.
- Tests: `functions/tests/scheduled/` (25 new tests covering timezone-aware scheduling,
  paginated user listing, fact collection, generation + idempotency, and batch error
  isolation); `weekly-summaries` schema/view unit tests; a read/archive/delete emulator
  integration test (written; not executed in-session).

**Changed**
- `functions/tests/ai/fakes.ts` — the shared fake Firestore now really implements
  `orderBy`/`startAfter` (was a documented no-op) and an `.empty` flag, both needed by
  this layer's tests.
- `docs/DATA_MODEL.md` annotates `weeklySummaries` and `notifications`.
- `docs/DECISIONS.md` — ADR-0018.

**Known limitation:** not deployed this layer — same Spark-plan situation as Layer 13
(ADR-0017); no summary is generated until the owner upgrades to Blaze and deploys.

### Layer 13 — General AI Architecture — 2026-09-04 — Cloud Functions written and unit-tested, not yet deployed

**Added**
- `functions/src/ai/` — five authenticated Cloud Functions (`masteryCoachQuery`,
  `generatePlanningRecommendations`, `generateGoalBreakdown`,
  `generateReflectionQuestions`, `analyzeExecutionPatterns`) sharing one flow: auth,
  request validation, a per-user daily/monthly quota, a minimal per-intent context (own
  data only, bounded reads), a provider call, structured-JSON-output validation, usage/
  audit logging, and a persisted exchange — returning the documented `answer` /
  `assumptions` / `suggestedActions` / `disclaimers` / `influencedBy` contract.
  `influencedBy` is always attached server-side from the context actually loaded, never
  produced by the model. An `AiProvider` interface keeps the vendor swappable; the
  concrete implementation calls Anthropic Claude via the new `@anthropic-ai/sdk`
  dependency, with its key bound as a Functions secret.
- `src/features/ai-coach/` — calls the five callables and reads back the resulting
  `coachExchanges` history (write access is Admin-SDK-only); `AiCoachView` with an intent
  picker and exchange history.
- `src/lib/firebase/client.ts` gains a Functions client instance — the app's first
  Cloud-Function-calling feature.
- `/grow/ai-coach` renders the real feature (was a placeholder).
- Tests: `functions/tests/ai/` (28 new tests against an in-memory Firestore/provider fake
  — quota thresholds, context building, and the full handler orchestration, including
  quota-blocked and malformed-model-output paths); `ai-coach` schema/view unit tests; a
  read-path emulator integration test (written; not executed in-session).

**Changed**
- `docs/DATA_MODEL.md` annotates `coachExchanges`, `aiUsageDaily`, `aiUsageMonthly`,
  `aiCallLogs`.
- `docs/DECISIONS.md` — ADR-0017: Anthropic as the provider, and the owner's explicit
  choice to write/test this layer's Cloud Functions now and deploy them later (the Spark
  plan stays; deploying needs a Blaze upgrade, which remains the owner's call).

**Known limitation:** Cloud Functions are not deployed this layer — the AI Coach page is
live but calls will fail with a normalized error until they are (two owner actions:
upgrade to Blaze, then `firebase deploy --only functions` after setting the
`ANTHROPIC_API_KEY` secret).

### Layer 12 — KPI, Analytics & Life Score — 2026-09-04

**Added**
- `src/features/kpis/` — KPI definitions over `users/{uid}/kpis` with a free-text category,
  0–3 pillars, unit, `direction` (higher/lower-is-better), nullable target, a
  user-configurable `weight` (1–5) for the Life Score, and goal link; pure
  `kpiAttainment(kpi, value)` (0–100 toward the target, `null` with no target set); a
  separate append-only `kpiEntries` time series (the KPI never stores a "current value");
  `kpiRepository`/`listActiveKpis`, `kpiEntryRepository`/`listRecentKpiEntries`;
  `summarizeKpis`; `useKpis`; UI (`KpisView`, `KpiForm`, `KpiDialog`, `AddKpiEntryDialog`,
  `KpiCard` with an attainment badge, progress bar, and a sparkline of recent entries).
- `src/features/life-score/` — a documented, configurable Life Score: `computeLifeScore`
  (pure) is the weight-average of every scorable KPI's attainment, excluding KPIs with no
  target or no entry rather than scoring them 0, and always returning the contributing
  `factors` so the score is never unexplained; `lifeScoreEntries` preserves saved snapshots
  as history (`saveToday` upserts by date); UI (`LifeScoreView` with the score, its
  contributing factors, and a history sparkline; `SaveScoreDialog`).
- `src/features/trends/` — a metric picker (Life Score or any KPI) over a `Sparkline` with
  min/max/average/latest/change stats (`summarizeTrend`, pure).
- `src/components/shared/Sparkline.tsx` — a small dependency-free SVG line chart (optional
  dashed target line, accessible `role="img"`) — no charting library existed yet, and this
  covers every "trend over time" need this layer introduces.
- `/analytics/kpis`, `/analytics/life-score`, `/analytics/trends` render the real features
  (were placeholders). `/analytics/reports` stays a placeholder (Layer 16).
- Tests: schema/stats/pure-formula unit tests across all three features; `KpisView`,
  `LifeScoreView`, `TrendsView`, `Sparkline` (mocked hooks / direct render); KPI and Life
  Score emulator integration tests (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `kpis`, `kpiEntries`, `lifeScoreEntries`.

### Layer 11D — Skills — 2026-09-04 — closes the Grow domain (11A–11D)

**Added**
- `src/features/skills/` — a skill inventory over `users/{uid}/skills`: `skillSchema` +
  create/update/form + `skillInputFromForm` (category, starting/target proficiency 1-5,
  practice plan, `evidence`/`resources`, goal/pillar links, next review date); separate
  `skillReviewSchema` family (append-only progress-history log); pure `currentProficiency`
  (latest review, else starting proficiency) and `progressToTarget` (0-100, clamped) —
  proficiency is derived, never duplicated onto the skill; `skillRepository` +
  `listActiveSkills`/`listSkillOptions`, `skillReviewRepository` +
  `listRecentSkillReviews`; `useSkills` (`logReview`/`removeReview`), `useSkillOptions`; UI
  (`SkillsView`, `SkillForm`, `SkillDialog`, `LogReviewDialog`, `SkillCard` with a
  current→target badge, overdue review indicator, and recent-reviews list).
- `/grow/skills` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `SkillsView` (mocked hook); a skills emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `src/features/learning/` — wired up the `skillId` link deferred in Layer 11B: a Skill
  picker on the learning item form, a linked-skill chip on the card, and
  `learningItemInputFromForm` now maps the form's skill selection instead of hardcoding
  `null`.
- `docs/DATA_MODEL.md` annotation for `skills` + `skillReviews`.

### Layer 11C — Reading — 2026-09-02

**Added**
- `src/features/reading/` — a reading list over `users/{uid}/books`, grouped into
  Currently reading / Want to read / Completed / Abandoned: `bookSchema` + create/update/
  form + `bookInputFromForm` (page-based progress, user-entered `highlights`/`lessons`/
  `actionItems`, goal/pillar links); `emptyHighlight` / `emptyActionItem` /
  `readingProgressPercent` (pure); `summarizeReading` (pure); `bookRepository` +
  `listActiveBooks`; `useReading` (`toggleActionItem`); UI (`ReadingView` split into
  status sections, `BookForm` with two `useFieldArray` editors, `BookDialog`, `BookCard`
  with a progress bar, styled highlight quotes, and a live action-item checklist).
  **No book metadata lookup** — every field is user-entered, per the spec's constraint
  against reproducing copyrighted book content.
- `/grow/reading` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `ReadingView` (mocked hook); a reading emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `books`.

### Layer 11B — Learning — 2026-09-02

**Added**
- `src/features/learning/` — courses / study plans / book studies / certification tracks
  over `users/{uid}/learningItems`: `learningItemSchema` + create/update/form +
  `learningItemInputFromForm` (type, status, provider, target date, embedded ordered
  `lessons` checklist, `resources`, assessment notes, goal/pillar links, `skillId` reserved
  for Layer 11D); `emptyLesson` / `lessonProgress` (pure); separate `studySessionSchema`
  family (append-only time log, analogous to Deep Work sessions); `summarizeLearning` +
  `studyMinutesForItem` (pure — study time is derived, never duplicated onto the item);
  `learningItemRepository` + `listActiveLearningItems`, `studySessionRepository` +
  `listRecentStudySessions`; `useLearning` (`toggleLesson`, `logSession`,
  `removeSession`); UI (`LearningView` with item grid + a recent-sessions section,
  `LearningItemForm` with a `useFieldArray` lesson editor, `LearningItemDialog`,
  `LearningItemCard` with a live lesson checklist and linked resources, `LogSessionDialog`,
  `RecentSessionsList`).
- `/grow/learning` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `LearningView` (mocked hook); a learning emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `learningItems` + `studySessions`.

### Layer 11A — Journal — 2026-09-02 — opens the Grow domain

**Added**
- `src/features/journal/` — one entry shape over `users/{uid}/journalEntries` covering
  free-form / guided-reflection / daily-reflection / weekly-reflection / gratitude /
  lessons-learned / decision entries: `journalEntrySchema` + create/update/form +
  `journalEntryInputFromForm` (entry type drives a content placeholder + a gratitude-items
  field; mood/energy 1–5, goal/pillar links, tags, a display-only `isPrivate` flag);
  `filterJournalEntries` (pure client-side search + type filter); `summarizeJournal`
  (pure); `journalRepository` + `listRecentJournalEntries`; `useJournal`; UI (`JournalView`
  with a search box + type filter, `JournalEntryForm`, `JournalEntryDialog`,
  `JournalEntryCard` with a private-entry collapse/reveal toggle).
- `/grow/journal` renders the real feature (was a placeholder).
- Tests: schema, search, stats unit tests; `JournalView` (mocked hook); a journal emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `journalEntries`.

### Layer 10D — Execution Tracker — 2026-09-02 — closes the Act domain

**Added**
- `src/features/execution-tracker/` — a read-only aggregation view (no new collection,
  ADR-0016) comparing planned vs completed vs delayed vs cancelled work over `Today` /
  `This week`: `periodRange`, `classifyTasks` (on-time/later completion, cancelled,
  overdue/upcoming, estimated vs actual minutes, non-completion notes from
  `resolutionReason`), `summarizeHabitsForPeriod`, `summarizeRoutinesForPeriod`,
  `averageEnergyLevel` (all pure); `useExecutionTracker` (composes the existing
  `useTasks` / `useHabits` / `useRoutines` / `useDeepWork` hooks); `ExecutionTrackerView`
  (period selector + Tasks / Habits / Routines / Focus & energy sections). Copy is
  neutral and non-shaming per spec.
- `/act/execution` renders the real feature (was a placeholder).
- Tests: pure-function unit tests; `ExecutionTrackerView` (mocked hook). No new
  integration test — this layer introduces no collection (ADR-0016).

**Changed**
- `src/features/routines/use-routines.ts` now also returns the raw `logs` array.
- `docs/DATA_MODEL.md` retires the placeholder `executionLogs` line (see ADR-0016).

### Layer 10C — Daily Routine — 2026-09-02

**Added**
- `src/features/routines/` — ordered checklists over `users/{uid}/routines` +
  `users/{uid}/routineLogs`: `routineSchema` + create/update/form + `routineInputFromForm`
  (routine type, embedded ordered steps with a stable id / title / minutes / optional habit
  link, `isTemplate` flag); `routineLogSchema` family (one `completedStepIds[]` log per
  routine per day); `computeRoutineProgress` (pure); `summarizeRoutines` (pure);
  `routineRepository` + `listActiveRoutines`, `routineLogRepository` +
  `listRecentRoutineLogs`; `useRoutines` (`toggleStep` upserts today's log,
  `duplicateTemplate` clones a template with fresh step ids); UI (`RoutinesView` split
  into "Your routines" / "Templates" sections, `RoutineForm` with a `useFieldArray` step
  editor, `RoutineDialog`, `RoutineCard` with a progress bar and a live checklist).
- `src/features/habits/` — `listHabitOptions` / `HabitOption` + `useHabitOptions`, for the
  routine step editor's habit picker.
- `/act/routine` renders the real feature (was a placeholder).
- Tests: schema, progress, stats unit tests; `RoutinesView` (mocked hooks); a routines
  emulator integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `routines` + `routineLogs`.

### Layer 10B — Habits — 2026-09-02

**Added**
- `src/features/habits/` — a streak tracker over `users/{uid}/habits` +
  `users/{uid}/habitLogs`: `habitSchema` + create/update/form + `habitInputFromForm`
  (required pillars, goal link, daily/weekly/monthly schedule, target/unit, reminder time,
  active/paused status); `habitLogSchema` family (one completed/missed log per habit per
  day); `isExpectedOn` / `expectedDatesInRange` (pure schedule math); `computeHabitStreaks`
  / `recentDayStates` (pure — streaks are **computed from logs, never stored**, like the
  Deep Work session score in Layer 9B); `summarizeHabits` (pure); `habitRepository` +
  `listActiveHabits`, `habitLogRepository` + `listRecentHabitLogs`; `useHabits`
  (`setDayStatus` upserts the day's log); UI (`HabitsView` stats + grid, `HabitForm` with a
  frequency-conditional schedule editor, `HabitDialog`, `HabitCard` with a 7-day dot strip
  and Done-today/Missed quick-log buttons).
- `/act/habits` renders the real feature (was a placeholder).
- Tests: schedule, streak, stats, schema unit tests; `HabitsView` (mocked hooks); a habits
  emulator integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `habits` + `habitLogs`.

### Layer 10A — Tasks — 2026-09-02 — opens the Act domain

**Added**
- `src/features/tasks/` — the unit of daily execution over `users/{uid}/tasks`:
  `taskSchema` + create/update/form + `taskInputFromForm` (status, priority, start/due
  dates, pillars, goal/project/milestone/parent-task links, `{ frequency, interval }`
  recurrence marker, estimate/actual minutes, energy, context, tags, `completedAt`,
  resolution reason); `isClosed` / `daysOverdue` helpers; `summarizeTasks` +
  `subtaskProgressByParent` (pure); `taskRepository` + `listActiveTasks` (work-list sort)
  + `listTaskOptions`; `useTasks` (`setStatusFor` moves `completedAt` with status);
  UI (`TasksView` stats + sorted list, `TaskForm`, `TaskDialog`, `TaskCard` with a done
  checkbox, overdue badge, subtask count and link chips).
- `src/features/milestones/` — `listMilestoneOptions` / `MilestoneOption` +
  `useMilestoneOptions`, for the task form's milestone picker.
- `/act/tasks` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `TasksView` (mocked hooks); a tasks emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `tasks`.

### Layer 9E — Priority Matrix — 2026-09-02 — closes the Focus domain

**Added**
- `src/features/priority-matrix/` — an Eisenhower matrix over
  `users/{uid}/priorityMatrixItems`: `matrixItemSchema` + create/update/form +
  `matrixItemInputFromForm` (title, one of four quadrants [do / schedule / delegate /
  eliminate], goal/project link, 0–3 life pillars, completed flag); `summarizeMatrix`
  (pure — total / completed / open-per-quadrant); `priorityMatrixRepository` +
  `listActiveMatrixItems`; `usePriorityMatrix` (memoized `byQuadrant` + `stats`, `move`
  and `toggleComplete` helpers); UI (`PriorityMatrixView` — 2×2 quadrant grid with
  per-quadrant add, open/completed counts; `MatrixItemForm`, `MatrixItemDialog`,
  `MatrixItemCard` with a move-to-quadrant dropdown + completion checkbox).
- `/focus/priority-matrix` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `PriorityMatrixView` (mocked hooks); a priority-matrix
  emulator integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `priorityMatrixItems`.

### Layer 9D — Time Blocking — 2026-09-02

**Added**
- `src/features/time-blocking/` — allocate time to an activity over `users/{uid}/timeBlocks`:
  `timeBlockSchema` + create/update/form + `timeBlockInputFromForm` (title, category
  [deep-work / task / habit / goal / project / learning / spiritual / recovery / personal /
  admin / break / other], zoned `startDateTime` / `endDateTime`, goal/project link, 0–3 life
  pillars, status [planned / done / skipped], notes) reusing the Layer 9C `zoned-time` model;
  `detect-conflicts.ts` (`detectConflicts` — pure pairwise instant-overlap detection,
  timezone-correct, `skipped` excluded); `time-block-stats.ts` (`summarizeTimeBlocks` — pure);
  `timeBlockRepository` + `listActiveTimeBlocks`; `useTimeBlocking` (memoized conflicts +
  stats); UI (`TimeBlockView` with a day-grouped list + a conflict warning banner and
  per-card **Overlap** flags, `TimeBlockForm`, `TimeBlockDialog`, `TimeBlockCard`,
  `TimeBlockStats`).
- `/focus/time-blocking` renders the real feature (was a placeholder).
- Tests: schema, conflict-detection, stats unit tests; `TimeBlockView` (mocked hooks); a
  time-blocking emulator integration test (written; not executed in-session — the Firestore
  emulator does not start in this environment).

**Changed**
- `docs/DATA_MODEL.md` annotation for `timeBlocks`.
- `CLAUDE.md` §10.1 + §11.17 and `docs/DEPLOYMENT.md` §2a — mandatory end-of-session
  commit + push + deploy to `https://mastery-personal-mgmt-system.web.app/`.
- **Deploy pipeline wired (ADR-0015):** `next.config.ts` `output: "export"` +
  `images.unoptimized`; `/api/health` route `force-static`; `firebase.json` `hosting`
  block (`public: "out"`, `cleanUrls`); `.claude/` added to `.gitignore` / `.prettierignore`.
  ADR-0003 (App Hosting) marked superseded-for-now. **First live deploy** — static export
  → Firebase Hosting on the Spark plan.

### Layer 9C — Calendar — 2026-08-31

**Added**
- `src/features/calendar/` — an internal calendar over `users/{uid}/events`:
  `eventSchema` + create/update/form + `eventInputFromForm` (timed / all-day, recurrence,
  reminders, goal/project links, IANA `timeZone`); `zoned-time.ts` (`Intl`-based, DST-aware
  wall-clock ↔ instant helpers); `recurrence.ts` (`expandEvents` — daily/weekly/monthly/
  yearly with interval, weekdays, count/until; pure, bounded); `calendar-range.ts`
  (`monthMatrix`, `weekDates`, `periodLabel`, `occurrencesByDay`, `layoutDay` overlap
  columns); `calendarEventRepository` + `listActiveEvents`; `CalendarProvider` adapter
  interface + `internalCalendarProvider` + `getCalendarProvider` (seam for future
  Google/Outlook/CalDAV sync); `useCalendar`; UI (`CalendarView`, `MonthGrid`, `TimeGrid`,
  `EventForm`, `EventDialog`) with day / week / month views.
- `/focus/calendar` renders the real feature.
- Tests: zoned-time, recurrence, calendar-range, schema unit tests; `CalendarView` (mocked
  hook); calendar emulator integration test through the provider.

**Changed**
- `docs/DATA_MODEL.md` annotation for `events`.

### Layer 9B — Deep Work — 2026-08-31

**Added**
- `src/features/deep-work/` — a logbook of focused sessions: `deepWorkSessionSchema` +
  create/update/form + `deepWorkInputFromForm` (intended outcome, goal/project link,
  start/end time, distraction log, energy & focus-quality ratings, completion notes,
  status); `computeSessionScore` (pure, derived 0–100); `summarizeDeepWork` (pure stats);
  `deepWorkRepository` (collection `focusSessions`) + `listRecentDeepWork`; `useDeepWork`;
  UI (`DeepWorkView`, `DeepWorkForm`, `DeepWorkDialog`, `DeepWorkCard`, `DeepWorkStats`).
- `/focus/deep-work` renders the real feature.
- Tests: schema, score, stats unit tests, `DeepWorkView` (mocked hooks), and a deep-work
  emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `focusSessions`.

### Layer 9A — Pomodoro — 2026-08-31 — opens the Focus domain

**Added**
- `src/features/pomodoro/` — a persistent pomodoro timer: `pomodoro-store.ts` (external
  store for `useSyncExternalStore`, wall-clock countdown, `localStorage` mirror, cross-tab
  sync, `createPomodoroStore` factory); `pomodoroSessionSchema` + create/update +
  `pomodoroConfigSchema` + `pomodoroLiveStateSchema`; `pomodoroSessionRepository` +
  `listRecentSessions`; `summarizeSessions` (pure stats); `usePomodoro`,
  `usePomodoroHistory`; UI (`PomodoroView`, `PomodoroTimer` with a setup form,
  `PomodoroStats`, `PomodoroHistoryList`).
- `/focus/pomodoro` renders the real feature. Only a terminal session (completed / ended
  early) is written to Firestore — never a per-tick document.
- Tests: store state-machine unit tests, schema + stats unit tests, `PomodoroView`
  (mocked hooks), and a pomodoro emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `pomodoroSessions`.

### Layer 8H — Planning Cascade — 2026-08-31 — closes the Plan domain

**Added**
- `src/features/cascade/` — `buildCascade()` (pure, read-only) walks `plan.parentId`,
  `goal.parentPlanId`, `project.goalId`, `milestone.parentType/parentId`,
  `roadmap.linkedGoalId/linkedProjectId` into one tree with a "not yet linked" list and
  per-kind counts; `useCascade()` (loads all plan-domain `listActive*` in parallel) and the
  UI (`CascadeView`, recursive `CascadeNodeRow`).
- `/plan/cascade` route + **Planning Cascade** nav item.
- `PLAN_PARENT_HORIZON` map and `usePlanTierOptions()` in `src/features/plans/`.
- Tests: `buildCascade` unit tests, `CascadeView` (mocked hook), and a cascade emulator
  integration test.

**Changed**
- Plan form now has a **Parent {tier}** picker; `planFormSchema` gains `parentId` and
  `planInputFromForm` reads it (2-arg signature removed).
- `docs/DATA_MODEL.md` §4 linkage list.

### Layer 8G — Roadmaps — 2026-08-31

**Added**
- `src/features/roadmaps/` — `roadmapSchema` / `roadmapCreateSchema` /
  `roadmapUpdateSchema` / `roadmapFormSchema` + `roadmapInputFromForm` (roadmap kind,
  optional goal & project links, horizon, manual progress, an ordered list of embedded
  `phases` each with name / date range / status, pillars); `roadmapRepository`,
  `useRoadmaps()`, and the UI (`RoadmapsView`, `RoadmapForm` with a `useFieldArray` phases
  editor, `RoadmapDialog`, `RoadmapCard`).
- `/plan/roadmaps` renders the real feature.
- Tests: roadmap schemas + phase date ordering + `roadmapInputFromForm`, `RoadmapsView`
  (mocked hooks), and a roadmaps emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `roadmaps`.

### Layer 8F — Milestones — 2026-08-30

**Added**
- `src/features/milestones/` — `milestoneSchema` / `milestoneCreateSchema` /
  `milestoneUpdateSchema` / `milestoneFormSchema` + `milestoneInputFromForm` (polymorphic
  parent goal/project/none, due date, completion state, manual progress, free-text
  dependencies, evidence/notes, pillars); `milestoneRepository`, `useMilestones()`, and the
  UI (`MilestonesView`, `MilestoneForm`, `MilestoneDialog`, `MilestoneCard`).
- `listProjectOptions()` / `ProjectOption` + `useProjectOptions()` in
  `src/features/projects/` — active projects for the milestone's parent picker.
- `/plan/milestones` renders the real feature.
- Tests: milestone schemas + parent-consistency refine + `milestoneInputFromForm`,
  `MilestonesView` (mocked hooks), and a milestones emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `milestones`.

### Layer 8E — Projects — 2026-08-30

**Added**
- `src/features/projects/` — `projectSchema` / `projectCreateSchema` /
  `projectUpdateSchema` / `projectFormSchema` + `projectInputFromForm` (status, priority,
  owner, start/end dates, manual progress, free-text dependencies / risks lists, goal link,
  pillars); `projectRepository`, `useProjects()`, and the UI (`ProjectsView`, `ProjectForm`,
  `ProjectDialog`, `ProjectCard`).
- `listGoalOptions()` / `GoalOption` + `useGoalOptions()` in `src/features/goals/` — active
  goals for the project's goal picker.
- `/plan/projects` renders the real feature.
- Tests: project schemas + `projectInputFromForm`, `ProjectsView` (mocked hooks), and a
  projects emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `projects`.

### Layer 8D — Goals — 2026-08-29

**Added**
- `src/features/goals/` — `goalSchema` / `goalCreateSchema` / `goalUpdateSchema` /
  `goalFormSchema` + `goalInputFromForm` (priority, measurement type / current / target /
  unit, review frequency, parent-plan link, pillars); `goalRepository`, `useGoals()`, and
  the UI (`GoalsView`, `GoalForm`, `GoalDialog`, `GoalCard`).
- `listAllPlanOptions()` + `usePlanOptions()` in `src/features/plans/` — active plans
  across every tier for the goal's parent-plan picker.
- `/plan/goals` renders the real feature.
- Tests: goal schemas + `goalInputFromForm`, `GoalsView` (mocked hooks), and a goals
  emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `goals`.

### Layer 8C — Quarterly / Monthly / Weekly Planning — 2026-08-29

**Added**
- `/plan/quarterly`, `/plan/monthly`, `/plan/weekly` render the shared `PlansView` — full
  plan CRUD for the three shorter tiers.

**Changed**
- `PLAN_REPOSITORIES` is now a complete `Record<PlanHorizon, PlanRepository>` (adds
  `quarter` / `month` / `week`).
- `tests/integration/plans.test.ts` covers all five tiers; `PlansView` test adds a
  `horizon="week"` case.

### Layer 8B — Five-Year & One-Year Plans — 2026-08-29

**Added**
- `src/features/plans/` — one shared plan model (`planSchema` / `planCreateSchema` /
  `planUpdateSchema` / `planFormSchema` + `planInputFromForm`), a `PlanRepository` per
  tier collection (`PLAN_REPOSITORIES` wired for `five-year` / `one-year`), `usePlans(horizon)`,
  and the UI (`PlansView`, `PlanForm`, `PlanDialog`, `PlanCard`).
- `src/components/ui/progress.tsx` — hand-rolled `Progress` bar (no new dependency).
- `isoDateSchema` (`YYYY-MM-DD`) in `src/lib/validation`.
- `/plan/five-year` and `/plan/one-year` render the real feature.
- Tests: plan schemas + `planInputFromForm`, `PlansView` (mocked hook), `Progress`, and a
  plans emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotations; ADR-0014 (one plan shape across five tier collections;
  transform-free create schemas).

### Layer 8A — Life Vision — 2026-08-29

**Added**
- `src/features/vision/` — Life Vision as a typed, pillar-linked collection
  (`users/{uid}/lifeVisions`): `lifeVisionSchema` (10 categories + metadata),
  `lifeVisionRepository` via `createFirestoreRepository`, `useLifeVision()` hook, and the
  UI (`LifeVisionView`, `VisionItemForm`, `VisionItemDialog`, `VisionItemCard`).
- `src/components/shared/PillarSelect` + `PillarBadges` — reusable life-pillar picker and
  badges (for 8B–8G and Layer 12).
- `/plan/vision` now renders the real feature (was a placeholder).
- Tests: vision schema, `LifeVisionView` (mocked hook), `PillarSelect`, and a life-vision
  emulator integration test.

**Changed**
- `vitest.setup.ts` — jsdom polyfills (`ResizeObserver`, pointer capture, `scrollIntoView`)
  for Radix `Select` in component tests.
- `docs/DATA_MODEL.md`, `docs/SECURITY.md`; ADR-0013 (vision modeling + deferring
  per-collection rule validation to Layer 20).

### Layer 7 — Dashboard MVP — 2026-08-28

**Added**
- `src/features/dashboard/` — `loadDashboardAggregate()` (one batched user-scoped read;
  widgets never read Firestore themselves), `DashboardAggregate` type, greeting/date
  helpers, `useDashboard()` hook, and widgets: `GreetingWidget`, `StatTile`,
  `QuickNotesWidget`, `PlaceholderWidget`, `RecoveryShortcut`, `DashboardView`.
- **Quick Notes** — `users/{uid}/quickNotes` via `createFirestoreRepository`, with
  add / inline-edit / archive in the UI. First end-to-end use of the Layer 6 repository.
- `src/hooks/use-mounted.ts` — hydration-safe client-only flag.
- Tests: greeting/date helpers, quick-note schemas, `DashboardView` (mocked hook), and a
  dashboard aggregate emulator integration test.

**Changed**
- `src/app/(app)/dashboard/page.tsx` renders the real `<DashboardView />`.
- `docs/DATA_MODEL.md` adds `quickNotes`; ADR-0012 records the MVP scoping.

### Layer 6 — Core Data Model & Repository Layer — 2026-08-28

**Added**
- `src/lib/validation/domain.ts` — life-pillar / priority / record-status / measurement
  vocabularies (schemas + types).
- `src/lib/repository/` — `baseRecordSchema` + `defineRecordSchema`, pagination types
  (`ListOptions`, `Page`, `pageQuerySchema`, `clampLimit`), audit builders, and
  `createFirestoreRepository()` — a user-scoped Firestore repository factory with
  `list / get / create / update / archive / unarchive`, internal uid resolution,
  audit-field stamping, server-timestamp read-back, and cursor pagination.
- `src/types/index.ts` re-exports the shared domain + data-access types.
- Tests: domain primitives, base record, pagination, audit builders (unit) and a full
  repository lifecycle suite against the Auth + Firestore emulators.

**Changed**
- `firestore.rules` — generic audit-field enforcement on every `users/{uid}/{collection}/**`
  write (`createdBy`/`updatedBy` = caller on create; `createdBy`/`createdAt` immutable,
  `updatedBy` = caller on update); rules tests updated to match.
- `docs/DATA_MODEL.md`, `docs/SECURITY.md` (Layer 6 checkpoint), ADR-0011.
- `CLAUDE.md` §10 restored to commit-and-push per layer (`2b5b5ac`).

### Layer 5 — Application Shell & Navigation — 2026-08-28 (committed `257ce03`, pushed)

**Added**
- `src/config/navigation.ts` — the navigation tree that drives the sidebar, drawer, bottom
  nav, breadcrumbs, and command palette, plus `isNavItemActive` / `navLabelForHref`.
- Responsive shell (`src/components/layout/`): `AppShell` + `ShellProvider`/`useShell`,
  `Sidebar` (collapsible), `SidebarNav`, `Topbar`, `BottomNav`, `NavDrawer`,
  `CommandPalette` (cmdk), `SearchTrigger`, `BreadcrumbTrail` + `buildBreadcrumbs`,
  `ModulePlaceholder`, `SectionLanding`.
- `src/components/ui/sheet.tsx` — Radix-Dialog-based side sheet primitive.
- 37 placeholder module routes under `src/app/(app)/` (Plan / Focus / Act / Grow /
  Analytics section landings + items, Recovery Center, Notifications, Settings) plus
  `(app)/loading.tsx` and `(app)/error.tsx`.
- Tests: navigation config integrity, `buildBreadcrumbs`, `BottomNav`, `SidebarNav`.
- Dependency: `cmdk`.

**Changed**
- `src/app/(app)/layout.tsx` now renders `<AppShell>` in place of the Layer 4 stopgap header.

### Layer 4 — Authentication & User Isolation — 2026-08-28 (committed `cf8df1b`, pushed)

**Added**
- `src/features/auth/`: form + profile schemas, `authService` (email + Google + reset +
  persistence, normalized errors), `auth-errors` message mapping, `userProfileRepository`
  (`ensure` / `get` / `update`, `buildDefaultProfile` — `role` always `user`), and
  components `AuthCard`, `SignInForm`, `SignUpForm`, `ForgotPasswordForm`,
  `GoogleSignInButton`, `UserMenu`.
- `AuthProvider` + `useAuth` (`src/providers/auth-provider.tsx`); wired into `Providers`.
- Routes: `(auth)/{login,register,forgot-password}` with a redirect-if-signed-in layout;
  `(app)/dashboard` behind a client-side auth guard layout.
- Owner-only `firestore.rules` (field-validated `users/{uid}`, immutable `role`, no client
  delete, subcollection owner-only) and `storage.rules` (owner-only `users/{uid}/**`,
  image/PDF, < 10 MB).
- Tests: auth schema / error / profile unit tests, `SignInForm` component test, expanded
  Firestore + Storage rules tests, and an Auth+Firestore emulator integration suite
  (`npm run test:integration`, `vitest.integration.config.mts`).
- Dependencies: `react-hook-form`, `@hookform/resolvers`, `@testing-library/user-event`.

**Changed**
- `src/app/page.tsx` gains Sign in / Create account entry buttons.
- `vitest.setup.ts` registers Testing Library `cleanup()` (`globals: false`).
- ADR-0009 records the client-side route-protection choice.
- `CLAUDE.md` §10 (by the owner): no automatic commits/pushes — changes stay local until
  explicitly approved.

### Layer 3 — Firebase Foundation — 2026-08-28

**Added**
- Firebase project `mastery-personal-mgmt-system` (created via CLI, Web app registered —
  ADR-0008). Config in `.env.local`; keys documented in `.env.example`.
- `firebase.json` (Emulator Suite: auth/firestore/storage/functions/ui), `.firebaserc`,
  `firestore.rules` + `storage.rules` (deny-all baseline), `firestore.indexes.json`.
- `src/lib/firebase/`: `config`, `client` (browser SDK singleton + emulator connect),
  `admin` (`server-only` Admin SDK singleton), `timestamps` (`normalizeTimestamps`),
  `converters` (`makeConverter` — Zod-validated, timestamp-normalizing Firestore converter).
- `src/lib/errors/firebase-error.ts` — `mapFirebaseError` / `mapFunctionsError`.
- `functions/` package: `healthCheck` HTTP function, shared `errors` / `validation` /
  `auth` / `firebase-admin` helpers, region config, per-domain placeholder folders, tests.
- Security-rule test harness: `tests/rules/**`, `vitest.rules.config.mts`, and the
  `test:rules` / `emulators` / `functions:build` / `functions:test` npm scripts.
- Dependencies: `firebase`, `firebase-admin`, `server-only`, `@firebase/rules-unit-testing`,
  `firebase-tools`.

**Changed**
- `src/lib/env.ts` gains `NEXT_PUBLIC_FIREBASE_*` (optional) + `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`;
  empty-string env values are treated as unset.
- Root `tsconfig.json`, `eslint.config.mjs`, `.prettierignore` exclude `functions/`.
- ADR-0004 superseded by ADR-0008; `docs/DEPLOYMENT.md` environment↔project-id table filled in.

### Layer 2 — Mastery Design System — 2026-08-27

**Added**
- Design token layer in `globals.css` — semantic `--color-*` roles + `--font-*`, full
  light/dark palettes, Tailwind v4 `@theme inline` exposure, reduced-motion base reset.
- Theme system: `src/lib/theme.ts` (+ `themeStore`), pre-hydration no-flash `ThemeScript`,
  `ThemeProvider` / `useTheme` (`useSyncExternalStore`), and a `ThemeToggle`
  (light / dark / system, persisted to `localStorage`).
- Reusable component library under `src/components/ui/`: Button, IconButton, Spinner,
  Badge, Card, Skeleton, Separator, VisuallyHidden, Kbd, Avatar, Label, Input, Textarea,
  FormField, Checkbox, Switch, RadioGroup, Select, Tabs, Dialog, DropdownMenu, Tooltip,
  Alert, SegmentedControl.
- Layout helpers: `PageContainer`, `PageHeader`, `Breadcrumbs`.
- `/design-system` showcase route.
- Dependencies: `@radix-ui/react-*` primitives, `class-variance-authority`, `lucide-react`
  (ADR-0007).
- Tests for Button, FormField, Badge, and theme logic (suite now 9 files / 38 tests).

**Changed**
- `LoadingState` now renders the shared `Spinner`.
- Root layout injects the theme script and sets `suppressHydrationWarning`.

### Layer 1 — Project Foundation — 2026-08-27

**Added**
- Next.js 16 App Router application scaffold with TypeScript (strict), Tailwind CSS 4,
  ESLint 9 (flat config) + Prettier, and the `@/*` → `src/*` path alias.
- `src/lib/env.ts` — Zod-validated environment configuration (`parseEnv` + frozen `env`).
- `src/lib/errors/` — normalized `AppError`, `ErrorCode` union, `normalizeError`.
- `src/lib/validation/` — shared Zod primitives; `src/lib/utils/cn.ts`.
- Route-level `loading` / `error` / `global-error` / `not-found` and shared
  `LoadingState` / `EmptyState` / `ErrorState` components.
- `GET /api/health` liveness probe; passthrough `Providers` wrapper.
- Vitest 4 + Testing Library test setup; 23 tests across 5 files.
- `.env.example`, `AGENTS.md`, and the `src/` repository directory skeleton.
- npm scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `format`.

**Notes**
- Toolchain versions are significantly newer than earlier planning assumed (Next 16,
  Tailwind 4, ESLint 9 flat, Zod 4, Vitest 4). No Firebase yet — that is Layer 3.
- `next lint` and `next.config`'s `eslint` key were removed in Next 16; lint runs as
  `eslint .`.

### Layer 0 — Project Constitution — 2026-08-27

**Added**
- Engineering constitution (`CLAUDE.md`): repository, architecture, naming, security, and
  testing rules; layer-by-layer procedure; prohibited patterns; verification commands;
  single-branch git workflow; definition of done.
- Project documentation set under `docs/`: `MASTER_SPEC`, `PRODUCT_REQUIREMENTS`,
  `ARCHITECTURE`, `DESIGN_SYSTEM`, `DATA_MODEL`, `SECURITY`, `AI_ARCHITECTURE`,
  `RECOVERY_PRIVACY`, `TESTING_STRATEGY`, `DEPLOYMENT`, `BUILD_PROGRESS`, `DECISIONS`,
  `CHANGELOG`.
- `README.md` with project overview, stack, and documentation index.
- `.gitignore` for Node / Next.js / Firebase / secrets / test artifacts.
- Architecture decision records ADR-0001 … ADR-0006.

**Changed**
- Repository history reset to a fresh `main`; `origin` repointed to
  `Timmitchel1919-sys/Mastery-personal-management-system`.

**Notes**
- No application code, dependencies, or build tooling in this layer by design.
- Frontend hosting target set to Firebase App Hosting (ADR-0003); Firebase project not yet
  created (needed at Layer 3, ADR-0004).
