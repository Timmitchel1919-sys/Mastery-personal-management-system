# Changelog

All notable changes to Mastery are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project builds in numbered
layers; each entry maps to a layer.

## [Unreleased]

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
