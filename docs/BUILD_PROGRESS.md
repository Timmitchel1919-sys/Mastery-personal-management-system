# Mastery — Build Progress

Living build tracker. Updated at the end of every layer.

---

## Snapshot

| Field | Value |
|---|---|
| **Current layer** | Layer 9E — Priority Matrix (complete) — **closes the Focus domain (9A–9E)** |
| **Next approved layer** | Layer 10A — Tasks (opens the Act domain) |
| **Completed layers** | Layers 0–7 · Layer 8 (8A–8H) · **Layer 9 (9A–9E)** |
| **In-progress work** | none |
| **Test status** | ✅ app: `vitest run` — 63 files, 337 tests. ✅ rules: `npm run test:rules` — 2 files, 22 tests (not re-run in 9D/9E; rules untouched). ⚠️ integration: `npm run test:integration` — 15 files, 40 tests **written**; the 9D + 9E tests were not executed in-session (the Firestore emulator fails to boot here — JDK loopback-selector restriction, see `firestore-debug.log`). ✅ functions: 1 file, 5 tests. |
| **Build status** | ✅ app: `typecheck`, `lint` (0/0), `test`, `build` (47 routes, static export, no warnings), `format:check`. ✅ functions: `typecheck`, `lint`, `build`, `test`. |
| **Git status** | Commit-and-push per layer (`CLAUDE.md` §10); §10.1 — mandatory end-of-session commit + push + deploy. Layers 9D + 9E built on branch `claude/project-analyse-vervolgstappen-66bc86` (worktree), not yet merged to `main`. |
| **Deployment status** | ✅ **LIVE** at **https://mastery-personal-mgmt-system.web.app/** (redeployed for 9E). Static export (`output: "export"`) → Firebase Hosting on the Spark/free plan — ADR-0015 (deviates from App Hosting / ADR-0003; revisit when a layer needs SSR). `npm run build` then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`. Cloud Functions not deployed (needs Blaze; none shipped). `NEXT_PUBLIC_APP_ENV` still `development` in the release build — fix at Layer 22. |
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

### Layer 8G — Roadmaps — ✅ complete (2026-08-31) — committed + pushed

Roadmaps (`users/{uid}/roadmaps`) — timeline plans made of an ordered list of **phases**,
each with its own name, date range, and status. A roadmap has a `roadmapKind`
(goal / project / skill / learning / transformation / other), optional links to a goal
**and / or** a project, a horizon, manual progress, and pillars.

**Created — `src/features/roadmaps/`:**
- `schema.ts` — `ROADMAP_KINDS`, `ROADMAP_STATUSES` (planning / active / on-hold /
  complete), `PHASE_STATUSES` (upcoming / in-progress / done) + labels,
  `MAX_ROADMAP_PHASES = 24`. `roadmapPhaseSchema` (`.refine` end≥start) nested inside
  `roadmapFieldsSchema`. `roadmapSchema` (stored), `roadmapCreateSchema` (`.refine`
  roadmap-level end≥start, transform-free), `roadmapUpdateSchema` (`.partial()`),
  `roadmapPhaseFormSchema` + `roadmapFormSchema` (string dates, per-phase + roadmap-level
  date-order refine) + `roadmapInputFromForm` (maps `""` → `null` for every date incl. each
  phase's).
- `roadmap-repository.ts` — `roadmapRepository` via `createFirestoreRepository` +
  `listActiveRoadmaps()`.
- `use-roadmaps.ts` — `useRoadmaps()`: load + create / update / archive + reload.
- `components/` — `RoadmapForm` (RHF + zod; title, description, kind, status, linked goal /
  project Selects, pillars, start / end / progress, and a **`useFieldArray` phases editor**
  — add / remove rows, each name + start + end + status), `RoadmapDialog`, `RoadmapCard`
  (status + kind badges, progress bar, phase list with status dots, "N/M phases done",
  horizon, linked-goal / -project chips, pillar badges, archive-confirm), `RoadmapsView`
  (sorted by status → start date).
- `index.ts` barrel.

**Modified:** `src/app/(app)/plan/roadmaps/page.tsx` renders `<RoadmapsView />` (was a
placeholder). `docs/DATA_MODEL.md` annotation. Reuses `useGoalOptions` (8E) and
`useProjectOptions` (8F) for the link pickers — no new options code this layer.

**Tests added:** `src/features/roadmaps/schema.test.ts` (create requires fields, empty
phases + null dates ok, roadmap- and phase-level date ordering, progress / phase-count /
enum bounds, `roadmapFormSchema` + `roadmapInputFromForm` phase mapping),
`components/RoadmapsView.test.tsx` (empty / card with status·kind·progress·phase-list·
"1/2 phases done"·link / new-roadmap dialog / error + retry — `useRoadmaps` +
`useGoalOptions` + `useProjectOptions` mocked), `tests/integration/roadmaps.test.ts`
(roadmap linked to a goal with two phases; create → list → update progress/status →
archive; user scoping — emulators). Suite: 41 files / 201 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (41/201) ·
`build` ✅ (45 routes; `/plan/roadmaps` real) · `test:integration` ✅ (9 files / 28 tests) ·
`format:check` ✅ · `test:rules` not run (rules untouched) · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Plan → Roadmaps**. Empty state → "Add your first roadmap".
2. Create a roadmap: title, pick a **Kind**, optionally link a goal (8D) and / or project
   (8E), pillars, start / end / progress. Under **Phases**, click **Add phase** a few
   times; give each a name, dates, and status → **Create roadmap**. The card shows both
   badges, a progress bar, the phase list with coloured status dots, "N/M phases done", the
   horizon, and the linked-goal / -project chips.
3. Edit → reorder is not supported, but you can rename phases, change their status, add or
   remove rows, and change progress → **Save changes**.
4. Archive (trash → confirm) → gone; reload persists.
5. Firestore console → `users/{uid}/roadmaps/{id}` with `roadmapKind`, `phases` (array of
   `{ name, startDate, endDate, phaseStatus }`), `linkedGoalId` / `linkedProjectId`, audit
   fields.

**Known limitations:**
- Phases are an **embedded array** on the roadmap document, not their own collection — no
  per-phase ids, no drag-to-reorder (order = insertion order), and the whole array is
  rewritten on every save.
- `progress` is manual — not derived from phase statuses.
- Linked goal / project are bare id strings with no referential integrity; pickers list
  only *active* goals / projects, so a link to an archived one shows no chip.
- `listActiveRoadmaps` filters archived client-side (same trade-off as 8A–8F).
- No Gantt / calendar visualisation yet — the card shows a simple vertical phase list.

### Layer 8H — Planning Cascade — ✅ complete (2026-08-31) — committed + pushed — **closes the Plan domain**

Two parts: (1) **wire `plan.parentId`** so planning tiers actually link up the cascade, and
(2) a **read-only cascade view** at `/plan/cascade` that walks every plan-domain
parent-child id reference into one tree, with a "not yet linked" panel for records that
have no parent. Nothing here auto-creates records (spec §8H).

**Part 1 — plan-tier parent link (`src/features/plans/`):**
- `schema.ts` — `PLAN_PARENT_HORIZON: Record<PlanHorizon, PlanHorizon | null>`
  (five-year → null, one-year → five-year, quarter → one-year, month → quarter,
  week → month). `planFormSchema` gains `parentId: z.string()`; `planInputFromForm(values)`
  now reads `values.parentId || null` (the old 2-arg form is gone — only `PlansView` called
  it).
- `use-plan-tier-options.ts` — `usePlanTierOptions(horizon | null)` loads one tier's active
  plans as `PlanOption[]` (empty for a `null` tier).
- `PlanForm` / `PlanDialog` — render a **Parent {tier}** Select (with a "None" sentinel)
  for every tier except five-year; `PlansView` feeds it from `usePlanTierOptions` and drops
  the old `editing?.parentId` plumbing.

**Part 2 — cascade view (`src/features/cascade/`):**
- `build-cascade.ts` — **pure** `buildCascade(input)` → `{ roots, unlinked, counts }`.
  Node kinds `plan | goal | project | milestone | roadmap`. Nests child plans under
  `parentId`, goals under `parentPlanId`, projects under `goalId`, milestones under their
  `parentType`/`parentId` goal or project, roadmaps under `linkedGoalId` (preferred) or
  `linkedProjectId`. A link that points at a missing/inactive record → `danglingParent:
  true` and the record still surfaces (as a root for plans, in the unlinked list
  otherwise). `counts` = total / linked / unlinked / per-kind.
- `use-cascade.ts` — `useCascade()` loads all five plan tiers + goals + projects +
  milestones + roadmaps via their existing `listActive*` helpers in parallel, memoizes
  `buildCascade`.
- `components/` — `CascadeNodeRow` (recursive, native `<details>` disclosure, kind badge +
  `next/link` to the record's screen + status + "parent link broken" flag), `CascadeView`
  (counts card, the tree, the "not yet linked" grouped panel, loading / empty / error).
- `index.ts` barrel.

**Modified:** `src/config/navigation.ts` — new **Planning Cascade** item (`/plan/cascade`,
`Workflow` icon). `src/app/(app)/plan/cascade/page.tsx` renders `<CascadeView />` (new
route). `src/features/plans/index.ts` exports `PLAN_PARENT_HORIZON` + `usePlanTierOptions`.
`docs/DATA_MODEL.md` §4. `src/features/plans/schema.test.ts` +
`components/PlansView.test.tsx` updated for the `parentId` form field / new hook.

**Tests added:** `src/features/cascade/build-cascade.test.ts` (full chain nesting; unlinked
grouping + counts; dangling plan parent; dangling project parent still listed; roadmap
prefers goal over project), `components/CascadeView.test.tsx` (empty / tree + counts +
unlinked panel with working record links / error + retry — `useCascade` mocked),
`tests/integration/cascade.test.ts` (five-year → one-year → goal → project → milestone plus
a goal-linked roadmap, built from `listActive*`; an orphan goal lands in `unlinked`; user
scoping — emulators). Suite: 43 files / 210 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (43/210) ·
`build` ✅ (46 routes; `/plan/cascade` real) · `test:integration` ✅ (10 files / 30 tests) ·
`format:check` ✅ · `test:rules` not run (rules untouched) · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Plan → One-Year Plans**. Create or edit a one-year plan and
   pick a **Parent Five-Year** plan (needs a five-year plan to exist). Repeat down the tiers
   (quarter → one-year, month → quarter, week → month).
2. Give a Goal a **parent plan** (8D), a Project a **goal** (8E), a Milestone a goal /
   project (8F), a Roadmap a linked goal / project (8G).
3. **Plan → Planning Cascade**. The tree shows five-year plans at the top with everything
   nested beneath; each row links to that record's screen; the counts card shows total /
   linked / not-yet-linked.
4. Remove a parent link (set it back to "None") → the record moves to the **Not yet linked**
   panel on reload.
5. Point a record at a record you then archive → it shows "parent link broken" and sits in
   the unlinked panel (plans stay as roots with the flag).

**Known limitations:**
- Read-only — no drag-to-reparent, no "create child" action from the tree, no bulk linking.
  Re-parenting is done on each record's own screen.
- Loads every active plan-domain record on each visit (bounded to 100 per collection, 9
  parallel reads) and rebuilds the tree client-side; no server aggregation, no caching
  between visits, no realtime.
- The cascade stops at the plan domain — Vision items (8A) are not yet cascade parents, and
  Day / Task (Layer 10) are out of scope until that domain exists.
- "Active only": a record linked to an *archived* parent shows "parent link broken" exactly
  like a deleted one — the two cases aren't distinguished.
- A single milestone/project/roadmap appears once, under its nearest resolved parent; it is
  not also shown under its grandparents as a flattened breadcrumb.

### Layer 9A — Pomodoro — ✅ complete (2026-08-31) — committed + pushed — opens the Focus domain

Configurable focus/short-break/long-break cycles with a **persistent** live timer that
survives reload and navigation, plus a Firestore log of terminal sessions and headline
focus statistics.

**Live state (`src/features/pomodoro/pomodoro-store.ts`):** an external store for
`useSyncExternalStore`. Remaining time is always derived from a wall-clock `phaseEndsAt`
timestamp, so the countdown stays correct across tab-throttling, sleep, reload, and
navigation. The serialisable slice is mirrored to `localStorage` (`mastery.pomodoro.v1`,
validated on read via `pomodoroLiveStateSchema`) on every change and reacts to cross-tab
`storage` events. `createPomodoroStore({ storage, now })` factory for tests; a
`pomodoroStore` singleton for the app. A terminal session (target reached → `completed`, or
`End` → `abandoned`) surfaces as `pendingCompletion` for the hook to persist; a work phase
in progress is credited pro-rata.

**Persisted model (`schema.ts`):** `pomodoroSessionSchema` = base record +
`{ label, goalId, projectId, outcome (completed|abandoned), workMinutes, shortBreakMinutes,
longBreakMinutes, plannedCycles, completedWorkIntervals, focusMinutes, startedAt, endedAt,
notes }`. Transform-free `pomodoroSessionCreateSchema`. Only terminal sessions are written —
never a per-tick document. `pomodoroConfigSchema` validates the setup form.

**Created — `src/features/pomodoro/`:** `pomodoro-store.ts`, `schema.ts`,
`pomodoro-stats.ts` (`summarizeSessions` — pure: sessions / completed / abandoned / focus
minutes / intervals / average / today), `pomodoro-session-repository.ts`
(`pomodoroSessionRepository` + bounded `listRecentSessions(limit=20)`, `createdAt desc`),
`use-pomodoro.ts` (`useSyncExternalStore` + a single 1 s `tick` interval + a
completion-persist effect gated on auth), `use-pomodoro-history.ts` (fetch-in-effect +
`summarizeSessions`), `components/` (`PomodoroTimer` with an idle **setup form**
— label + goal/project Selects + interval/break/cycle inputs via RHF + zod — and a running
view with phase label, mm:ss, progress bar, cycle dots, Pause/Resume/Skip/End;
`PomodoroStats` tiles; `PomodoroHistoryList`; `PomodoroView`), `index.ts`.

**Modified:** `src/app/(app)/focus/pomodoro/page.tsx` renders `<PomodoroView />` (was a
placeholder). `docs/DATA_MODEL.md` annotation. (Nav item `/focus/pomodoro` already existed.)

**Tests added:** `pomodoro-store.test.ts` (start → work; work→short-break→work with full
focus credit; completion after the planned intervals; long break every 4th; pause freezes /
resume continues; skip credits a partial interval; End → abandoned with pro-rata focus;
restore a running session in a second store instance; ignore a corrupt blob — fake storage +
controllable clock), `schema.test.ts` (config bounds, live-state blob, session create),
`pomodoro-stats.test.ts` (empty + aggregation incl. today), `components/PomodoroView.test.tsx`
(idle setup + start / running timer + pause / history rows / history error + retry — hooks
mocked), `tests/integration/pomodoro.test.ts` (create two sessions → `listRecentSessions`
newest-first; user scoping — emulators). Suite: 47 files / 233 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (47/233) ·
`build` ✅ (46 routes; `/focus/pomodoro` real) · `test:integration` ✅ (11 files / 32 tests)
· `format:check` ✅ · `test:rules` not run (rules untouched) · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Focus → Pomodoro**. Set a label, optionally pick a goal /
   project, adjust the minutes (e.g. Focus 1, Short 1, Intervals 2 for a fast check) →
   **Start focus session**.
2. Watch the countdown. **Reload the page** mid-interval → the timer is still running at the
   right time. Navigate away and back → same.
3. **Pause** → the clock freezes even as real time passes; **Resume** → it continues from
   where it stopped. **Skip** jumps to the next phase.
4. Let it run to the end of the planned intervals (or hit **End**) → a row appears under
   **Recent sessions** and the stat tiles update. `End` mid-focus records "Ended early" with
   partial focus minutes.
5. Firestore console → `users/{uid}/pomodoroSessions/{id}` with `outcome`,
   `completedWorkIntervals`, `focusMinutes`, `startedAt`/`endedAt`, audit fields. Confirm
   there is **one** document per finished session, not one per tick.
6. Open a second tab on the same page → starting/pausing in one reflects in the other.

**Known limitations:**
- The live timer lives only in this browser's `localStorage` — it does **not** sync across
  devices, and clearing site data loses an in-progress session (no terminal record is
  written for one that never ends).
- No desktop notification / sound when a phase ends (Layer 17 territory); the phase only
  changes when the tab runs its 1 s tick or is re-focused.
- `task` linkage from the spec is deferred to Layer 10 (tasks do not exist yet); goal /
  project linkage is wired now.
- Stats are computed over the most recent 20 sessions only — "Focus today" undercounts if
  you did more than 20 sessions since midnight.
- Editing / deleting a past session is not offered; `notes` is stored but not yet editable.
- Changing the interval lengths mid-session is not possible — end the session and start a
  new one.

### Layer 9B — Deep Work — ✅ complete (2026-08-31) — committed + pushed

A logbook of focused sessions in `users/{uid}/focusSessions` — intended outcome, goal /
project link, start / end time, a distraction log, energy and focus-quality ratings (1–5),
completion notes, and a **derived** session score.

**Created — `src/features/deep-work/`:**
- `schema.ts` — `DEEP_WORK_STATUSES` (planned / in-progress / completed / abandoned).
  `deepWorkSessionSchema` (base record + `title`, `intendedOutcome`, `goalId`, `projectId`,
  `plannedMinutes`, `startedAt`/`endedAt`, `actualMinutes`, `energyLevel`, `focusQuality`,
  `distractions: string[]`, `completionNotes`, `sessionStatus`). `deepWorkCreateSchema`
  (`.refine` end ≥ start, transform-free), `deepWorkUpdateSchema` (`.partial()`),
  `deepWorkFormSchema` (datetime-local strings) + `deepWorkInputFromForm` — which fills
  `actualMinutes` from start/end when it is left at 0. `startedAt`/`endedAt` are kept as
  verbatim `YYYY-MM-DDTHH:mm` wall-clock strings (no timezone model until Layer 9C).
- `deep-work-score.ts` — `computeSessionScore` (pure, 0–100 from focus quality, energy,
  planned-vs-actual adherence, and distraction count; `null` until completed; never
  stored).
- `deep-work-stats.ts` — `summarizeDeepWork` (pure: sessions / completed / focus minutes /
  distractions / avg score / avg focus quality / last-7-days minutes).
- `deep-work-repository.ts` — `deepWorkRepository` (collection `focusSessions`) + bounded
  `listRecentDeepWork(limit=30)` (`createdAt desc`, archived filtered client-side).
- `use-deep-work.ts` — `useDeepWork()`: load + create / update / archive + reload +
  memoized stats.
- `components/` — `DeepWorkForm` (RHF + zod; title, outcome, goal/project Selects, planned/
  actual minutes, status, start/end `datetime-local`, energy & focus 1–5 Selects,
  distraction-log textarea, completion notes), `DeepWorkDialog`, `DeepWorkCard` (status +
  score badges, minute totals, energy/focus/distraction/link/time row, notes),
  `DeepWorkStats` tiles, `DeepWorkView` (stats + card grid, sorted newest-first by the
  repo).
- `index.ts` barrel.

**Modified:** `src/app/(app)/focus/deep-work/page.tsx` renders `<DeepWorkView />` (was a
placeholder). `docs/DATA_MODEL.md` annotation. (Nav item `/focus/deep-work` already
existed.) Reuses `useGoalOptions` / `useProjectOptions`.

**Tests added:** `schema.test.ts` (core fields, rating/minute bounds, end ≥ start, null
timestamps, 50-entry distraction cap, form → input incl. derived actual minutes),
`deep-work-score.test.ts` (null until completed; 100 for a perfect session; drops with poor
inputs; over-running the plan is not a bonus), `deep-work-stats.test.ts` (empty; completed
only counts toward focus time / averages; 7-day window),
`components/DeepWorkView.test.tsx` (empty / card with status·score·ratings·link / new-session
dialog / error + retry — `useDeepWork` + option hooks mocked),
`tests/integration/deep-work.test.ts` (session linked to a goal; create → list → update →
archive; user scoping — emulators). Suite: 51 files / 255 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (51/255) ·
`build` ✅ (46 routes; `/focus/deep-work` real) · `test:integration` ✅ (12 files / 34
tests) · `format:check` ✅ · `test:rules` not run (rules untouched) · functions suite
unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Focus → Deep Work**. Empty state → "Log your first session".
2. **New session**: title, intended outcome, optionally a goal / project, planned minutes,
   set Status to **Completed**, pick a start and end time, leave **Actual (min)** at 0,
   pick energy and focus quality, add a couple of distraction lines, completion notes →
   **Log session**. The card shows a status badge, a **Score N** badge, "85/90 min" style
   totals, energy/focus, the distraction count, the linked title, and the start time; the
   stat tiles update.
3. Edit → change the ratings or status → **Save changes** (score recomputes).
4. Archive (trash → confirm) → gone; reload persists.
5. Firestore console → `users/{uid}/focusSessions/{id}` with `sessionStatus`,
   `distractions`, `energyLevel`/`focusQuality`, `startedAt`/`endedAt`, audit fields.

**Known limitations:**
- No live timer — Deep Work is a *log* you fill in; the running-timer experience is
  Pomodoro's (Layer 9A). "Actual (min)" auto-fills from start/end only when left at 0.
- `startedAt`/`endedAt` carry no timezone (`YYYY-MM-DDTHH:mm` wall-clock) — the calendar
  layer (9C) introduces the timezone model; existing values are treated as local.
- The session score is a fixed heuristic, not user-tunable, and is recomputed on every
  render rather than stored (so historical scores shift if the formula changes).
- `distractions` is a plain line list with no timestamps — it is not a live "log as you
  go" during a session.
- `listRecentDeepWork` fetches the 30 newest and filters archived client-side; stats are
  over that window only.
- `task` linkage from the spec is deferred to Layer 10; goal / project linkage is wired.

### Layer 9C — Calendar — ✅ complete (2026-08-31) — committed + pushed

An internal functional calendar over `users/{uid}/events` with day / week / month views,
recurring events, all-day events, reminders, goal / project links, and a proper timezone
model — built behind a provider adapter so external sync can slot in later.

**Timezone model (`zoned-time.ts`):** `Intl`-based, no dependency. Timed events store an ISO
instant **with an explicit offset** (`2026-09-01T14:00:00+02:00`) plus the IANA `timeZone`
they were entered in. `wallTimeToIso` / `isoToWall` / `wallTimeToInstant` / `instantToWall`
/ `zoneOffsetMinutes` convert between a `YYYY-MM-DDTHH:mm` wall clock and instants,
DST-aware (verified against `America/New_York`, `Asia/Tokyo`, `Europe/Amsterdam`). This is
the layer that introduces the model — Deep Work's naked wall-clock strings (9B) can adopt
it later.

**Recurrence (`recurrence.ts`, pure):** `expandEvents(events, rangeStart, rangeEnd)` →
`EventOccurrence[]`. Supports daily / weekly / monthly / yearly with an `interval`, weekly
`weekdays`, and a `count` **or** `until` end. Stepping is done on the wall-clock date in the
event's own zone (so "09:00 daily" stays 09:00 across DST); monthly / yearly skip dates that
don't exist (Jan 31 → no Feb 31); occurrences are clipped to the requested window; bounded
by `MAX_OCCURRENCES` / `MAX_STEPS`.

**Grid helpers (`calendar-range.ts`, pure):** `monthMatrix` (6×7, Monday-start),
`weekDates`, `viewRange`, `periodLabel`, `navigate`, `occurrencesByDay` (multi-day
bucketing), `layoutDay` (greedy interval-graph colouring → side-by-side columns for
overlapping events).

**Adapter (`calendar-provider.ts`):** `CalendarProvider` interface
(`listEvents` / `createEvent` / `updateEvent` / `deleteEvent`) with `internalCalendarProvider`
wrapping `calendarEventRepository`; `getCalendarProvider()` is the single seam a future
Google / Outlook / CalDAV source implements (spec §9C — "build behind an adapter
interface"). No external sync.

**Created — `src/features/calendar/`:** `schema.ts` (`eventSchema` + create/update/form +
`eventInputFromForm`; timed-vs-all-day and end≥start refinements; `recurrenceSchema`,
`remindersSchema`), `zoned-time.ts`, `recurrence.ts`, `calendar-range.ts`,
`calendar-event-repository.ts` (`calendarEventRepository` on `events` + bounded
`listActiveEvents(limit=300)`), `calendar-provider.ts`, `use-calendar.ts` (view + anchor
state, provider load, memoized `occurrences` for the current range, nav + CRUD),
`components/` (`CalendarView` toolbar + view switch, `MonthGrid`, `TimeGrid` (week & day,
all-day row + 24-hour scroll body + positioned blocks), `EventForm` (title, all-day
`Switch`, timed / all-day fields, time zone, repeat rule with weekday picker and count /
until, reminder-preset chips, goal / project Selects, Delete), `EventDialog`), `index.ts`.

**Modified:** `src/app/(app)/focus/calendar/page.tsx` renders `<CalendarView />` (was a
placeholder). `docs/DATA_MODEL.md` annotation. (Nav item `/focus/calendar` already
existed.) Reuses `useGoalOptions` / `useProjectOptions` and `useMounted`.

**Tests added:** `zoned-time.test.ts` (offsets incl. DST, wall↔instant, iso round-trip),
`recurrence.test.ts` (non-recurring in/out of range; daily count / interval / until; weekly
weekdays; monthly skip-missing-day; window clipping; all-day recurrence; merge+sort),
`calendar-range.test.ts` (Monday week start, 6×7 matrix, labels, navigation, multi-day
bucketing, overlap columns), `schema.test.ts` (timed vs all-day refine, end≥start,
recurrence + reminder bounds, form → input assembly with normalised recurrence / reminders),
`components/CalendarView.test.tsx` (month grid + label + chip, view switch, toolbar nav, new
+ existing event dialog, week grid, error + retry — `useCalendar` mocked),
`tests/integration/calendar.test.ts` (create a weekly-recurring event through the provider →
list → expand to 5 occurrences → update → archive; user scoping — emulators). Suite: 56
files / 298 tests.

**Verification (all green):** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (56/298) ·
`build` ✅ (46 routes; `/focus/calendar` real) · `test:integration` ✅ (13 files / 36 tests)
· `format:check` ✅ · `test:rules` not run (rules untouched) · functions suite unchanged ✅.

**Manual test instructions:**
1. `npm run dev`, sign in → **Focus → Calendar**. It opens on the current month.
2. **New event** (or click a day). Give it a title, a start/end time, and a time zone
   (defaults to your browser's). Set **Repeat = Weekly**, pick a couple of weekdays, **Ends
   = After N times**, add a **10 min before** reminder, optionally link a goal / project →
   **Create event**. The recurring instances appear across the month.
3. Switch to **Week** and **Day** — the event shows on the hour grid; overlapping events
   split into side-by-side columns; all-day events sit in the top row.
4. Click an instance → the dialog opens on the series; change the title → **Save changes**
   (every instance updates). **Delete** removes the series.
5. Use ◀ / **Today** / ▶ to navigate; the period label tracks the view.
6. Firestore console → `users/{uid}/events/{id}` with `startDateTime` (ISO + offset),
   `timeZone`, `recurrence`, `reminders`, audit fields.

**Known limitations:**
- **No drag-and-drop / resize** — the spec says "where stable"; events are moved by editing.
- Recurrence edits are **series-wide only** — no "this occurrence" / "this and following",
  and no per-occurrence exceptions (EXDATE) or moved instances.
- `listActiveEvents` fetches the 300 newest active events and expansion happens client-side;
  a date-range-indexed Firestore query (which needs a composite index) is a later
  optimisation. A very old daily event could exceed the expansion step cap.
- One global timezone model per event; there is no "show the whole calendar in zone X"
  switch, and the grid places events by their own zone's wall clock.
- `task` and `time-block` linkage from the spec are deferred (Layers 10 / 9D); goal /
  project links are wired.
- Reminders are stored only — actual notification delivery is Layer 17.
- Week / day hour grid is a fixed 24-hour column with a scroll area; no working-hours
  cropping or current-time indicator.

### Layer 9D — Time Blocking — ✅ complete (2026-09-02) — committed + pushed + deployed live

Allocate time to an activity over `users/{uid}/timeBlocks` — a titled time range interpreted
in an explicit IANA time zone (the Layer 9C `zoned-time` model, reused), a category, optional
goal / project link and life pillars, a status, and notes. The view groups blocks by day and
**warns on overlapping blocks** (spec §9D "detect and warn on obvious scheduling conflicts").

**Created — `src/features/time-blocking/`:**
- `schema.ts` — `TIME_BLOCK_CATEGORIES` (deep-work / task / habit / goal / project / learning
  / spiritual / recovery / personal / admin / break / other) + labels; `TIME_BLOCK_STATUSES`
  (planned / done / skipped) + labels. `timeBlockFieldsSchema` (title, category, timeZone,
  `startDateTime` / `endDateTime` as ISO instants, `pillarIds` 0–3, `goalId`, `projectId`,
  notes, `blockStatus`). `timeBlockSchema` (stored), `timeBlockCreateSchema` (`.refine`
  end > start, transform-free), `timeBlockUpdateSchema` (`.partial()`), `timeBlockFormSchema`
  (wall-clock `startWall` / `endWall` strings + refine) + `timeBlockInputFromForm` (wall →
  zoned ISO via `wallTimeToIso`). `blockDurationMinutes` helper (pure).
- `detect-conflicts.ts` — **pure** `detectConflicts(blocks)` → `Map<blockId, blockId[]>`;
  two blocks conflict when their absolute instant ranges overlap (`a.start < b.end &&
  b.start < a.end`), compared on the stored offset-carrying ISO strings so cross-timezone
  blocks compare correctly; `skipped` blocks are excluded. `conflictedBlockCount`.
- `time-block-stats.ts` — **pure** `summarizeTimeBlocks` (blocks / planned / done / skipped /
  scheduled minutes / completed minutes / conflicted-block count).
- `time-block-repository.ts` — `timeBlockRepository` (`createFirestoreRepository`, collection
  `timeBlocks`) + `listActiveTimeBlocks(limit=200)` (active only, sorted by start instant
  client-side).
- `use-time-blocking.ts` — `useTimeBlocking()`: load + create / update / archive + reload,
  memoized `conflicts` map and `stats`; the local list is kept in start order.
- `components/` — `TimeBlockForm` (RHF + zod; title, category & status Selects, start / end
  `datetime-local`, time-zone Input defaulting to `resolveBrowserZone()`, goal / project
  Selects, `PillarSelect`, notes), `TimeBlockDialog` (create / edit; ISO → wall via
  `isoToWall`), `TimeBlockCard` (category + status + **Overlap** badges, formatted range,
  duration, zone, linked title, pillar badges, notes, archive-confirm), `TimeBlockStats`
  tiles, `TimeBlockView` (stats + a warning `Alert` when any conflicts exist + blocks
  grouped by day, each conflicting card flagged; loading / empty / error).
- `index.ts` barrel.

**Modified:** `src/app/(app)/focus/time-blocking/page.tsx` renders `<TimeBlockView />` (was a
`ModulePlaceholder`). `docs/DATA_MODEL.md` annotates `timeBlocks`. Reuses `resolveBrowserZone`
/ `wallTimeToIso` / `isoToWall` from `@/features/calendar` and `useGoalOptions` /
`useProjectOptions`. Nav item `/focus/time-blocking` already existed.

**Tests added:** `schema.test.ts` (create requires core fields, category / status enums,
end > start, pillar cap, empty pillars ok; form refine + `timeBlockInputFromForm` wall → zoned
ISO mapping; stored record; `blockDurationMinutes`), `detect-conflicts.test.ts` (back-to-back
clear, overlap flags both, three-way, skipped excluded, cross-timezone instant comparison),
`time-block-stats.test.ts` (empty, scheduled vs completed minutes with skipped excluded,
conflicted-block count), `components/TimeBlockView.test.tsx` (empty / card with category ·
status · duration · link / conflict banner + both cards flagged / new-block dialog / error +
retry — hooks mocked), `tests/integration/time-blocking.test.ts` (block linked to a goal;
create out of order → `listActiveTimeBlocks` returns start order → update status → archive;
user scoping — emulators). App suite: 60 files / 322 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (60/322) · `build` ✅ (46
routes; `/focus/time-blocking` real, no warnings) · `format:check` ✅ · functions
`typecheck` / `lint` / `build` / `test` ✅ (5). `test:rules` not run — `firestore.rules` /
`storage.rules` untouched this layer. `test:integration` — the 9D test is written to the same
pattern as the 12 passing integration tests, but **could not be executed in this session**:
the Firestore emulator fails to start in this environment (`java.net.SocketException: Invalid
argument: connect` opening a loopback selector pipe — `firestore-debug.log`). It should run
in CI / a normal dev machine.

**Deploy pipeline wired this session (ADR-0015):** `next.config.ts` → `output: "export"`
(+ `images.unoptimized`); `src/app/api/health/route.ts` → `force-static`; `firebase.json`
gains a `hosting` block (`public: "out"`, `cleanUrls`, immutable cache on `/_next/static`);
`.gitignore` / `.prettierignore` add `.claude/`. `npm run build` then `firebase deploy
--only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system` — **first live deploy** (266 files) to
https://mastery-personal-mgmt-system.web.app/ . Smoke-checked: `/`, `/dashboard`,
`/focus/time-blocking` → 200; `/api/health` serves the static JSON.

**Manual test instructions:**
1. `npm run dev`, sign in → **Focus → Time Blocking**. Empty state → "Add your first block".
2. **New block**: title, pick a category (e.g. Deep work), set a start and end time, adjust
   the time zone if needed, optionally link a goal / project and pick pillars → **Add block**.
   The card shows the category + status badges, the time range in that zone, the duration,
   the zone, and any linked title.
3. Add a second block whose time **overlaps** the first → a yellow "Scheduling conflict"
   banner appears and both cards get a red **Overlap** badge. The stat tiles show the
   scheduled minutes and the conflict count.
4. Edit a block (pencil) → change its time so it no longer overlaps → **Save changes**; the
   warning clears. Set a block to **Skipped** → it stops counting as a conflict.
5. Archive a block (trash → confirm) → gone; reload → persists, blocks are grouped by day in
   start order.
6. Firestore console → `users/{uid}/timeBlocks/{id}` with `category`, `startDateTime` /
   `endDateTime` (ISO + offset), `timeZone`, `blockStatus`, `pillarIds`, audit fields.

**Known limitations:**
- **No calendar-grid rendering** — time blocks are a day-grouped card list, not drawn on the
  Layer 9C hour grid, and there is no drag-to-create / resize. The two features share the
  time-zone model but not a view; a combined schedule view is later work.
- **No block ↔ calendar-event sync** — a block is its own record; it does not create or
  mirror a `calendar` event (spec `event.timeBlockId` linkage is deferred).
- `task` / `habit` / `recovery` allocations are only a **category label** — real links wait
  for the Act domain (Layer 10) and Recovery Center (Layer 15). `goal` / `project` links are
  real ids (pickers list active records only; a link to an archived one shows no chip).
- Conflict detection is **pairwise overlap only** — it does not consider working hours,
  buffers/travel time, all-day context, or calendar events; `skipped` blocks are ignored.
- `listActiveTimeBlocks` fetches the 200 newest active blocks and sorts / detects conflicts
  client-side; no date-range Firestore query (would need a composite index), no realtime.
- `blockStatus` is manual — a block whose end time has passed is not auto-marked `done`.
- Cross-feature import: `time-blocking` imports the zone helpers from `@/features/calendar`
  (same pattern as features importing `@/features/goals` / `projects` option hooks).

### Layer 9E — Priority Matrix — ✅ complete (2026-09-02) — committed + pushed + deployed live — **closes the Focus domain**

An Eisenhower matrix over `users/{uid}/priorityMatrixItems` — every item sits in exactly
one of four quadrants (`do` / `schedule` / `delegate` / `eliminate`) and can be moved
between them, marked complete, linked to a goal / project, and tagged with life pillars
(spec §9E). `task` linkage is deferred to the Act domain (Layer 10).

**Created — `src/features/priority-matrix/`:**
- `schema.ts` — `MATRIX_QUADRANTS` + `MATRIX_QUADRANT_META` (label, `urgent`/`important`
  booleans, one-line summary, advice). `matrixItemFieldsSchema` (title, quadrant, note,
  `goalId`, `projectId`, `pillarIds` 0–3, `completed`). `matrixItemSchema` (stored),
  transform-free `matrixItemCreateSchema`, `matrixItemUpdateSchema` (`.partial()`),
  `matrixItemFormSchema` + `matrixItemInputFromForm` (`"" → null` for links).
- `priority-matrix-repository.ts` — `priorityMatrixRepository` (`createFirestoreRepository`,
  collection `priorityMatrixItems`) + `listActiveMatrixItems(limit=200)` (active only,
  `createdAt asc`).
- `priority-matrix-stats.ts` — **pure** `summarizeMatrix` (total / completed / open /
  open-count per quadrant).
- `use-priority-matrix.ts` — `usePriorityMatrix()`: load + create / update / archive +
  `move(id, quadrant)` + `toggleComplete(id, completed)` (thin `update` wrappers) + reload;
  memoized `byQuadrant` grouping and `stats`.
- `components/` — `MatrixItemForm` (RHF + zod; title, quadrant Select, goal / project
  Selects, `PillarSelect`, note, completed `Switch`), `MatrixItemDialog` (create with the
  clicked quadrant preselected / edit), `MatrixItemCard` (completion `Checkbox` with
  strike-through, note, pillar badges, linked title, a **move-to-quadrant `Select`**, edit +
  archive-confirm), `PriorityMatrixView` (2×2 grid of quadrant cards with coloured left
  accent, per-quadrant "Add", open/completed counts, loading / error).
- `index.ts` barrel.

**Modified:** `src/app/(app)/focus/priority-matrix/page.tsx` renders `<PriorityMatrixView />`
(was a `ModulePlaceholder`). `docs/DATA_MODEL.md` adds `priorityMatrixItems`. Reuses
`useGoalOptions` / `useProjectOptions` and `PillarSelect` / `PillarBadges`. Nav item
`/focus/priority-matrix` already existed.

**Tests added:** `schema.test.ts` (create requires title, quadrant enum, pillar cap / empty
ok, update partial, form refine + `matrixItemInputFromForm` mapping, quadrant-meta
coverage, stored record), `priority-matrix-stats.test.ts` (empty; open-per-quadrant vs
completed), `components/PriorityMatrixView.test.tsx` (four quadrants each empty; item placed
in its quadrant with a move control + completion toggle calls the hook; new-item dialog;
error + retry — hooks mocked), `tests/integration/priority-matrix.test.ts` (create in `do`
→ move to `schedule` → complete → `listActiveMatrixItems` → archive; user scoping —
emulators; **written, not executed in-session** — same emulator restriction as 9D). App
suite: 63 files / 337 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (63/337) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; `/focus/priority-matrix` → 200.

**Manual test instructions:**
1. `npm run dev`, sign in → **Focus → Priority Matrix**. Four quadrant cards: Do (urgent &
   important), Schedule (important, not urgent), Delegate (urgent, not important), Eliminate
   (neither).
2. Click **Add** on the Schedule card → give it a title, optionally link a goal / project
   and pick pillars → **Add item**. It appears in the Schedule quadrant.
3. On the card, use the quadrant dropdown to **move** it to Do → it jumps to the Do card.
   Tick the checkbox → the title gets a strike-through and the open/completed counts update.
4. Edit (pencil) → change the title or quadrant → **Save changes**. Archive (trash →
   confirm) → gone; reload → persists.
5. Firestore console → `users/{uid}/priorityMatrixItems/{id}` with `quadrant`, `completed`,
   `goalId` / `projectId`, `pillarIds`, audit fields.

**Known limitations:**
- **No drag-and-drop** — items move via the per-card quadrant dropdown or the edit dialog
  (consistent with 9C/9D deferring DnD).
- `task` linkage from the spec is deferred to Layer 10 (tasks don't exist yet); `goal` /
  `project` links are real ids (pickers list active records only).
- No ordering within a quadrant (items sort by creation time); no per-quadrant WIP limits,
  no auto-sorting by pillar or link.
- `completed` is a plain flag with no completion timestamp or history, and completed items
  stay in their quadrant (greyed) rather than moving to a "done" area.
- `listActiveMatrixItems` reads the 200 oldest active items and groups client-side; no
  realtime, no pagination UI.

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
