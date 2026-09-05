# Mastery — Testing Strategy

Every layer ships with the tests for the logic it introduces, and those tests stay green
for the rest of the build. The complete program is consolidated in **Layer 21**.

---

## 1. Test types

| Type | Scope | Tooling (finalized in Layer 1 / Layer 3) |
|---|---|---|
| Unit | pure functions, utils, reducers, formatters | Vitest |
| Schema | Zod schemas: valid/invalid/edge inputs | Vitest |
| Component | rendering, states, interaction, a11y roles | Vitest + Testing Library |
| Repository | user-scoping, pagination, audit fields, converters | Vitest + Firebase Emulator |
| Firestore rules | owner-only, role-immutability, cross-user denial | `@firebase/rules-unit-testing` + emulator |
| Storage rules | path scoping, type/size validation | rules-unit-testing + emulator |
| Cloud Function | auth checks, input/output validation, authorization scope | Vitest + Functions emulator |
| Integration | feature flows across service + repository + rules | emulator suite |
| End-to-end | critical user journeys in a real browser | Playwright |
| Accessibility | automated a11y assertions on key screens | axe + Testing Library / Playwright |
| Responsive | mobile / tablet / desktop layout behavior | Playwright viewports |

## 2. Commands

```
npm run typecheck
npm run lint
npm test                 # unit + schema + component + a11y (vitest / jsdom)
npm run test:coverage    # the above, with v8 coverage + CI thresholds
npm run test:rules       # Firestore + Storage rules (firebase emulators:exec)
npm run test:integration # feature flows across service + repository + rules (emulator suite)
npm run test:e2e         # Playwright — critical journeys, chromium + mobile-safari viewports
npm run functions:test   # Cloud Function handlers (functions/ vitest, fakes)
npm run build
```

CI runs all of them (see `DEPLOYMENT.md`). `test:e2e` first needs
`npm run test:e2e:install` (Playwright browsers) and the Firebase Emulator Suite
(`auth,firestore,storage`); `playwright.config.ts`'s `webServer` starts the dev server with
`NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`.

> **Layer 21 status.** The full program is wired. `npm test` runs 137 vitest files / 720
> tests (unit + schema + component + the Layer-21 a11y suite) with a v8 coverage gate
> (baseline ≈ 54% statements / 58% lines / 60% branches / 49% functions — thresholds set at
> that floor so coverage can only hold or rise). `functions:test` runs 16 files / 98.
> `test:rules` (3 files) and `test:integration` (34 files) are **written**; they have not
> been run in this environment since Layer 9 (the sandbox JDK can't bind the emulator's
> loopback selector) — they run in CI. `test:e2e` adds `tests/e2e/` (5 specs, 22 runs
> across two viewports); Playwright + browsers aren't installable in the sandbox, so these
> too are CI-only for now. `npm audit`: 6 moderate advisories, all in the dev-only
> `firebase-admin` dependency tree, never shipped (ADR-0029).

## 3. Per-layer gate (definition of done, testing portion)

A layer is done only when: typecheck passes, lint passes, all relevant tests pass, the
production build passes, rules are tested where relevant, mobile behavior is verified, and
accessibility is checked. No layer is declared complete with a failing check.

## 4. Critical journeys

Each becomes an e2e (or integration) test owned by the layer that introduces the feature
and must remain green thereafter.

| # | Journey | Introduced by | Covered by (Layer 21 audit) |
|---|---|---|---|
| 1 | Registration | Layer 4 | e2e `auth.spec.ts`; component `SignUpForm.test.tsx` |
| 2 | Login | Layer 4 | e2e `auth.spec.ts`; component `SignInForm.test.tsx` |
| 3 | Google authentication | Layer 4 | component `SignInForm.test.tsx` (mocked provider); manual (real popup) |
| 4 | Password recovery | Layer 4 | e2e `auth.spec.ts`; component `ForgotPasswordForm.test.tsx` |
| 5 | Profile creation | Layer 4 | integration `user-profile.test.ts` (`ensure` on first sign-in) |
| 6 | Protected route access | Layer 4 | e2e `auth.spec.ts` (redirect); `(app)/layout` guard |
| 7 | User isolation | Layer 4 | rules `firestore.rules.test.ts` (cross-user denial); integration per-domain |
| 8 | Goal creation | Layer 8D | e2e `goal.spec.ts`; component `GoalsView.test.tsx`; schema/repository tests |
| 9 | Goal-to-project linkage | Layer 8E | component `ProjectForm` / `GoalForm` link tests; cascade tests |
| 10 | Task creation and completion | Layer 10A | component `TasksView.test.tsx`; `task-schema` + execution-tracker tests |
| 11 | Habit logging | Layer 10B | component `HabitsView` / `LogHabitDialog` tests; `habit-streak.test.ts` |
| 12 | Calendar event creation | Layer 9C | component `CalendarView` / `EventForm` tests; `recurrence.test.ts` |
| 13 | Pomodoro persistence | Layer 9A | component `PomodoroView.test.tsx`; `pomodoro` reducer/schema tests |
| 14 | KPI entry | Layer 12 | component `KpisView` tests; `kpi-schema` + life-score tests |
| 15 | Dashboard aggregation | Layer 7 | e2e `goal.spec.ts` (loads clean); `dashboard-aggregate.test.ts` |
| 16 | Language persistence | Layer 18 | e2e `settings.spec.ts`; `i18n/locales.test.ts`; `SettingsView.test.tsx` |
| 17 | Theme persistence | Layer 18 | e2e `settings.spec.ts`; Layer 2 `theme` store tests |
| 18 | AI Coach authentication | Layer 13 | functions `handler.test.ts` (`requireAuth`); component `AiCoachView.test.tsx` |
| 19 | Weekly summary generation | Layer 14 | functions `generate-weekly-summary-for-user.test.ts` + `collect-week-data.test.ts` |
| 20 | Recovery privacy gate | Layer 15A | e2e `recovery-gate.spec.ts`; `RecoveryGate.test.tsx` + `pin-crypto.test.ts` |
| 21 | Recovery record isolation | Layer 15B | rules `recovery.rules.test.ts`; integration `recovery-*.test.ts` |
| 22 | Accountability permission enforcement | Layer 15F | functions `get-accountability-projection.test.ts` (email/expiry/revoke); rules block |
| 23 | Report generation | Layer 16 | component `ReportsView` / `ReportDocument` tests; `report-data.test.ts` |
| 24 | PWA installation path | Layer 19 | e2e `pwa.spec.ts`; `tests/unit/manifest.test.ts`; `components/pwa/*` tests |

Every journey has at least one automated owner. The ones with an `e2e` entry get a
browser-level check in `tests/e2e/`; the rest are covered at the component / schema / rules
/ function / integration level, which is sufficient for a static-export SPA where the
"journey" is a sequence of client interactions against emulated Firebase.

## 4a. End-to-end (`tests/e2e/`, Playwright)

- `auth.spec.ts` — journeys 1, 2, 4, 6.
- `settings.spec.ts` — journeys 16, 17 (persist a choice, reload, assert `<html lang>` /
  `data-theme`).
- `goal.spec.ts` — journeys 8, 15 (create a goal, it survives a reload; the dashboard
  loads error-free for a fresh account).
- `recovery-gate.spec.ts` — journey 20 (the module is unreachable until the PIN is set,
  re-gates on Lock).
- `pwa.spec.ts` — journey 24 (manifest + icons served, `sw.js` valid, `/offline` renders).

Each spec runs on **chromium-desktop** and **mobile-safari (iPhone 13)** — that pair also
satisfies the *responsive* test type (mobile / desktop layout behaviour).

## 4b. Accessibility (`src/test/a11y.test.tsx`)

`src/test/a11y.ts` exports `expectNoAxeViolations(container)` — axe-core over a rendered
subtree, with `color-contrast` and `region` disabled (jsdom has no layout). Applied to
representative surfaces: the shared `EmptyState` / `ErrorState` / `LoadingState`, the
`OfflineBanner`, the `SidebarNav`, and a rendered `ReportDocument`. New view work adds an
entry here or an inline `expectNoAxeViolations` in its component test.

## 4c. Coverage

`npm run test:coverage` runs the vitest suite with the v8 provider. Thresholds in
`vitest.config.mts` are set at the current baseline (≈ 54% statements / 57% lines / 60%
branches / 49% functions over `src/features`, `src/lib`, `src/components`, `src/i18n`,
`src/config`, excluding repositories / clients / Firebase infra / `src/app` — those are
exercised by the emulator and e2e suites). CI fails on a regression; raising the floor is a
follow-up as thin areas get covered.

## 5. Conventions

- Test files colocated as `*.test.ts(x)`; rules tests in `tests/rules/`; e2e in `tests/e2e/`.
- Deterministic tests: fixed clock, seeded ids, emulator reset between suites.
- No network calls to real Firebase or real AI providers in tests — emulator + provider
  fakes only.
- Development fixtures are used only in a controlled development environment, never in
  test/staging/production data paths.
