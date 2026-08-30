# Mastery — Build Progress

Living build tracker. Updated at the end of every layer.

---

## Snapshot

| Field | Value |
|---|---|
| **Current layer** | Layer 8F — Milestones (complete, committed + pushed) |
| **Next approved layer** | Layer 8G — Roadmaps |
| **Completed layers** | Layers 0–7 · Layer 8A · 8B · 8C · 8D · 8E · 8F (committed + pushed) |
| **In-progress work** | none |
| **Test status** | ✅ app: `vitest run` — 39 files, 188 tests. ✅ rules: `npm run test:rules` — 2 files, 22 tests. ✅ integration: `npm run test:integration` — 8 files, 26 tests (auth-flow 5 + repository 7 + dashboard 2 + life-vision 2 + plans 4 + goals 2 + projects 2 + milestones 2). ✅ functions: 1 file, 5 tests. |
| **Build status** | ✅ app: `typecheck`, `lint` (0/0), `test`, `build` (45 routes, no warnings), `format:check`. ✅ functions: `typecheck`, `lint`, `build`, `test`. |
| **Git status** | `CLAUDE.md` §10 restored to commit-and-push per layer (`2b5b5ac`). |
| **Deployment status** | Not deployed. Firebase project **`mastery-personal-mgmt-system`** with a registered Web app; config in `.env.local`. Emulator Suite wired. Frontend target: Firebase App Hosting. |
| **Repository** | `origin` → github.com/Timmitchel1919-sys/Mastery-personal-management-system.git · single `main` branch |
| **Stack (installed)** | Next 16.3.3 · React 19.2.8 · TypeScript 5.9 (strict) · Tailwind CSS 4.1 · ESLint 9.39 · Zod 4.1 · Vitest 4.1 + Testing Library + user-event · Prettier 3.9 · Radix UI · class-variance-authority · lucide-react · cmdk 1.1 · react-hook-form 7.86 · @hookform/resolvers 5.9 · firebase 12.18 · firebase-admin 14.3 · firebase-functions 7.3 · firebase-tools 15.28 · @firebase/rules-unit-testing 5 · (no new deps in Layer 6) |

---

## Layer log

### Layer 0 — Project Constitution — ✅ complete (2026-08-27)

Governance and documentation only. No application code.

**Created:**
- `CLAUDE.md` — engineering constitution: repository/architecture rules, naming
  conventions, security & testing requirements, layer procedure, prohibited patterns,
  verification commands, git workflow, definition of done.
- `README.md` — project overview, stack, doc index, getting-started placeholder.
- `.gitignore` — Node / Next.js / Firebase / secrets / test artifacts.
- `docs/MASTER_SPEC.md` — consolidated product + build specification, build order table.
- `docs/PRODUCT_REQUIREMENTS.md` — feature-level requirements per domain.
- `docs/ARCHITECTURE.md` — layered model, directory structure, validation boundaries,
  repository pattern, state/data-fetching rules, provider abstraction, performance guardrails.
- `docs/DESIGN_SYSTEM.md` — Mastery design language: principles, tokens, scales, layout
  system, component inventory, accessibility checklist, theming rules.
- `docs/DATA_MODEL.md` — Firestore collection map, common record fields, converters,
  linkage/traceability, indexing approach, index log.
- `docs/SECURITY.md` — identity/roles, Firestore & Storage rules, Cloud Functions, App
  Check, transport/browser security, environment separation, secret management, rules
  testing, per-layer security checkpoints.
- `docs/AI_ARCHITECTURE.md` — server-side AI, endpoints, context retrieval boundaries,
  request/response contract, infrastructure requirements, weekly summary, general↔recovery
  isolation.
- `docs/RECOVERY_PRIVACY.md` — Recovery Center privacy architecture, data model, access
  control, features, Recovery Coach, accountability partner, offline scrutiny, documented
  access-path table.
- `docs/TESTING_STRATEGY.md` — test types, commands, per-layer gate, 24 critical journeys
  mapped to layers, conventions.
- `docs/DEPLOYMENT.md` — environments, Firebase hosting model, CI/CD pipeline,
  configuration, runbook, pre-launch checklist.
- `docs/DECISIONS.md` — ADR-0001…0006 (fresh restart, single-branch, Firebase App Hosting,
  project-id slug, launch languages, 24-layer plan).
- `docs/CHANGELOG.md` — initialized (Keep a Changelog).

**Modified / moved / deleted:** none (fresh repository).

**Verification:** not applicable at this layer — no build/test tooling yet. Docs
cross-checked for internal consistency (collection names, layer numbers, endpoint names,
critical-journey mapping).

**Manual test instructions:**
1. `git log --oneline` shows the Layer 0 commit on `main`.
2. `CLAUDE.md` and all 14 `docs/*.md` files are present and readable.
3. Doc cross-links resolve (README doc index → each doc).
4. `git remote -v` points at the Mastery-personal-management-system repo.

**Known limitations:**
- Design-system token values are structural placeholders; exact values are set in Layer 2.
- `DATA_MODEL.md` index log is empty until domains add composite queries.
- Firebase project ids in `DEPLOYMENT.md` are TBD pending owner creation (ADR-0004).
- No executable verification exists until Layer 1.

---

### Layer 1 — Project Foundation — ✅ complete (2026-08-27)

Next.js + TypeScript + Tailwind + lint + validation + env handling + error/loading
primitives + repository structure. No Firebase (Layer 3).

**Toolchain resolved (versions well ahead of prior notes):** Next 16.3.3 (App Router,
Turbopack, `src/`), React 19.2.8, TypeScript 5.9 (strict + `noUncheckedIndexedAccess`,
`noImplicitOverride`, `noFallthroughCasesInSwitch`), Tailwind CSS 4.1 (CSS-first, no
`tailwind.config`), ESLint 9.39 flat config via `eslint-config-next`, Zod 4.1, Vitest 4.1
(jsdom) + Testing Library, Prettier 3.9. `next lint` / the `eslint` key in `next.config`
were removed in Next 16 — linting runs via `eslint .` directly.

**Created — config:**
- `package.json` — scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `typecheck`,
  `test`, `test:watch`, `format`, `format:check`.
- `tsconfig.json` — strict, path alias `@/*` → `src/*`, extra safety flags.
- `next.config.ts` — `reactStrictMode`, `poweredByHeader: false`, `typescript.ignoreBuildErrors: false`.
- `eslint.config.mjs` — next core-web-vitals + typescript + prettier; `no-console`
  (warn/error allowed), `no-explicit-any` error, `consistent-type-imports`.
- `postcss.config.mjs` — `@tailwindcss/postcss`.
- `.prettierrc.json`, `.prettierignore` (docs/ and `*.md` excluded).
- `vitest.config.mts` (jsdom, `@/*` alias) + `vitest.setup.ts` (`@testing-library/jest-dom`).
- `.env.example` — `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_APP_URL`; Firebase/AI vars noted for later.
- `next-env.d.ts`, `AGENTS.md`.

**Created — source:**
- `src/app/` — `layout.tsx` (metadata, viewport, `Providers`), `page.tsx` (placeholder,
  replaced in Layer 5), `globals.css` (placeholder token layer + reduced-motion + focus
  ring), `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`,
  `api/health/route.ts` (liveness probe using validated `env`).
- `src/providers/index.tsx` — passthrough `Providers` (Theme/I18n/Auth slot in later).
- `src/components/shared/` — `LoadingState`, `EmptyState`, `ErrorState` + barrel; a11y
  roles (`status` / `alert`), token-driven styling.
- `src/lib/env.ts` — Zod-validated environment (`parseEnv` + frozen `env` singleton).
- `src/lib/errors/` — `AppError` class, `ErrorCode` union, `isAppError`, `normalizeError`.
- `src/lib/validation/index.ts` — shared Zod primitives (`nonEmptyString`, `idSchema`,
  `isoDateTimeSchema`, `paginationQuerySchema`).
- `src/lib/utils/` — `cn()` (clsx + tailwind-merge).
- `src/types/index.ts`, `src/features/README.md`, `tests/README.md`.
- Structure dirs with `.gitkeep`: `components/ui`, `components/layout`, `hooks`,
  `lib/security`, `lib/analytics`, `repositories`, `services`, `styles`, `public`.

**Tests (5 files, 23 cases):** `env.test.ts`, `errors/app-error.test.ts`,
`validation/index.test.ts`, `utils/cn.test.ts`, `components/shared/EmptyState.test.tsx`.

**Verification:** `npm run typecheck` ✅ · `npm run lint` ✅ · `npm test` ✅ (23/23) ·
`npm run build` ✅ · `npm run format:check` ✅.

**Manual test instructions:**
1. `npm install` (already run — `package-lock.json` committed).
2. `npm run dev` → open `http://localhost:3000` → placeholder page renders in light/dark
   per OS setting; no theme flash.
3. Open `http://localhost:3000/api/health` → `{ "status": "ok", "environment": "development", "timestamp": ... }`.
4. Visit `http://localhost:3000/does-not-exist` → styled "Page not found" (EmptyState).
5. `npm run typecheck && npm run lint && npm test && npm run build` → all green.
6. Temporarily set `NEXT_PUBLIC_APP_ENV=bogus` in `.env.local` and hit `/api/health` →
   server throws "Invalid environment configuration" (env validation works). Revert after.

**Known limitations:**
- `globals.css` tokens are placeholders; the real Mastery scale/roles land in Layer 2.
- Only `LoadingState` / `EmptyState` / `ErrorState` exist as components; the full UI
  primitive set is Layer 2.
- No component-level test for `ErrorState`/`LoadingState` yet (trivial; covered when the
  design system formalizes component tests in Layer 2).
- `test:rules` (emulator) and `test:e2e` (Playwright) scripts do not exist yet — added in
  Layer 4 and a later layer respectively.
- `unrs-resolver` postinstall was blocked by the sandbox; ESLint import resolution still
  works. No action needed unless resolver errors appear later.

---

### Layer 2 — Mastery Design System — ✅ complete (2026-08-27)

Token layer, theme system (dark/light/system, no-flash), and the reusable component
inventory. Added Radix UI + `class-variance-authority` + `lucide-react` (ADR-0007).

**Created — tokens & theme:**
- `src/app/globals.css` — full semantic token set (see `docs/DESIGN_SYSTEM.md` §7), light +
  dark via the 3-block pattern, `@theme inline` exposure, base layer (border default,
  focus ring, reduced-motion reset), overlay keyframes.
- `src/lib/theme.ts` — `Theme` type, `resolveTheme` / `applyTheme` / `getSystemTheme` /
  storage helpers, and `themeStore` (subscribe / getSnapshot / setTheme) for
  `useSyncExternalStore`.
- `src/components/theme-script.tsx` — pre-hydration no-flash script, rendered in `<head>`.
- `src/providers/theme-provider.tsx` — `ThemeProvider` + `useTheme` (via `useSyncExternalStore`).
- `src/providers/index.tsx` — now wraps `ThemeProvider` → `TooltipProvider` → children.
- `src/app/layout.tsx` — `<head><ThemeScript /></head>` + `suppressHydrationWarning`.

**Created — components (`src/components/ui/`):** button, icon-button, spinner, badge, card,
skeleton, separator, visually-hidden, kbd, avatar, label, input, textarea, field
(`FormField`), checkbox, switch, radio-group, select, tabs, dialog, dropdown-menu, tooltip,
alert, segmented-control, theme-toggle, plus `index.ts` barrel.

**Created — layout (`src/components/layout/`):** page-container, page-header, breadcrumbs,
`index.ts`.

**Created — route:** `src/app/design-system/page.tsx` — visual showcase of tokens + every
component.

**Modified:** `src/components/shared/LoadingState.tsx` now uses the shared `Spinner`.
Removed `.gitkeep` from `src/components/ui` and `src/components/layout`.

**Tests added (4 files):** `src/lib/theme.test.ts`, `src/components/ui/button.test.tsx`,
`src/components/ui/field.test.tsx`, `src/components/ui/badge.test.tsx`. Total suite: 9
files / 38 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ · `test` ✅ (38/38) · `build` ✅ (adds
`/design-system`) · `format:check` ✅.

**Manual test instructions:**
1. `npm run dev` → open `http://localhost:3000/design-system`.
2. Use the theme toggle (top-right): Light / Dark / System. The page recolors with no
   flash; reload — the choice persists. Set OS to dark with "System" selected → follows OS.
3. Open the Dialog: focus is trapped, `Esc` closes, focus returns to the trigger.
4. Open the Dropdown menu: arrow keys move, `Enter` selects, `Esc` closes; "Sign out" is
   styled as destructive.
5. Tab through the form controls: every control has a visible focus ring; the Email field
   shows an inline error and the input gets `aria-invalid` when the value has no `@`.
6. Hover/focus "Hover me" → tooltip appears after a short delay.
7. `npm run typecheck && npm run lint && npm test && npm run build` → all green.

**Known limitations:**
- Token hex values are a first pass (indigo primary / teal accent / zinc neutrals); they
  can be tuned without structural change.
- Deferred primitives (Accordion, Popover, Toast, Combobox, Slider, DatePicker,
  Table/DataTable, Pagination, CommandPalette) are not built yet — added by their
  consuming layers. The app shell (Sidebar/Topbar/BottomNav) is Layer 5.
- Component tests cover Button / FormField / Badge / theme logic; overlay primitives
  (Dialog/DropdownMenu/Tooltip) are verified via the manual steps above and the build,
  not yet by automated interaction tests.
- `accentColorPreference` token role exists but no per-user accent switching UI yet
  (design-system decision + Layer 18).

---

### Layer 3 — Firebase Foundation — ✅ complete (2026-08-28)

Safe Firebase init (client + admin), Emulator Suite wiring, Zod-validated converters +
canonical timestamp normalization, `functions/` package skeleton, and Firebase error
normalization. Firestore/Storage rules are a **deny-all baseline** — owner-scoped rules
land in Layer 4.

**Firebase project:** created `mastery-personal-mgmt-system` via the CLI + registered a Web
app (ADR-0008). Real web config written to `.env.local` (git-ignored).

**Created — root config:**
- `.firebaserc`, `firebase.json` (emulators: auth 9099 / firestore 8080 / storage 9199 /
  functions 5001 / ui 4000; `singleProjectMode`), `firestore.rules` + `storage.rules`
  (deny-all baseline), `firestore.indexes.json` (empty).

**Created — app (`src/lib/firebase/`):**
- `config.ts` — `getFirebaseClientConfig()` (strict when live, placeholder-tolerant under
  emulators), `useFirebaseEmulators`, `EMULATOR_CONFIG`.
- `client.ts` — lazy browser SDK singleton (`getFirebaseClient()`), one-time emulator
  connect guarded across HMR.
- `admin.ts` — lazy Admin SDK singleton (`getFirebaseAdmin()`), `server-only`; emulator →
  `FIREBASE_SERVICE_ACCOUNT` JSON → Application Default Credentials.
- `timestamps.ts` — `normalizeTimestamps()` (duck-typed, SDK-agnostic, recursive → ISO).
- `converters.ts` — `makeConverter(schema)` (validate + normalize on read, drop `id` +
  stamp `updatedAt` on write; throws a normalized `AppError` on a bad document).
- `index.ts` — barrel for the client/server-safe helpers only.

**Created — errors:** `src/lib/errors/firebase-error.ts` — `mapFirebaseError` /
`mapFunctionsError` (gRPC status + `auth/*` + `storage/*` codes → `AppError` codes),
re-exported from `src/lib/errors/index.ts`.

**Created — env:** `src/lib/env.ts` extended with `NEXT_PUBLIC_FIREBASE_*` (optional) and
`NEXT_PUBLIC_USE_FIREBASE_EMULATORS`; empty-string env values now coerced to "unset".
`.env.example` gains a Firebase + server-secrets section.

**Created — functions/ package:**
- `package.json` (node 20, firebase-functions 7 / firebase-admin 14 / zod), `tsconfig.json`
  (`module`/`moduleResolution` = `node16` for subpath exports), `eslint.config.mjs`
  (typescript-eslint), `vitest.config.mts`, `.gitignore`.
- `src/index.ts` — `healthCheck` HTTP function (`europe-west1`).
- `src/config/region.ts`, `src/shared/{firebase-admin,errors,validation,auth}.ts`.
- `src/{ai,reports,notifications,recovery,scheduled}/README.md` — placeholders for their
  layers.
- `tests/shared.test.ts`.

**Created — rules tests:** `vitest.rules.config.mts`, `tests/rules/firestore.rules.test.ts`
+ `tests/rules/storage.rules.test.ts` (deny-all assertions via `@firebase/rules-unit-testing`).
Root scripts: `test:rules` (wraps `firebase emulators:exec`), `emulators`, `functions:build`,
`functions:test`.

**Modified:** root `tsconfig.json` + `eslint.config.mjs` + `.prettierignore` exclude
`functions/`; `package.json` deps (+ `firebase`, `firebase-admin`, `server-only`,
`@firebase/rules-unit-testing`, `firebase-tools`).

**Verification:**
- app: `typecheck` ✅ · `lint` ✅ · `test` ✅ (12 files / 53) · `build` ✅ · `format:check` ✅
- rules: `npm run test:rules` ✅ (Firestore + Storage emulators, 6 assertions)
- functions: `npm --prefix functions run typecheck|lint|build|test` ✅ (5 tests)

**Manual test instructions:**
1. `npm run dev` → `http://localhost:3000/api/health` still returns `{status:"ok",...}`.
2. `npm run emulators` starts auth/firestore/storage/functions + UI on
   `http://127.0.0.1:4000`. `curl http://127.0.0.1:5001/mastery-personal-mgmt-system/europe-west1/healthCheck`
   (or the URL the emulator prints) returns the functions health JSON.
3. Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` in `.env.local`, restart `npm run dev`;
   the client SDK now targets the emulators (no network to prod).
4. `npm run test:rules` boots the emulators and asserts the deny-all baseline.
5. `npm --prefix functions run build` produces `functions/lib/index.js`.

**Known limitations:**
- Firestore/Storage rules are **deny-all** — no app can read/write yet. Owner-scoped rules
  + isolation tests are Layer 4's deliverable.
- No `firebase-admin` Timestamp path exercised by tests yet (the converter test uses the
  client shape; `normalizeTimestamps` is duck-typed to cover both).
- Single cloud project for now; staging/prod split + App Hosting config + App Check
  enforcement are Layer 20 / Layer 22.
- `functions/` is a separate npm workspace-style package with its own `node_modules`; CI
  (Layer 22) must install and verify it separately from the app.
- `re2` / `@firebase/util` / `protobufjs` postinstall scripts were sandbox-blocked during
  install; emulators + tests run fine regardless.

---

### Layer 4 — Authentication & User Isolation — ✅ complete (2026-08-28) — committed `cf8df1b`, pushed

Email/password + Google auth, forgot-password, session persistence, protected routes,
per-user `users/{uid}` profile creation, and owner-only Firestore/Storage rules replacing
the Layer 3 deny-all baseline. `CLAUDE.md` §10 was changed by the owner this session to
require manual commit approval, so this layer is **local only**.

**Created — `src/features/auth/`:**
- `schema.ts` — `signInSchema` / `signUpSchema` (matching-password refine) /
  `forgotPasswordSchema`; `userProfileSchema` + `userProfileUpdateSchema` (role enum,
  language/theme `.catch` fallbacks, audit fields).
- `auth-errors.ts` — `toAuthError` / `authErrorMessage`: friendly, non-leaky messages by
  `auth/*` code, built on `mapFirebaseError`.
- `auth-service.ts` — `authService`: sign-up/in (email), Google popup, sign-out, password
  reset, `onAuthStateChanged`, `browserLocalPersistence` (graceful fallback). Every method
  rejects with a normalized `AppError`.
- `user-profile-repository.ts` — `buildDefaultProfile` (role always `user`, timezone from
  `Intl`, `en` / `system` defaults) + `userProfileRepository` (`get` / `ensure` / `update`,
  uid from the auth user, `serverTimestamp` + `version` increment, `userProfileConverter`
  for reads).
- `components/` — `AuthCard`, `SignInForm`, `SignUpForm`, `ForgotPasswordForm`
  (React Hook Form + `zodResolver`, form-level `Alert`, redirect on success),
  `GoogleSignInButton`, `UserMenu` (avatar + display name/email + sign out).
- `index.ts` barrel.

**Created — providers / routes:**
- `src/providers/auth-provider.tsx` — `AuthProvider` + `useAuth`
  (`status: loading | authenticated | unauthenticated`, `user`, `profile`, action methods,
  `refreshProfile`); ensures the profile doc on first sign-in.
- `src/providers/index.tsx` — now `ThemeProvider → AuthProvider → TooltipProvider`.
- `src/app/(auth)/{layout,login/page,register/page,forgot-password/page}.tsx` — auth-only
  layout (redirects signed-in users to `/dashboard`); login page wraps `SignInForm` in
  `<Suspense>` (it reads `?next`).
- `src/app/(app)/{layout,dashboard/page}.tsx` — client-side protected shell (loading state
  + redirect to `/login?next=…` when signed out; minimal header with `ThemeToggle` +
  `UserMenu` — replaced by the real shell in Layer 5) and a placeholder dashboard.

**Modified:**
- `firestore.rules` — owner-only `users/{uid}` (field-validated create/update, `role`
  immutable, `id`/`createdAt`/`createdBy` immutable, no client delete, not listable) +
  `users/{uid}/{collection}/{document=**}` owner-only subcollections (explicit `{collection}`
  segment so the permissive subcollection rule cannot shadow the profile rules — this was a
  bug caught by the rules tests during the layer).
- `storage.rules` — owner-only `users/{uid}/**`, images + PDF only, < 10 MB; deny elsewhere.
- `src/app/page.tsx` — adds Sign in / Create account buttons.
- `vitest.setup.ts` — registers Testing Library `cleanup()` in `afterEach` (needed because
  `globals: false`; a missing cleanup surfaced as duplicate-label failures).
- `package.json` — deps `react-hook-form`, `@hookform/resolvers`, dev `@testing-library/user-event`;
  scripts `test:integration`.

**Created — tests:**
- unit/component (`npm test`): `schema.test.ts`, `auth-errors.test.ts`,
  `user-profile-repository.test.ts`, `components/SignInForm.test.tsx` (render, validation,
  submit+redirect, error surface — `useAuth` + `next/navigation` mocked).
- rules (`npm run test:rules`): `tests/rules/firestore.rules.test.ts` (14 cases: create with
  role `user`, reject elevated role / foreign uid, own read ok, cross-user read denied, no
  list, role/createdBy immutable, no delete, subcollection owner ok / cross-user denied);
  `tests/rules/storage.rules.test.ts` (5 cases).
- integration (`npm run test:integration`): `tests/integration/auth-flow.test.ts` +
  `vitest.integration.config.mts` — real `authService` / repository against the Auth +
  Firestore emulators (journeys: registration → profile, sign-in/out round-trip, wrong
  password → `AppError`, cross-user read → `permission-denied`, password reset).

**Verification (all green):** `typecheck` ✅ · `lint` ✅ · `test` ✅ (16/72) · `build` ✅
(8 routes) · `test:rules` ✅ (2/18) · `test:integration` ✅ (1/5) · `format:check` ✅ ·
functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, open `http://localhost:3000` → **Create an account** → register with
   name / email / password. You land on `/dashboard` greeting your name.
2. Firebase console → Authentication shows the new user; Firestore shows `users/{uid}` with
   `role: "user"`, `onboardingCompleted: false`, audit fields.
3. Use the account menu (top-right) → **Sign out** → you are sent to `/login`.
4. Sign back in. Visit `/login` while signed in → you are redirected to `/dashboard`.
5. Open `/dashboard` in a fresh private window (signed out) → redirected to
   `/login?next=%2Fdashboard`; after signing in you return to `/dashboard`.
6. `/forgot-password` → submit your email → success message (reset link prints in the
   Auth emulator console, or is emailed in a real project).
7. **Google:** click *Continue with Google* (works against a real Firebase project; the
   emulator shows a provider-picker screen).
8. `npm run typecheck && npm run lint && npm test && npm run build && npm run test:rules && npm run test:integration` → all pass.

**Known limitations:**
- Route protection is **client-side only** (ADR-0009) — a brief loading state on protected
  routes during hydration; no SSR session/middleware yet.
- The `(app)` header is a stopgap; the responsive sidebar / topbar / bottom-nav shell is
  Layer 5. `/dashboard` is a placeholder (real aggregation = Layer 7).
- Email verification is not enforced yet; account deletion / re-auth flows are deferred.
- Recovery subcollections currently fall under the generic owner-only subcollection rule;
  server-mediated writes + the privacy gate are Layer 15 / Layer 20.
- Profile `theme` / `language` are stored but not yet driving `ThemeProvider` / i18n
  (wired in Layer 18); `ThemeToggle` still uses `localStorage`.
- No Playwright e2e yet — the critical journeys are covered by the emulator integration
  test for now (TESTING_STRATEGY allows "e2e or integration").

---

### Layer 5 — Application Shell & Navigation — ✅ built + verified locally (2026-08-28) — **not committed, awaiting owner review**

The responsive protected shell (fixed sidebar / sticky topbar / mobile drawer + bottom
nav / command palette / breadcrumbs) plus a placeholder route for every module in the
navigation spec. No business logic — routing, layout, and active states are real; module
content lands in its planned layer.

**Created — navigation config:**
- `src/config/navigation.ts` — single source of truth: `NAV_SECTIONS` (Plan / Focus / Act
  / Grow / Analytics / Private), `SYSTEM_ITEMS`, `DASHBOARD_ITEM`, `BOTTOM_NAV_ITEMS`
  (Dashboard + the four loop sections), `ALL_NAV_ITEMS` (flattened + href-deduped),
  `navLabelForHref`, `isNavItemActive`. Labels are English (Layer 18 → i18n keys).

**Created — shell (`src/components/layout/`):**
- `shell-context.tsx` — `ShellProvider` / `useShell`: sidebar-collapsed (session), drawer
  open, command-palette open, and the global ⌘/Ctrl-K listener.
- `app-shell.tsx` — `AppShell`: skip-to-content link, sidebar + topbar + `<main>`, bottom
  nav, drawer, command palette.
- `sidebar.tsx` (desktop ≥ lg, collapsible to an icon rail with tooltips) + `sidebar-nav.tsx`
  (shared nav list, active state via `usePathname`, PRIVATE section visually separated).
- `topbar.tsx` — mobile nav toggle, breadcrumbs (desktop), `search-trigger.tsx`
  (opens palette, shows ⌘K), notifications link, `ThemeToggle`, `UserMenu`.
- `bottom-nav.tsx` — fixed mobile bottom nav (5 items, `env(safe-area-inset-bottom)`).
- `nav-drawer.tsx` — slide-in `Sheet` with the full nav for < lg.
- `command-palette.tsx` — `cmdk`-based palette: jump to any destination + actions
  (light / dark / system theme, sign out).
- `breadcrumb-trail.tsx` — `BreadcrumbTrail` (client, from `usePathname`) + pure
  `buildBreadcrumbs`; `module-placeholder.tsx`, `section-landing.tsx`.
- `src/components/ui/sheet.tsx` — new Radix-Dialog-based side `Sheet` primitive (left/right).

**Created — routes (`src/app/(app)/`):** 37 new pages —
`plan/*` (10 + landing), `focus/*` (6 + landing), `act/*` (4 + landing),
`grow/*` (5 + landing), `analytics/*` (4 + landing), `recovery`, `notifications`,
`settings`. Plus `(app)/loading.tsx` and `(app)/error.tsx` (section error boundary).

**Modified:**
- `src/app/(app)/layout.tsx` — keeps the auth guard, now renders `<AppShell>` instead of
  the Layer 4 stopgap header.
- `src/providers/*` — unchanged (AuthProvider already wired).
- `package.json` / lock — add `cmdk`.

**Tests added:** `src/config/navigation.test.ts` (config integrity + `isNavItemActive` +
`navLabelForHref`), `src/components/layout/breadcrumb-trail.test.ts` (`buildBreadcrumbs`),
`bottom-nav.test.tsx`, `sidebar-nav.test.tsx` (render + active + landmark). Suite: 20
files / 91 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (20/91) ·
`build` ✅ (45 routes, no warnings) · `test:rules` ✅ (2/18, regression) ·
`test:integration` ✅ (1/5, regression) · `format:check` ✅.

**Manual test instructions:**
1. `npm run dev`, sign in. The dashboard now renders inside the shell: left sidebar
   (desktop), sticky topbar, breadcrumbs.
2. Click any sidebar item (e.g. Plan → Goals) → the placeholder page loads, breadcrumbs
   read `Dashboard / Plan / Goals`, and the item + its section show the active style.
3. Collapse the sidebar (top-left toggle) → icon rail with hover tooltips.
4. Narrow the window below `lg` → sidebar hides, the topbar shows a menu button (opens the
   drawer) and a bottom nav appears with Dashboard / Plan / Focus / Act / Grow.
5. Press `⌘K` / `Ctrl-K` (or click Search) → command palette: type "goals" and Enter to
   navigate; type "dark" → switch theme; "sign out" works.
6. Tab from the top of any page → the "Skip to content" link appears and focuses `<main>`.
7. `npm run typecheck && npm run lint && npm test && npm run build` → all pass.

**Known limitations:**
- Sidebar collapse state is per-session (not persisted) to avoid a hydration flash.
- "Search" is navigation + actions only; full-text content search arrives once modules
  have data.
- Notifications button is a link with no unread indicator (Layer 17).
- The optional desktop right context panel from the spec is not built yet — added by the
  first feature that needs it.
- Recovery Center is listed in the sidebar under PRIVATE; the privacy gate and its removal
  from search/notifications are Layer 15 / Layer 20.
- Every module route is a `ModulePlaceholder` / `SectionLanding` — no feature logic yet.

---

### Layer 6 — Core Data Model & Repository Layer — ✅ complete (2026-08-28) — committed + pushed

The shared data spine: audit/lifecycle schema, domain primitives, a generic user-scoped
Firestore repository factory (pagination, ownership, audit stamping), and generic
audit-field enforcement in the rules. No feature schemas — those belong to Layers 8–12.

**Created:**
- `src/lib/validation/domain.ts` (+ re-export) — `LIFE_PILLARS` / `lifePillarSchema` /
  `lifePillarsSchema`, `PRIORITIES` / `prioritySchema`, `RECORD_STATUSES` /
  `recordStatusSchema`, `MEASUREMENT_TYPES` / `measurementTypeSchema`, `idRefSchema`.
- `src/lib/repository/base-record.ts` — `baseRecordSchema` (id, userId?, status, version,
  createdAt, updatedAt, createdBy, updatedBy, archivedAt), `defineRecordSchema(fields)`,
  `BASE_RECORD_KEYS`.
- `src/lib/repository/pagination.ts` — `ListOptions` / `FieldFilter` / `Page<T>`,
  `pageQuerySchema`, `clampLimit`, `DEFAULT_PAGE_SIZE` (20) / `MAX_PAGE_SIZE` (100).
- `src/lib/repository/audit.ts` — `buildCreateAudit(uid)` / `buildUpdateAudit(uid)`
  (server timestamps + `increment(1)` version).
- `src/lib/repository/firestore-repository.ts` — `createFirestoreRepository(config)` →
  `{ list, get, create, update, archive, unarchive }`. uid from client auth
  (`requireUid()` → `AppError` `unauthenticated`); reads via `makeConverter`; `create` /
  `update` read back for real server timestamps; `list` fetches `limit + 1`, returns
  `{ items, nextCursor, hasMore }` with an opaque id cursor.
- `src/lib/repository/index.ts` barrel; `src/types/index.ts` re-exports the domain +
  data-access types.

**Modified:**
- `firestore.rules` — the `users/{uid}/{collection}/{document=**}` rule is split into
  read / create / update / delete with **audit-field enforcement**: `createdBy` /
  `updatedBy` == caller on create; `createdBy` / `createdAt` immutable and `updatedBy` ==
  caller on update.
- `tests/rules/firestore.rules.test.ts` — subcollection cases rewritten for the audited
  rule (create needs audit fields; wrong `createdBy` rejected; update can't rewrite
  `createdBy`; cross-user still denied).
- `docs/DATA_MODEL.md` §3 / index log, `docs/SECURITY.md` Layer 6 checkpoint, ADR-0011.

**Tests added:** `src/lib/validation/domain.test.ts`, `src/lib/repository/{base-record,
pagination,audit}.test.ts` (unit), `tests/integration/repository.test.ts` (7 cases against
the Auth + Firestore emulators: create/get audit shape, cursor pagination across 3 pages,
version increment + creation-audit immutability on update, archive/unarchive, path-scoped
reads + cross-user `permission-denied`, `unauthenticated` writes).

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (24/106) ·
`build` ✅ (45 routes) · `test:rules` ✅ (2/22) · `test:integration` ✅ (2/12) ·
`format:check` ✅ · functions suite unchanged ✅.

**Manual test instructions:**
- This layer adds no UI. To exercise it: `npm run test:integration` boots the emulators and
  runs the full repository lifecycle against them.
- Or in a scratch script: `createFirestoreRepository({ collectionName: "notes", schema,
  createSchema, updateSchema })` then `create` / `list({ limit, cursor })` / `update` /
  `archive` while signed in via `authService`.

**Known limitations:**
- Client-SDK only — no Admin-SDK (server) repository variant yet (ADR-0011); added when a
  server code path first needs user-scoped reads.
- `create` and `update` each do one extra read-back for timestamp consistency.
- Cursor pagination is forward-only; `orderBy` must be a stored field, and a `where` +
  non-default `orderBy` needs a composite index (logged in `DATA_MODEL.md` when a domain
  adds one).
- Rules enforce audit-field *integrity* generically; per-field domain-value validation
  (enum ranges, required feature fields) is added by each domain layer.

---

### Layer 7 — Dashboard MVP — ✅ complete (2026-08-28) — committed + pushed

The dashboard **aggregation service** (one batched user-scoped read; widgets never read
Firestore directly) plus real widgets for the data that exists today and honest,
module-linked empty states for the rest. **Quick Notes** is fully functional
end-to-end. See ADR-0012.

**Created — `src/features/dashboard/`:**
- `dashboard-aggregate.ts` — `DashboardAggregate` type + `loadDashboardAggregate()` (one
  `Promise.all` pass; today: quick notes; `null`/`[]` + `// Layer N` markers for
  goals/tasks/habits/KPIs/Life Score). `greetingForHour` / `greetingText` / `formatToday`.
- `quick-note.ts` — `quickNoteSchema` (`defineRecordSchema({ body })`), create/update
  schemas, and `quickNoteRepository = createFirestoreRepository({ collectionName: "quickNotes", … })`.
- `use-dashboard.ts` — `useDashboard()` hook: fetch-in-effect with a cancel flag + a
  `refreshToken` for retry; exposes `{ status, aggregate, error, reload, profile, user }`.
- `components/` — `GreetingWidget` (profile name, never hardcoded; locale/timezone date;
  hydration-safe via `useMounted`), `StatTile`, `QuickNotesWidget` (add / inline-edit /
  archive against the repo, optimistic local list, inline error), `PlaceholderWidget`
  (empty state + module link + planned-layer chip), `RecoveryShortcut` (no sensitive
  detail), `DashboardView` (loading skeleton / error state / grid).
- `index.ts` barrel.
- `src/hooks/use-mounted.ts` — `useMounted()` (`useSyncExternalStore`, SSR-false →
  client-true, no hydration mismatch).

**Modified:**
- `src/app/(app)/dashboard/page.tsx` — renders `<DashboardView />` (was a Layer 4 stub).
- `docs/DATA_MODEL.md` — adds `users/{uid}/quickNotes/{noteId}` to the collection map.

**Tests added:** `dashboard-aggregate.test.ts` (greeting + date helpers),
`quick-note.test.ts` (schemas), `components/DashboardView.test.tsx` (greets by profile
name / email-derived fallback, empty states + module links, privacy-safe recovery
shortcut, error state + retry — `useDashboard` mocked), `tests/integration/dashboard.test.ts`
(aggregate returns the user's quick notes + `null` placeholders; scoped to the signed-in
user — emulators). Suite: 27 files / 119 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (27/119) ·
`build` ✅ (45 routes) · `test:rules` ✅ (2/22) · `test:integration` ✅ (3/14) ·
`format:check` ✅ · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → `/dashboard` greets you by your profile name with today's
   date; three stat tiles show `—` (Focus / Tasks / Habits, arriving in Layers 9–10).
2. **Quick notes:** type a note, **Add** → it appears with "just now". Edit it (pencil) →
   Save. Delete it (trash) → it disappears. Reload the page → your notes persist.
3. Firebase console → Firestore shows `users/{uid}/quickNotes/{id}` with `body` + audit
   fields (`createdBy`/`updatedBy` = your uid, `version` bumps on edit,
   `status: "archived"` after delete).
4. Every placeholder widget links to its module route and shows its planned layer.
5. The Recovery shortcut links to `/recovery` and shows only "Private check-in".
6. `npm run typecheck && npm run lint && npm test && npm run build && npm run test:integration`
   → all pass.

**Known limitations:**
- Only Quick Notes has real data; every other widget is an empty state until its layer
  (8–13) extends `loadDashboardAggregate()`.
- Delete uses `archive()` (soft delete); archived notes are simply filtered from the list —
  no "archived notes" view or hard delete yet.
- The greeting is computed once per mount (no live minute-tick); the date uses the
  profile timezone, falling back to the browser timezone then UTC.
- Widgets the prompt lists but that need later infra are not built yet: energy check-in
  (Layer 9), focus timer (Layer 9), today's schedule (Layer 9C), weekly progress chart
  (Layer 8/12), notifications summary (Layer 17).

---

### Layer 8A — Life Vision — ✅ complete (2026-08-29) — committed + pushed

First slice of the Plan domain and the first CRUD feature on the Layer 6 repository. Users
keep a small set of typed, pillar-linked vision items (`users/{uid}/lifeVisions`).

**Created — `src/features/vision/`:**
- `schema.ts` — `LIFE_VISION_CATEGORIES` (10: mission / values / purpose / legacy / three
  directions / vision-statement / future-self / principle) + `LIFE_VISION_CATEGORY_META`
  (label, description, default pillars). `lifeVisionSchema = defineRecordSchema({ category,
  title (≤160), content (≤4000), pillarIds (1–3) })`, plus create/update schemas.
- `vision-repository.ts` — `lifeVisionRepository = createFirestoreRepository({ collectionName:
  "lifeVisions", … })` + `listActiveVisions()` (bounded fetch, filter `status === "active"`
  client-side — no `status` index yet; ADR-0013).
- `use-life-vision.ts` — `useLifeVision()`: fetch-in-effect + `create` / `update` / `archive`
  that mutate the local list; `reload`.
- `components/` — `VisionItemForm` (RHF + zodResolver; category `Select` pre-fills pillars,
  `Controller` + `PillarSelect`), `VisionItemDialog` (create / edit), `VisionItemCard`
  (category label, content, pillar badges, edit + archive-with-confirm), `LifeVisionView`
  (PageHeader + breadcrumbs, loading skeleton / error / empty state, items grouped by
  category).
- `index.ts` barrel.

**Created — shared:** `src/components/shared/PillarSelect.tsx` (3-pillar checkbox group,
canonical order) + `PillarBadges.tsx` (tinted badges). Reused by 8B–8G and Layer 12.

**Modified:**
- `src/app/(app)/plan/vision/page.tsx` — renders `<LifeVisionView />` (was a placeholder).
- `vitest.setup.ts` — jsdom polyfills for `ResizeObserver` / pointer-capture /
  `scrollIntoView` so Radix `Select` renders in component tests.
- `docs/DATA_MODEL.md` (annotate `lifeVisions`), `docs/SECURITY.md` (Layer 6 note),
  ADR-0013.

**Tests added:** `schema.test.ts` (category enum, 1–3 pillars, title/content limits,
metadata coverage), `components/LifeVisionView.test.tsx` (empty state, category grouping +
pillar badges, add dialog opens, error + retry — `useLifeVision` mocked),
`src/components/shared/PillarSelect.test.tsx` (toggle → canonical-order array),
`tests/integration/life-vision.test.ts` (create/list/update/archive with pillars + audit;
scoped to the signed-in user — emulators). Suite: 30 files / 133 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (30/133) ·
`build` ✅ (45 routes) · `test:rules` ✅ (2/22) · `test:integration` ✅ (4/16) ·
`format:check` ✅ · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Plan → Life Vision**. Empty state with "Add your first item".
2. Add a Personal mission: pick the category (pillars pre-fill), write a title + detail,
   optionally adjust pillars → **Add item**. It appears under a "Personal mission" heading
   with pillar badges.
3. Add a couple more in different categories → they group by category in the canonical
   order.
4. Edit one (pencil) → change the text/pillars → **Save changes**.
5. Archive one (trash → confirm) → it disappears. Reload the page → your items persist;
   the archived one stays gone.
6. Firestore console → `users/{uid}/lifeVisions/{id}` shows `category`, `pillarIds` array,
   audit fields; `status: "archived"` on the removed one.

**Known limitations:**
- Vision items don't yet link *down* to five-year/one-year plans — that traceability is
  wired in 8B–8H (the planning cascade).
- `listActiveVisions()` filters archived client-side; fine for the expected size, revisit
  with a `(status, createdAt)` index if a user ever has hundreds.
- No reordering within a category; items sort by creation time.
- Per-collection domain-value rules are deferred to Layer 20 (ADR-0013) — write shape is
  enforced by the Zod schemas in the repository, ownership + audit by the catch-all rule.

---

### Layer 8B — Five-Year & One-Year Plans — ✅ complete (2026-08-29) — committed + pushed

A shared **plan** model + one reusable view parameterized by planning horizon. Layer 8C
then just wires the three shorter tiers and their routes. See ADR-0014.

**Created — `src/features/plans/`:**
- `schema.ts` — `PLAN_HORIZONS` (five-year / one-year / quarter / month / week) +
  `PLAN_HORIZON_META` (label, route, collection name, description); `PLAN_STATUSES`
  (planned / active / complete / abandoned). One `planFieldsSchema` → `planSchema` (stored),
  `planCreateSchema` (every field explicit, `.refine` date ordering, **no transforms**),
  `planUpdateSchema` (`.partial()`). `planFormSchema` (string dates incl. `""`) +
  `planInputFromForm(values, parentId)` (`"" → null`).
- `repositories.ts` — `makePlanRepository(horizon)`; `PLAN_REPOSITORIES: Partial<Record<…>>`
  wired for `five-year` / `one-year`; `getPlanRepository` throws for an unwired tier;
  `listActivePlans(horizon)`.
- `use-plans.ts` — `usePlans(horizon)`: load + `create` / `update` / `archive` + `reload`.
- `components/` — `PlanForm` (RHF + zod; title, objective, desired outcomes & key measures
  as one-per-line textareas via `Controller`, start/end date, status `Select`, progress
  number, review notes, `PillarSelect`), `PlanDialog`, `PlanCard` (status badge, date
  range, `Progress` bar, first outcomes, pillar badges, archive-confirm), `PlansView`.
- `index.ts` barrel.

**Created — shared:** `src/components/ui/progress.tsx` — hand-rolled `Progress`
(`role="progressbar"`, clamped, no new dependency). Reused by 8C–8G and Layer 12.

**Created — validation:** `isoDateSchema` (`YYYY-MM-DD`) in `src/lib/validation`.

**Modified:** `src/app/(app)/plan/five-year/page.tsx` + `.../one-year/page.tsx` render
`<PlansView horizon=… />`. `docs/DATA_MODEL.md` annotations; ADR-0014.

**Tests added:** `src/features/plans/schema.test.ts` (create requires all fields, null vs
empty date, date ordering, progress/enum bounds, list caps; `planFormSchema` +
`planInputFromForm` mapping), `components/PlansView.test.tsx` (empty / card with
progressbar + status / new-plan dialog opens / error + retry — `usePlans` mocked),
`src/components/ui/progress.test.tsx`, `tests/integration/plans.test.ts` (tiers stay in
separate collections, defaults + progress/status update + archive, user scoping,
`getPlanRepository("quarter")` throws). Suite: 33 files / 149 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (33/149) ·
`build` ✅ (45 routes) · `test:rules` ✅ (2/22) · `test:integration` ✅ (5/20) ·
`format:check` ✅ · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Plan → Five-Year Plans**. Empty state → "Add your first plan".
2. **New plan**: title, objective, a few outcomes/measures (one per line), start/end dates
   (end before start → inline error), status, progress %, pillars → **Create plan**.
   The card shows the status badge, date range, a progress bar, and pillar badges.
3. Edit it (pencil) → change progress/status → **Save changes** (the bar updates).
4. Archive it (trash → confirm) → gone; reload → still gone, others persist.
5. **Plan → One-Year Plans** is the same screen against a different collection —
   five-year and one-year plans don't mix.
6. Firestore console → `users/{uid}/fiveYearPlans/{id}` and `users/{uid}/yearPlans/{id}`
   with `horizon`, `planStatus`, `progress`, `pillarIds`, audit fields.

**Known limitations:**
- `parentId` is stored but always `null` — real parent linking (vision → 5yr → 1yr) is 8H.
- `listActivePlans` filters archived client-side (same trade-off as 8A).
- No inline reordering; cards sort by plan status then start date.

---

### Layer 8C — Quarterly / Monthly / Weekly Planning — ✅ complete (2026-08-29) — committed + pushed

Wires the three shorter planning tiers onto the shared model from 8B (ADR-0014). No new
components or schema.

**Modified:**
- `src/features/plans/repositories.ts` — `PLAN_REPOSITORIES` is now a full
  `Record<PlanHorizon, PlanRepository>` (adds `quarter` / `month` / `week`).
- `src/app/(app)/plan/quarterly|monthly|weekly/page.tsx` — render
  `<PlansView horizon="quarter|month|week" />` (were `ModulePlaceholder`).
- `tests/integration/plans.test.ts` — the "each tier in its own collection" test loops over
  all five `PLAN_HORIZONS`; the "unwired tier throws" test becomes "a repository is wired
  for every tier".
- `src/features/plans/components/PlansView.test.tsx` — a `horizon="week"` render asserts the
  view is parameterized by horizon.
- `docs/DATA_MODEL.md` annotations already noted these three as Layer 8C.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (33/150) ·
`build` ✅ (45 routes; `/plan/quarterly|monthly|weekly` now real) · `test:rules` ✅ (2/22) ·
`test:integration` ✅ (5/20) · `format:check` ✅ · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Plan → Quarterly / Monthly / Weekly Plans**. Each is the
   full plan CRUD screen (add / edit / archive) against its own collection.
2. Create one plan in each tier → they're independent; the sidebar/breadcrumbs use the
   correct tier label.
3. Firestore console shows `users/{uid}/quarterPlans`, `monthPlans`, `weekPlans`.

**Known limitations:**
- Same as 8B: `parentId` unused until 8H; archived filtered client-side; no reordering.
- The tiers are not yet linked to each other (quarter → year → five-year) — 8H cascade.

---

### Layer 8D — Goals — ✅ complete (2026-08-29) — committed + pushed

Measurable goals (`users/{uid}/goals`) that link to a plan and roll up to life pillars.
Richer schema than plans: priority, measurement type / target / current / unit, review
frequency.

**Created — `src/features/goals/`:**
- `schema.ts` — `GOAL_STATUSES` (not-started / in-progress / on-hold / achieved / dropped),
  `REVIEW_FREQUENCIES`, `PRIORITY_LABEL`. One `goalFieldsSchema` → `goalSchema` (stored),
  `goalCreateSchema` (`.refine` target≥start, transform-free), `goalUpdateSchema`
  (`.partial()`), `goalFormSchema` (string dates, `number | null` measure fields) +
  `goalInputFromForm`.
- `goal-repository.ts` — `goalRepository` via `createFirestoreRepository` +
  `listActiveGoals()`.
- `use-goals.ts` — `useGoals()`: load + create / update / archive + reload.
- `components/` — `GoalForm` (RHF + zod; title, description, **parent-plan Select grouped
  by tier**, pillars, start/target dates, status, priority, progress, measurement type +
  current/target/unit, review frequency, notes), `GoalDialog`, `GoalCard` (status +
  priority badges, progress bar, measure summary "8 / 21 km", parent-plan chip, pillar
  badges, archive-confirm), `GoalsView` (sorted by priority → status → target date).
- `index.ts` barrel.

**Created — plans feature:** `listAllPlanOptions()` + `usePlanOptions()` in
`src/features/plans/` — the user's active plans across all five tiers, for the goal form's
parent picker and the card's parent-title lookup.

**Modified:** `src/app/(app)/plan/goals/page.tsx` renders `<GoalsView />` (was a
placeholder). `docs/DATA_MODEL.md` annotation.

**Tests added:** `src/features/goals/schema.test.ts` (create requires fields, null vs empty
date, date ordering, progress/unit/enum bounds, `goalFormSchema` + `goalInputFromForm`
mapping), `components/GoalsView.test.tsx` (empty / card with status·priority·progress·measure
/ new-goal dialog / error + retry — `useGoals` + `usePlanOptions` mocked),
`tests/integration/goals.test.ts` (goal linked to a plan; create → list → update
progress/current/status → archive; user scoping — emulators). Suite: 35 files / 162 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (35/162) ·
`build` ✅ (45 routes; `/plan/goals` real) · `test:rules` ✅ (2/22) · `test:integration` ✅
(6/22) · `format:check` ✅ · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Plan → Goals**. Empty state → "Add your first goal".
2. Create a goal: title, description, pick a **parent plan** (grouped by tier — needs a
   plan from 8B/8C to appear), pillars, target date, status, priority, measurement
   (e.g. Count, current 3, target 12, unit "books"), progress, review frequency → **Create
   goal**. The card shows both badges, a progress bar, "3 / 12 books", the target date, and
   the plan title.
3. Edit → change progress/current/status → **Save changes** (bar + measure update).
4. Archive (trash → confirm) → gone; reload persists.
5. Firestore console → `users/{uid}/goals/{id}` with `parentPlanId`, `measurementType`,
   `targetValue`/`currentValue`, `priority`, audit fields.

**Known limitations:**
- Goal → milestones / projects / tasks / habits / KPIs are established from the child side
  when those land (8E/8F/10/12); the goal record stores no child-id arrays.
- `progress` is manual — no auto-derivation from `currentValue / targetValue` yet.
- `listActiveGoals` filters archived client-side (same trade-off as 8A/8B).
- Parent-plan picker only lists *active* plans; a goal whose plan was archived shows no
  parent chip.

### Layer 8E — Projects — ✅ complete (2026-08-30) — committed + pushed

Projects (`users/{uid}/projects`) — delivery vehicles that sit under a goal and roll up to
life pillars. Carry an expected outcome, owner, start/end dates, status, priority, manual
progress, and free-text **dependencies** / **risks** lists.

**Created — `src/features/projects/`:**
- `schema.ts` — `PROJECT_STATUSES` (planned / active / blocked / complete / cancelled),
  `PROJECT_STATUS_LABEL`. One `projectFieldsSchema` → `projectSchema` (stored),
  `projectCreateSchema` (`.refine` end≥start, transform-free), `projectUpdateSchema`
  (`.partial()`), `projectFormSchema` (string dates) + `projectInputFromForm`. `dependencies`
  / `risks` are `string[]` (≤30 items, each ≤240 chars).
- `project-repository.ts` — `projectRepository` via `createFirestoreRepository` +
  `listActiveProjects()`.
- `use-projects.ts` — `useProjects()`: load + create / update / archive + reload
  (fetch-in-effect + `refreshToken`).
- `components/` — `ProjectForm` (RHF + zod; title, description, expected outcome, **goal
  Select**, pillars, owner / start / end, status, priority, progress, dependencies / risks
  textareas → line arrays, review notes), `ProjectDialog`, `ProjectCard` (status + priority
  badges, progress bar, owner / date-range / goal-title / risk-count metadata row, pillar
  badges, archive-confirm), `ProjectsView` (sorted by priority → status → end date).
- `index.ts` barrel.

**Created — goals feature:** `listGoalOptions()` + `GoalOption` in `goal-repository.ts` and
`useGoalOptions()` in `use-goal-options.ts` — the user's active goals, for the project
form's goal picker and the card's goal-title lookup. `src/features/goals/index.ts` exports
the new symbols.

**Modified:** `src/app/(app)/plan/projects/page.tsx` renders `<ProjectsView />` (was a
placeholder). `docs/DATA_MODEL.md` annotation.

**Tests added:** `src/features/projects/schema.test.ts` (create requires fields, null goal
vs empty date, end≥start, progress / list-length / enum bounds, `projectFormSchema` +
`projectInputFromForm` mapping), `components/ProjectsView.test.tsx` (empty / card with
status·priority·progress·risk-count / new-project dialog / error + retry — `useProjects` +
`useGoalOptions` mocked), `tests/integration/projects.test.ts` (project linked to a goal;
create → list → update progress/status → archive; user scoping — emulators). Suite: 37
files / 174 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (37/174) ·
`build` ✅ (45 routes; `/plan/projects` real) · `test:integration` ✅ (7 files / 24 tests) ·
`format` ✅ · `test:rules` not run (rules untouched) · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Plan → Projects**. Empty state → "Add your first project".
2. Create a project: title, description, expected outcome, pick a **goal** (needs a goal
   from 8D to appear), pillars, owner, end date, status, priority, progress, a few
   dependencies / risks (one per line) → **Create project**. The card shows both badges, a
   progress bar, the owner, date range, goal title, and "N risks".
3. Edit → change progress / status → **Save changes** (bar + badge update).
4. Archive (trash → confirm) → gone; reload persists.
5. Firestore console → `users/{uid}/projects/{id}` with `goalId`, `dependencies`, `risks`,
   `projectStatus`, `priority`, audit fields.

**Known limitations:**
- Project → milestones / tasks are established from the child side when those land
  (8F / 10); the project record stores no child-id arrays.
- `progress` is manual — no roll-up from milestones / tasks yet.
- `listActiveProjects` filters archived client-side (same trade-off as 8A–8D).
- Goal picker only lists *active* goals; a project whose goal was archived shows no goal
  chip.
- `dependencies` / `risks` are free text, not links to other project records.

### Layer 8F — Milestones — ✅ complete (2026-08-30) — committed + pushed

Milestones (`users/{uid}/milestones`) — checkpoints on the way to a goal or a project.
Polymorphic parent (`parentType` = `goal` / `project` / `none` + `parentId`), a due date, a
completion state, manual progress, free-text dependencies, and evidence / notes.

**Created — `src/features/milestones/`:**
- `schema.ts` — `MILESTONE_STATUSES` (upcoming / in-progress / done / missed),
  `MILESTONE_PARENT_TYPES` (none / goal / project) + labels. One `milestoneFieldsSchema` →
  `milestoneSchema` (stored), `milestoneCreateSchema` (`.refine`: a linked milestone must
  name its parent, a standalone one must not; transform-free), `milestoneUpdateSchema`
  (`.partial()`), `milestoneFormSchema` (string date, `.refine` parent picked) +
  `milestoneInputFromForm`.
- `milestone-repository.ts` — `milestoneRepository` via `createFirestoreRepository` +
  `listActiveMilestones()`.
- `use-milestones.ts` — `useMilestones()`: load + create / update / archive + reload
  (fetch-in-effect + `refreshToken`).
- `components/` — `MilestoneForm` (RHF + zod; title, description, **"Belongs to" type
  Select → goal/project Select** driven by `useWatch`, pillars, due date, status, progress,
  dependencies textarea → line array, evidence), `MilestoneDialog`, `MilestoneCard` (status
  badge, progress bar, due-date / parent-label / dependency-count metadata row, pillar
  badges, archive-confirm), `MilestonesView` (sorted by status → due date).
- `index.ts` barrel.

**Created — projects feature:** `listProjectOptions()` + `ProjectOption` in
`project-repository.ts` and `useProjectOptions()` in `use-project-options.ts` — active
projects for the milestone form's project picker. `src/features/projects/index.ts` exports
the new symbols.

**Modified:** `src/app/(app)/plan/milestones/page.tsx` renders `<MilestonesView />` (was a
placeholder). `docs/DATA_MODEL.md` annotation.

**Tests added:** `src/features/milestones/schema.test.ts` (create requires fields,
parent/parentId consistency both ways, null vs empty date, progress / list-length / enum
bounds, `milestoneFormSchema` refine + `milestoneInputFromForm` mapping),
`components/MilestonesView.test.tsx` (empty / card with status·progress·parent-label·dep-count
/ new-milestone dialog / error + retry — `useMilestones` + `useGoalOptions` +
`useProjectOptions` mocked), `tests/integration/milestones.test.ts` (milestone linked to a
goal; create → list → update progress/status → archive; user scoping — emulators). Suite:
39 files / 188 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (39/188) ·
`build` ✅ (45 routes; `/plan/milestones` real) · `test:integration` ✅ (8 files / 26 tests)
· `format` ✅ · `test:rules` not run (rules untouched) · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Plan → Milestones**. Empty state → "Add your first milestone".
2. Create a milestone: title, set **Belongs to** = Goal (needs a goal from 8D) or Project
   (needs a project from 8E) → pick the parent, pillars, due date, status, progress, a few
   dependencies (one per line), evidence → **Create milestone**. The card shows the status
   badge, a progress bar, the due date, "Goal: …" / "Project: …", and "N dependencies".
3. Set **Belongs to** = Standalone → the parent picker disappears and no parent is required.
4. Edit → change progress / status → **Save changes** (bar + badge update).
5. Archive (trash → confirm) → gone; reload persists.
6. Firestore console → `users/{uid}/milestones/{id}` with `parentType`, `parentId`,
   `dueDate`, `milestoneStatus`, `dependencies`, audit fields.

**Known limitations:**
- The parent link is a bare `parentType` + `parentId` pair — no Firestore-side referential
  integrity; deleting/archiving the goal or project leaves the milestone pointing at it and
  the card simply shows no parent label (pickers list only *active* parents).
- `progress` and `milestoneStatus` are independent and manual — no auto-sync (e.g. progress
  100 does not set status `done`).
- `listActiveMilestones` filters archived client-side (same trade-off as 8A–8E).
- Goal → milestones / project → milestones are not surfaced from the parent side yet; that
  roll-up arrives with the planning cascade (8H) / dashboard work.
- `dependencies` are free text, not links to other records.

---

## Known defects

_None._

## Technical debt

_None yet._

## Deferred features

- Spanish localization content (architecture prepared in Layer 18; content deferred — ADR-0005).
- External calendar sync (Google / Outlook / CalDAV) — deferred until the internal calendar
  is stable (post-Layer 9C).
- Biometric / WebAuthn recovery gate — architected in Layer 15A, implemented later; PIN
  first.
