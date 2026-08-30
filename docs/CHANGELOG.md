# Changelog

All notable changes to Mastery are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project builds in numbered
layers; each entry maps to a layer.

## [Unreleased]

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
