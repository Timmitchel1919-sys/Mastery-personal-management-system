# Mastery — Build Progress

Living build tracker. Updated at the end of every layer.

---

## Snapshot

| Field | Value |
|---|---|
| **Current layer** | Layer 15F — Accountability Partner (complete) — **Layer 15 (Recovery Center) complete: 15A–15F** |
| **Next approved layer** | Layer 16 — Reports & PDF Export (not started — awaiting explicit go-ahead) |
| **Completed layers** | Layers 0–7 · Layer 8 (8A–8H) · Layer 9 (9A–9E) · Layer 10 (10A–10D) · Layer 11 (11A–11D) — Grow domain complete · Layer 12 · Layer 13 · Layer 14 · **Layer 15 (15A–15F) — Recovery Center complete** |
| **In-progress work** | — (Layer 15 finished; Layer 16 is next) |
| **Test status** | ✅ app: `vitest run` — 119 files, ~648 tests (recovery-accountability schema + `AccountabilitySection` + `PartnerProjectionView` component tests added). ✅ rules: `npm run test:rules` — 3 files, ~44 tests (`tests/rules/recovery.rules.test.ts` gained a `recoveryAccountabilityPartners — Layer 15F` block: direct client write REJECTED, owner READ allowed after Admin seed, cross-user read denied — not re-run in-session, emulator restriction). ⚠️ integration: `npm run test:integration` — 32 files **written**; `tests/integration/recovery-accountability.test.ts` added (direct client write rejected; owner list resolves) — not executed in-session (Firestore emulator restriction). ✅ functions: `vitest run` — 16 files, 98 tests (`configure-accountability-partner.test.ts` +7, `get-accountability-projection.test.ts` +9, `accountability-projection.test.ts` +3). |
| **Build status** | ✅ app: `typecheck`, `lint` (0/0), `test`, `build` (48 routes, static export, no warnings), `format:check`. ✅ functions: `typecheck`, `lint`, `test`, `build`. |
| **Git status** | Commit-and-push per layer (`CLAUDE.md` §10); §10.1 — mandatory end-of-session commit + push + deploy. Layers 9D → 15F built on branch `claude/project-analyse-vervolgstappen-66bc86` (worktree), not yet merged to `main`. |
| **Deployment status** | ✅ **LIVE** at **https://mastery-personal-mgmt-system.web.app/** (Layer 15F — hosting + `firestore.rules`: the recursive-wildcard owner-only rule now also refuses direct client writes to the top-level `recoveryAccountabilityPartners` collection). Static export (`output: "export"`) → Firebase Hosting on the Spark/free plan — ADR-0015. **Post-9E hotfix (carried forward):** the worktree had no `.env.local`, so the first deploys shipped a bundle that threw `Missing Firebase configuration`; fixed by copying `.env.local` in and rebuilding with `NEXT_PUBLIC_APP_ENV=production`. `_next/static` cache header dropped from `immutable` to `max-age=3600, must-revalidate` (Turbopack export chunk names aren't reliably content-hashed). Known cosmetic: route-group `<Link>` prefetch 404s an RSC `.txt` payload (navigation works). Cloud Functions (Layer 13/14 + 15C `recordRecoverySetback` + 15E `recoveryCoachQuery` + 15F `configureAccountabilityPartner`/`getAccountabilityProjection`) still not deployed — Spark plan, see ADR-0017/0018/0021/0023/0024. |
| **Repository** | `origin` → github.com/Timmitchel1919-sys/Mastery-personal-management-system.git · single `main` branch |
| **Stack (installed)** | Next 16.3.3 · React 19.2.8 · TypeScript 5.9 (strict) · Tailwind CSS 4.1 · ESLint 9.39 · Zod 4.1 · Vitest 4.1 + Testing Library + user-event · Prettier 3.9 · Radix UI · class-variance-authority · lucide-react · cmdk 1.1 · react-hook-form 7.86 · @hookform/resolvers 5.9 · firebase 12.18 · firebase-admin 14.3 · firebase-functions 7.3 · firebase-tools 15.28 · @firebase/rules-unit-testing 5 · @anthropic-ai/sdk 0.68 (functions/, Layer 13 — ADR-0017) · (no new deps in Layer 15A–15F) |

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

### Layer 10A — Tasks — ✅ complete (2026-09-02) — committed + pushed + deployed live — **opens the Act domain**

The unit of daily execution over `users/{uid}/tasks`. Rich record: status, priority, start /
due dates, life pillars, links up the planning cascade (goal / project / milestone) plus a
parent task, a light recurrence rule, effort (estimate / actual minutes) and energy, a
GTD-style context + tags, a completion timestamp, and a resolution reason for blocked /
cancelled work.

**Created — `src/features/tasks/`:**
- `schema.ts` — `TASK_STATUSES` (todo / in-progress / blocked / done / cancelled),
  `TASK_ENERGY_LEVELS`, `taskRecurrenceSchema` (`{ frequency, interval }`). `taskFieldsSchema`
  → `taskSchema` (stored), transform-free `taskCreateSchema` (`.refine` due ≥ start),
  `taskUpdateSchema` (`.partial()`). `taskFormSchema` (string dates, `recurrence` +
  `recurrenceInterval` fields) + `taskInputFromForm(values, previousCompletedAt?, now?)` —
  sets / preserves / clears `completedAt` by status, dedupes + caps tags. `isClosed`,
  `daysOverdue` helpers (pure).
- `task-repository.ts` — `taskRepository` (collection `tasks`) + `listActiveTasks(limit=300)`
  (active only; work-list sort: open before closed → status → priority → due date → title,
  client-side) + `listTaskOptions()` (open tasks, for the parent-task picker).
- `task-stats.ts` — **pure** `summarizeTasks` (open / done / blocked / overdue / due-today /
  logged minutes) and `subtaskProgressByParent` (per-parent total + closed count).
- `use-tasks.ts` — `useTasks()`: load + create / update / archive + `setStatusFor`
  (moves `completedAt` with the status) + reload; memoized `stats` and `subtaskProgress`.
- `components/` — `TaskForm` (RHF + zod; every field, with a `useWatch`-driven resolution
  textarea for blocked / cancelled and a conditional recurrence interval; goal / project /
  milestone / parent-task `LinkSelect`s), `TaskDialog`, `TaskCard` (done checkbox with
  strike-through, status + priority + overdue + recurrence badges, due date, effort, energy,
  context, subtask count, parent + link chips, tags, pillar badges, resolution note,
  archive-confirm), `TaskStats` tiles, `TasksView` (stats + flat sorted list; `useMounted`
  gates the "today"-relative overdue styling; loading / empty / error).
- `index.ts` barrel.

**Modified:**
- `src/app/(app)/act/tasks/page.tsx` renders `<TasksView />` (was a `ModulePlaceholder`).
- `src/features/milestones/` — added `listMilestoneOptions` / `MilestoneOption` and a
  `useMilestoneOptions` hook (same pattern as goals / projects), exported from the barrel,
  for the task form's milestone picker.
- `docs/DATA_MODEL.md` annotates `tasks`.

**Tests added:** `schema.test.ts` (create requires title, enums, date order, null dates /
recurrence, tag cap; `taskFormSchema` refine; `taskInputFromForm` completedAt set / preserve
/ clear + tag dedupe; `daysOverdue` / `isClosed`; stored record), `task-stats.test.ts`
(empty; open / overdue / due-today / done / blocked classification + logged minutes;
`subtaskProgressByParent`), `components/TasksView.test.tsx` (empty; card with status ·
priority · overdue · link · subtask count; toggle → `setStatusFor(task, "done")`; new-task
dialog; error + retry — hooks + `useMounted` mocked), `tests/integration/tasks.test.ts`
(task linked to a goal + parent; `listTaskOptions` excludes closed; complete sets
`completedAt` + bumps version; closed sorts last; archive; user scoping — emulators;
**written, not executed in-session**). App suite: 66 files / 358 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (66/358) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; `/act/tasks` → 200.

**Manual test instructions:**
1. `npm run dev`, sign in → **Act → Tasks**. Empty state → "Add your first task".
2. **New task**: title, set a priority and a due date, optionally link a goal / project /
   milestone and pick a parent task, add tags (comma separated), a context (e.g. `@calls`),
   an estimate, an energy level → **Add task**. The card shows the status + priority badges,
   the due date, the effort/energy/context row, and any link chips.
3. Give a task a past due date → it shows an "Nd overdue" badge and the due date turns red;
   the **Overdue** stat tile increments.
4. Create a second task and pick the first as its **Parent task** → the parent card shows
   "0/1 subtasks". Tick the subtask's checkbox → it reads "1/1" and the subtask greys out.
5. Set a task's status to **Blocked** in the dialog → a "Reason" field appears; the reason
   shows on the card in amber. Set it to **Done** → `completedAt` is stamped and the task
   sorts to the bottom.
6. Archive (trash → confirm) → gone; reload → persists.
7. Firestore console → `users/{uid}/tasks/{id}` with `taskStatus`, `priority`, `dueDate`,
   `goalId` / `projectId` / `milestoneId` / `parentTaskId`, `recurrence`, `tags`,
   `completedAt`, audit fields.

**Known limitations:**
- **Recurrence is stored, not expanded** — a recurring task does not spawn the next
  instance on completion; `recurrence` is a `{ frequency, interval }` marker for a later
  pass (10D Execution Tracker or a dedicated recurrence engine).
- **Subtasks are a flat parent link**, surfaced only as a count on the parent card — no
  nested tree view, no cascade on archive/complete, and the parent picker lists only open
  tasks (a task can't be its own parent; deeper cycles aren't blocked).
- `daysOverdue` / "due today" use the browser's local date; there is no per-task timezone.
- `listActiveTasks` reads the 300 newest active tasks and sorts client-side (no composite
  index, no realtime, no pagination / filter UI — a status/priority filter bar is later).
- Status is manual — completing all subtasks does not auto-complete the parent, and
  `estimatedMinutes` / `actualMinutes` are free numbers with no timer integration
  (Pomodoro / Deep Work links are not wired to tasks yet).
- Links are bare id strings with no referential integrity; a link to an archived
  goal/project/milestone simply shows no chip (pickers list active records only).

### Layer 10B — Habits — ✅ complete (2026-09-02) — committed + pushed + deployed live

A streak tracker over `users/{uid}/habits` + `users/{uid}/habitLogs`, suited to spiritual
disciplines, health habits, learning, and routines. A habit carries a life-pillar link
(required), an optional goal link, a schedule (daily every-N-days / weekly weekdays /
monthly days-of-month), a target + unit, a reminder time, and a pause state. **Streaks are
computed, not stored** — the same "derived, never persisted" pattern already used for the
Deep Work session score (Layer 9B) — so they can never drift out of sync with the logs.

**Created — `src/features/habits/`:**
- `schema.ts` — `HABIT_FREQUENCIES` (daily/weekly/monthly), `HABIT_STATUSES`
  (active/paused). `habitSchema` (stored; `pillarIds` required via `lifePillarsSchema`),
  transform-free `habitCreateSchema`, `habitUpdateSchema` (`.partial()`). `habitFormSchema`
  (`daysOfMonthText` free-text field) + `habitInputFromForm` (keeps only the
  interval/weekdays/daysOfMonth relevant to the chosen frequency; parses, dedupes, sorts,
  and clamps the days-of-month text to 1–31). Separate `habitLogSchema` family — one log
  per habit per day, `completed` or `missed`.
- `habit-schedule.ts` — **pure** `isExpectedOn(habit, anchor, date)` and
  `expectedDatesInRange` (bounded iteration, mirrors the calendar recurrence module's
  approach) — the schedule math shared by streaks and the recent-days strip.
- `habit-streak.ts` — **pure** `computeHabitStreaks` (current + longest streak: a run is
  *consecutive expected occurrences* logged `completed` — gaps on non-expected days don't
  break it) and `recentDayStates` (last N days as completed/missed/not-expected, for a dot
  strip). `anchorFor` bounds the lookback to 365 days so a long-lived habit stays cheap.
- `habit-stats.ts` — **pure** `summarizeHabits` (active/paused habit counts, due-today,
  completed-today, best current streak across all habits).
- `habit-repository.ts` / `habit-log-repository.ts` — `habitRepository` +
  `listActiveHabits`; `habitLogRepository` + `listRecentHabitLogs(limit=500)` (bounded,
  grouped by `habitId` client-side to avoid a composite `where+orderBy` index).
- `use-habits.ts` — `useHabits()`: loads habits + logs together; create/update/archive for
  habits; `setDayStatus(habitId, date, status)` **upserts** the one log for that day (finds
  an existing log in state, updates it, else creates); memoized `logsByHabit`,
  `streaksByHabit`, `recentDaysByHabit`, `stats`.
- `components/` — `HabitForm` (RHF + zod; pillars, goal link, frequency Select with a
  conditional every-N-days input / weekday toggle row / days-of-month text field, target +
  unit, `type="time"` reminder, status), `HabitDialog`, `HabitCard` (status + schedule +
  streak badges, a 7-day dot strip, best-streak/target/reminder/link row, pillar badges,
  **"Done today" / "Missed" quick-log buttons**, edit + archive-confirm), `HabitStats`
  tiles, `HabitsView` (stats + card grid; `useMounted`-gated "today" for hydration safety;
  loading / empty / error).
- `index.ts` barrel.

**Modified:** `src/app/(app)/act/habits/page.tsx` renders `<HabitsView />` (was a
`ModulePlaceholder`). `docs/DATA_MODEL.md` annotates `habits` + `habitLogs`. Reuses
`useGoalOptions`, `PillarSelect` / `PillarBadges`, `useMounted`.

**Tests added:** `habit-schedule.test.ts` (daily interval math, weekly weekday matching +
"no weekdays = every day", monthly days-of-month + empty-defaults-to-day-1, range
expansion), `habit-streak.test.ts` (perfect run, a missed day resets current but keeps the
earlier longest, empty logs, weekly-only-expected-days, recent-day states),
`schema.test.ts` (create requires title + ≥1 pillar, enum/reminder-format checks, form →
input frequency-scoped mapping + days-of-month dedupe, habit-log schema), `habit-stats.test.ts`
(zero state, active/paused split + due/done-today + best streak, a habit not due today is
excluded), `components/HabitsView.test.tsx` (empty; card with schedule · streak · link ·
today's log state; "Done today" calls `setDayStatus`; new-habit dialog; error + retry —
hooks mocked), `tests/integration/habits.test.ts` (habit linked to a goal; three days
logged → streak of 3; correcting a day to `missed` drops the current streak but keeps the
earlier longest; archive; user scoping — emulators; **written, not executed in-session**).
App suite: 71 files / 387 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (71/387) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; `/act/habits` → 200.

**Manual test instructions:**
1. `npm run dev`, sign in → **Act → Habits**. Empty state → "Add your first habit".
2. **New habit**: title, pick at least one life pillar (required), choose **Daily** →
   leave "Every N days" at 1, set a target + unit, a reminder time → **Add habit**. The
   card shows Active + Daily badges, a 7-day dot strip, and Done today / Missed buttons.
3. Click **Done today** → the button highlights, a green dot appears for today in the
   strip, and the "Done today" stat tile increments. Click **Missed** instead → it flips to
   a red dot and no streak credit.
4. Log a few consecutive days (edit the habit isn't needed — the quick buttons write
   today's log) — watch the **N streak** badge and "best streak N" text update. Break the
   chain (click Missed) → the streak badge disappears but "best streak" keeps the earlier
   number.
5. Create a **Weekly** habit and toggle specific weekdays → the dot strip only expects
   those days; other days show as grey (not-expected) rather than red.
6. Set a habit to **Paused** in the edit dialog → its status badge changes; archiving hides
   it entirely (its logs remain).
7. Firestore console → `users/{uid}/habits/{id}` (frequency/schedule fields, no streak
   field — it's computed) and `users/{uid}/habitLogs/{id}` (one per habit per day).

**Known limitations:**
- **Streaks recompute on every render** from the full log set rather than being cached —
  fine at this scale (bounded to 500 logs / 365-day lookback), but revisit if a user
  accumulates years of daily logs across many habits.
- **No historical status timeline** — pausing/resuming doesn't retroactively adjust past
  expected days; a long unpaused gap with no logs will show as a broken streak, computed
  honestly against the schedule rather than "frozen" while away.
- Monthly scheduling only understands specific days-of-month (not "last day" / "first
  Monday" style rules); weekly with no weekdays selected behaves like daily.
- The quick-log buttons only ever write **today's** log — correcting a past day, or the
  `value` (vs. `target`) and `notes` fields on a log, isn't exposed in the UI yet.
- Reminder times are stored only — delivery is Layer 17. `goal` linkage is a real id
  (archived goals show no chip); `task`/routine linkage from the spec waits for 10C/10D.

### Layer 10C — Daily Routine — ✅ complete (2026-09-02) — committed + pushed + deployed live

Ordered checklists over `users/{uid}/routines` + `users/{uid}/routineLogs`: morning /
work-study / evening / custom routines made of embedded, ordered steps (title, time
estimate, optional habit link), a reusable-template flag, and per-day completion tracking
that never mutates the routine document itself — the same "one log record per day" pattern
as habits (Layer 10B).

**Created — `src/features/routines/`:**
- `schema.ts` — `ROUTINE_TYPES` (morning/work-study/evening/custom). Steps are an embedded
  array (`routineStepSchema`: `id`, `title`, `estimatedMinutes`, `habitId`) — each step
  carries a **stable id** (`crypto.randomUUID()`, generated by `emptyRoutineStep()` /
  `routineInputFromForm`) so a day's completion log can reference it even after the routine
  is edited or reordered. `routineSchema` (stored), transform-free `routineCreateSchema`,
  `routineUpdateSchema` (`.partial()`), `routineFormSchema` + `routineInputFromForm`
  (blank habit link → `null`). Separate `routineLogSchema` family — one log per routine per
  day, `completedStepIds: string[]`.
- `routine-progress.ts` — **pure** `computeRoutineProgress(routine, log)` → completed/total
  steps and minutes for one day.
- `routine-repository.ts` / `routine-log-repository.ts` — `routineRepository` +
  `listActiveRoutines`; `routineLogRepository` + `listRecentRoutineLogs(limit=300)`
  (bounded, grouped by `routineId` client-side — same composite-index trade-off as habits).
- `routine-stats.ts` — **pure** `summarizeRoutines` (active-routine / template counts,
  today's steps-completed-of-total across all non-template routines, minutes planned).
- `use-routines.ts` — `useRoutines()`: loads routines + logs; create/update/archive;
  `toggleStep(routineId, stepId)` **upserts today's log**, toggling that step id in
  `completedStepIds`; `duplicateTemplate(template)` creates a new non-template routine from
  a template with fresh step ids (spec's "reusable templates").
- `components/` — `RoutineForm` (RHF + zod; title, description, type, pillars, a
  **template `Switch`**, and a `useFieldArray` step editor — title / minutes / habit-link
  Select per row, add/remove, capped at `MAX_ROUTINE_STEPS = 30`), `RoutineDialog`,
  `RoutineCard` (type + template + "N/M today" badges, a `Progress` bar, minutes-planned,
  a step checklist — **checkboxes for a live routine, a plain bullet list for a
  template** — with linked-habit chips, a "use this template" duplicate action, pillar
  badges, archive-confirm), `RoutineStats` tiles, `RoutinesView` (two sections — **"Your
  routines"** and **"Templates"** — split by `isTemplate`; loading / empty / error).
- `index.ts` barrel.

**Modified:**
- `src/app/(app)/act/routine/page.tsx` renders `<RoutinesView />` (was a `ModulePlaceholder`).
- `src/features/habits/` — added `listHabitOptions` / `HabitOption` +
  `useHabitOptions` (same pattern as goals/projects/milestones), for the routine step
  editor's habit picker.
- `docs/DATA_MODEL.md` annotates `routines` + `routineLogs`.

**Tests added:** `schema.test.ts` (create requires title + every step to have a title,
enum check, zero-steps/empty-pillars ok, `emptyRoutineStep` generates distinct ids, form →
input mapping, routine-log schema, stored record), `routine-progress.test.ts` (no log ⇒
zero progress, completed steps + their minutes, a stale completed-id that no longer
matches a step is ignored), `routine-stats.test.ts` (zero state, templates excluded from
active counts, today's totals), `components/RoutinesView.test.tsx` (empty; a live routine
under "Your routines" with its checklist + linked-habit chip, ticking a step calls
`toggleStep`; a template under "Templates" with no checkboxes, "use this template" calls
`duplicateTemplate`; new-routine dialog; error + retry — hooks mocked),
`tests/integration/routines.test.ts` (routine with a step linked to a habit; a day's
log records `completedStepIds`; flipping `isTemplate` persists; archive; user scoping —
emulators; **written, not executed in-session** — same emulator restriction as 9D–10B).
App suite: 75 files / 407 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (75/407) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; `/act/routine` → 200.

**Manual test instructions:**
1. `npm run dev`, sign in → **Act → Daily Routine**. Empty state → "Add your first routine".
2. **New routine**: title "Morning routine", type **Morning**, add a few steps (e.g. "Pray"
   10 min, "Stretch" 5 min — link "Pray" to a habit if you have one from Layer 10B) → **Add
   routine**. It appears under **Your routines** with a progress bar at 0/N and a checklist.
3. Tick a step's checkbox → the bar advances, the "N/M today" badge updates, the step gets
   a strike-through, and the linked-habit chip (if any) is visible next to it.
4. Toggle **Reusable template** on when creating/editing a routine → it moves to the
   **Templates** section, its checklist becomes plain bullets (no checkboxes), and a
   duplicate icon appears. Click it → a new, identical, non-template routine appears under
   **Your routines** with its own fresh checklist at 0/N.
5. Edit a routine → reorder isn't drag-and-drop, but you can add/remove/retitle steps;
   removing a step that was already checked off today simply drops it from the list (its
   log entry is harmless leftover data).
6. Archive (trash → confirm) → gone from the list; its logs remain in Firestore.
7. Firestore console → `users/{uid}/routines/{id}` (`steps[]` with stable `id`s,
   `isTemplate`) and `users/{uid}/routineLogs/{id}` (`completedStepIds`, one per day).

**Known limitations:**
- **No cross-write to the linked habit's log** — checking off a routine step linked to a
  habit does not also mark that habit's day as completed; the two are tracked
  independently for now (documented gap, candidate for a later integration pass).
- **No step reordering UI** — steps are added/removed in place; drag-to-reorder is not
  built (consistent with roadmaps/8G deferring the same).
- The checklist only ever reflects **today** — there's no history view of past days' logs,
  and no per-log `notes`/editing UI (the field exists on `routineLogs` but isn't exposed).
- Removing a step from a routine leaves any past `completedStepIds` referencing it as
  harmless orphaned ids — no cleanup pass.
- `listActiveRoutines` / `listRecentRoutineLogs` are bounded, client-grouped reads (same
  trade-off as habits) — no realtime, no pagination UI.

### Layer 10D — Execution Tracker — ✅ complete (2026-09-02) — committed + pushed + deployed live — **closes the Act domain**

A **read-only aggregation** view — no new collection (ADR-0016) — comparing planned vs
completed vs delayed vs cancelled work, estimated vs spent time, focus quality, energy, and
recorded reasons for non-completion, over a `Today` / `This week` period. Copy is kept
neutral and non-shaming throughout per spec: states are reported factually ("overdue",
"not completed", "cancelled"), and the reasons list is framed as context, not a scorecard.

**Created — `src/features/execution-tracker/`:**
- `execution-tracker.ts` — all **pure**: `periodRange(period, today)` (today = single day;
  week = trailing 7 days inclusive); `classifyTasks(tasks, range, today)` — a task with a
  `completedAt` in range counts as completed (on time vs. later than its due date);
  otherwise a task counts if its due date falls in range (overdue vs. upcoming) or it was
  cancelled in range (approximated by `updatedAt` — tasks keep no cancellation timestamp);
  sums estimated/actual minutes and collects a `notes` list from any `resolutionReason` on
  a completed-late / overdue / cancelled task. `summarizeHabitsForPeriod` — sums
  `expectedDatesInRange` (10B) against completed-log dates across all non-paused habits.
  `summarizeRoutinesForPeriod` — walks every day in range and sums `computeRoutineProgress`
  (10C) across all non-template routines. `averageEnergyLevel` — mean `energyLevel` across
  completed Deep Work sessions (9B), reusing focus-quality/energy signals that already
  exist there rather than re-collecting them.
- `use-execution-tracker.ts` — `useExecutionTracker()`: holds the period toggle and
  composes the **existing** `useTasks` / `useHabits` / `useRoutines` / `useDeepWork` hooks
  (no new repository calls); combines their loading/error states; memoizes the period
  summary and a `focusEnergy` snapshot (avg focus quality, avg energy, last-7-days focus
  minutes — from `useDeepWork`'s own stats).
- `components/ExecutionTrackerView.tsx` — a period `Select`, then four sections (Tasks,
  Habits, Routines, Focus & energy) of stat tiles, plus the non-completion notes list under
  Tasks; loading / empty-safe / error states.
- `index.ts` barrel.

**Modified:**
- `src/app/(app)/act/execution/page.tsx` renders `<ExecutionTrackerView />` (was a
  `ModulePlaceholder`).
- `src/features/routines/use-routines.ts` — now also returns the raw `logs` array (already
  fetched internally) so the tracker can compute routine progress over a multi-day range,
  not just today.
- `docs/DATA_MODEL.md` retires the placeholder `executionLogs` line with a pointer to
  ADR-0016 (no such collection is created).

**Tests added:** `execution-tracker.test.ts` (period ranges; task classification — on-time
vs later completion with a note, cancelled-with-reason, overdue-vs-upcoming split,
out-of-range tasks ignored; habit expected/completed summation + paused habits excluded;
routine step/minute summation across a range + templates excluded; average energy over
completed sessions only), `components/ExecutionTrackerView.test.tsx` (all four sections
render; task counts + a non-completion note; focus/energy averages; error + retry — hook
mocked). App suite: 77 files / 424 tests. **No new integration test** — this layer writes
no collection; its pure functions are unit-tested here, and the underlying Task / Habit /
Routine / Deep Work repositories are already covered by their own layers' integration
tests (ADR-0016).

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (77/424) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; `/act/execution` → 200.

**Manual test instructions:**
1. `npm run dev`, sign in → **Act → Execution Tracker**. Default period is **This week**.
2. With some tasks (10A) completed, overdue, or cancelled with a reason recorded, habits
   (10B) logged for a few days, and a routine (10C) with steps checked off — the Tasks
   section shows counts across Completed on time / Completed later / Past due, still open /
   Upcoming / Cancelled, plus estimated-vs-logged minutes.
3. Any completed-late, overdue, or cancelled task that has a **reason** recorded (blocked /
   cancelled resolution reason) shows under "Context recorded for these" with its title and
   reason — framed as context, not a scorecard.
4. Habits section shows expected-vs-completed occurrences for the period; Routines shows
   steps and minutes completed vs. planned; Focus & energy shows your recent Deep Work
   averages.
5. Switch the period to **Today** → all four sections recompute for just today.
6. This is a read-only view — there's nothing to create, edit, or archive here.

**Known limitations:**
- **"Rescheduled" is not reported** — tasks don't keep a due-date-change history, so it
  can't be derived honestly from existing data; only completed / cancelled / overdue /
  upcoming are shown (documented rather than faked — ADR-0016).
- **Cancellation timing is approximated** by a task's `updatedAt` (no dedicated
  cancellation timestamp) — editing any other field on an already-cancelled task after the
  fact would shift which period it's attributed to.
- **Focus & energy is not period-filtered** to match the Today/This week toggle — it always
  shows Deep Work's own "recent sessions" / "last 7 days" figures (inherits that layer's
  known limitation).
- Habit/Routine sums iterate day-by-day over the range client-side (bounded to a week) —
  fine at this scale, but not a general-purpose historical reporting engine.
- No export, no custom date range, no per-goal/per-pillar breakdown — this is a single
  whole-account snapshot for the two built-in periods.

### Layer 11A — Journal — ✅ complete (2026-09-02) — committed + pushed + deployed live — **opens the Grow domain**

One entry shape over `users/{uid}/journalEntries` covering free-form writing, guided
reflection, daily/weekly reflection, gratitude, lessons learned, and decision journaling —
`entryType` mainly drives which prompt the content field shows, plus a gratitude entry gets
a short list field. Mood/energy metadata, goal/pillar linkage, tags, client-side search, and
a lightweight per-entry privacy (collapse) flag round out the spec.

**Created — `src/features/journal/`:**
- `schema.ts` — `JOURNAL_ENTRY_TYPES` (free-form / guided-reflection / daily-reflection /
  weekly-reflection / gratitude / lessons-learned / decision) +
  `JOURNAL_ENTRY_TYPE_PROMPT` (a starting prompt per type, shown as the content field's
  placeholder — not stored). `journalEntrySchema` (stored: title, `entryType`,
  `entryDate`, `content`, `gratitudeItems` 0–10, 1–5 `moodRating`/`energyLevel`, 0–3
  `pillarIds`, `goalId`, `tags`, `isPrivate`). Transform-free `journalEntryCreateSchema`
  (`.refine`: needs either `content` or a gratitude item), `journalEntryUpdateSchema`
  (`.partial()`). `journalEntryFormSchema` (`gratitudeItemsText` / `tagsText` free-text) +
  `journalEntryInputFromForm` — keeps gratitude items only for a gratitude entry, dedupes
  tags.
- `journal-repository.ts` — `journalRepository` (collection `journalEntries`,
  `createdAt desc` — a feed, unlike the Plan/Act domains' `asc` lists) +
  `listRecentJournalEntries(limit=200)`.
- `journal-search.ts` — **pure** `filterJournalEntries(entries, {query, entryType})` — a
  client-side substring match (title/content/tags/gratitude items) plus an optional type
  filter, over the already-loaded bounded list (no search infrastructure).
- `journal-stats.ts` — **pure** `summarizeJournal` (total, entries in the last 7 days by
  `entryDate`, average mood/energy, distinct tag count).
- `use-journal.ts` — `useJournal()`: load + create/update/archive + reload; local
  `filter` state; memoized `filteredItems` and `stats`.
- `components/` — `JournalEntryForm` (RHF + zod; type Select swaps the content
  placeholder and reveals a gratitude-items textarea; date, mood/energy 1–5 Selects, goal
  Select, `PillarSelect`, tags, a `Switch` for "Private — collapse this entry by
  default"), `JournalEntryDialog`, `JournalEntryCard` (type + Private badges, entry date,
  an eye/eye-off toggle that collapses/reveals a private entry's body, gratitude list,
  mood/energy/goal-link row, tags, pillar badges, archive-confirm), `JournalStats` tiles,
  `JournalView` (stats + a search box + type filter + card feed; loading / empty /
  no-matches / error).
- `index.ts` barrel.

**Modified:** `src/app/(app)/grow/journal/page.tsx` renders `<JournalView />` (was a
`ModulePlaceholder`). `docs/DATA_MODEL.md` annotates `journalEntries`. Reuses
`useGoalOptions`, `PillarSelect` / `PillarBadges`.

**Tests added:** `schema.test.ts` (create needs content or a gratitude item, enum/rating
bounds, blank title + empty pillars ok, form refine + `journalEntryInputFromForm`
type-scoped gratitude mapping + tag dedupe, stored record), `journal-search.test.ts`
(no-filter passthrough, substring match across title/content/tags/gratitude items,
entry-type filter, combined filter+type), `journal-stats.test.ts` (empty state, averages +
last-7-days count + distinct tags), `components/JournalView.test.tsx` (empty state; card
with type · mood/energy · goal link · tags; "no entries match" when a filter excludes
everything; typing updates the search filter; new-entry dialog; error + retry — hook
mocked), `tests/integration/journal.test.ts` (entry linked to a goal; newest-first listing;
update mood + privacy; archive; user scoping — emulators; **written, not executed
in-session** — same emulator restriction as prior layers this session). App suite: 81
files / 447 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (81/447) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; `/grow/journal` → 200.

**Manual test instructions:**
1. `npm run dev`, sign in → **Grow → Journal**. Empty state → "Write your first entry".
2. **New entry**: leave type at **Free-form**, write something, pick a mood/energy, add a
   tag → **Add entry**. The card shows the type badge, date, mood/energy, and the tag.
3. Create a **Gratitude** entry → a "Grateful for" textarea appears (one item per line)
   above the main content field; the card renders the items as a bulleted list.
4. Switch type to **Daily reflection** / **Decision journal** etc. → the content field's
   placeholder changes to a prompt for that type, guiding what to write without forcing a
   rigid structure.
5. Toggle **Private** on an entry → its card shows a "Private" badge and its body is
   collapsed behind an eye icon by default; click the icon to reveal/hide it in that
   session.
6. Use the search box and the type filter above the feed → the list narrows to matches;
   clearing both shows everything again.
7. Edit → change mood/tags → **Save changes**. Archive (trash → confirm) → gone; reload →
   persists, feed stays newest-first.
8. Firestore console → `users/{uid}/journalEntries/{id}` with `entryType`, `entryDate`,
   `moodRating`/`energyLevel`, `tags`, `isPrivate`, audit fields.

**Known limitations:**
- **`isPrivate` is display-only** — it collapses the entry in this UI; it does not encrypt
  the record or restrict Firestore access beyond the standard owner-only rule already
  enforced for every record, and it is unrelated to the Recovery Center's privacy gate
  (Layer 15), which is a separate, more isolated system.
- **No per-prompt structure** — "guided reflection" and "decision journal" only change the
  placeholder prompt over one free-text field; there's no multi-question Q&A form or
  structured situation/decision/outcome breakdown (kept out of scope to avoid a much
  larger editor).
- Search is a client-side substring match over the bounded 200-entry list — no full-text
  search service, no ranking, no matching across archived entries.
- No entry-to-entry linking (e.g. a decision entry referencing an earlier reflection), and
  no export.
- `listRecentJournalEntries` is bounded and filtered client-side — no realtime, no
  pagination UI once an account has more than 200 active entries.

### Layer 11B — Learning — ✅ complete (2026-09-02) — committed + pushed + deployed live

Courses, study plans, book studies, and certification tracks over `users/{uid}/learningItems`
with an embedded, ordered **lesson checklist** (one-time, toggled directly on the item —
unlike the daily-recurring routine steps from 10C), resources, assessment notes, and
goal / life-pillar / skill linkage (skill is a bare id for now — Skills ships in 11D). Time
spent is tracked separately as `users/{uid}/studySessions`, an append-only log analogous to
Deep Work sessions (9B), so a learning item's total study time is **derived**, never
duplicated onto the item.

**Created — `src/features/learning/`:**
- `schema.ts` — `LEARNING_ITEM_TYPES` (course / book-study / skill-practice /
  certification / other), `LEARNING_STATUSES` (not-started / in-progress / completed /
  paused). `learningItemSchema` (stored: title, description, type, status, provider,
  target completion date, `resources: string[]`, `lessons: {id,title,completed}[]` ≤50,
  assessment notes, notes, 0–3 pillars, goal/skill links). Transform-free
  `learningItemCreateSchema`, `learningItemUpdateSchema` (`.partial()`).
  `learningItemFormSchema` (`resourcesText` newline list) + `learningItemInputFromForm`
  (always nulls `skillId` — no picker until 11D). `emptyLesson()` / `lessonProgress()`
  (pure) mirror the roadmap-phase / routine-step id + progress pattern. Separate
  `studySessionSchema` family (`learningItemId` nullable, `date`, 1–600 `minutes`, notes).
- `learning-item-repository.ts` / `study-session-repository.ts` — `learningItemRepository`
  + `listActiveLearningItems`; `studySessionRepository` (collection `studySessions`,
  `date desc`) + `listRecentStudySessions(limit=200)`.
- `learning-stats.ts` — **pure** `summarizeLearning` (item counts by status, total +
  last-7-days study minutes) and `studyMinutesForItem` (sum of sessions for one item).
- `use-learning.ts` — `useLearning()`: loads items + sessions together; create / update /
  archive for items; `toggleLesson(item, lessonId)` flips one lesson's `completed` via a
  normal `update` (no separate log — lessons are a one-time checklist, not recurring);
  `logSession` / `removeSession` for study sessions; memoized `studyMinutesByItem` and
  `stats`.
- `components/` — `LearningItemForm` (RHF + zod; type/status Selects, provider, target
  date, goal Select, pillars, a `useFieldArray` lesson checklist editor, resources
  textarea, assessment/notes textareas), `LearningItemDialog`, `LearningItemCard` (type +
  status + "N/M lessons" badges, a `Progress` bar, provider/target/study-minutes/goal-link
  row, a live lesson checklist, resource links — rendered as `<a>` when URL-shaped, plain
  text otherwise, assessment notes, pillar badges, archive-confirm), `LearningStats`
  tiles, `LogSessionDialog` (learning-item Select defaulting to "General study", date,
  minutes, notes), `RecentSessionsList` (title/date/minutes + remove), `LearningView`
  ("New item" + "Log session" actions, stats, item grid, a "Recent study sessions"
  section; loading / empty / error).
- `index.ts` barrel.

**Modified:** `src/app/(app)/grow/learning/page.tsx` renders `<LearningView />` (was a
`ModulePlaceholder`). `docs/DATA_MODEL.md` annotates `learningItems` + `studySessions`.
Reuses `useGoalOptions`, `PillarSelect` / `PillarBadges`.

**Tests added:** `schema.test.ts` (create requires title + every lesson to have a title,
enum bounds, zero lessons/resources ok, `emptyLesson`/`lessonProgress`, form → input
resource-line-splitting + `skillId` always null, study-session form/create incl. rejecting
zero minutes, stored record), `learning-stats.test.ts` (empty; status counts + 7-day vs
total study minutes; `studyMinutesForItem` scoped to one item),
`components/LearningView.test.tsx` (empty; item card with type · status · lesson checklist
· goal link, ticking a lesson calls `toggleLesson`; recent sessions list + remove; log-session
and new-item dialogs open; error + retry — hook mocked), `tests/integration/learning.test.ts`
(item linked to a goal; toggling a lesson persists; a study session logs and survives the
item's archival; user scoping — emulators; **written, not executed in-session** — same
emulator restriction as prior layers this session). App suite: 84 files / 468 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (84/468) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; `/grow/learning` → 200.

**Manual test instructions:**
1. `npm run dev`, sign in → **Grow → Learning**. Empty state → "Add your first item".
2. **New item**: title "Advanced TypeScript", type **Course**, status **In progress**, a
   provider, a target date, a couple of lessons, a resource URL per line → **Add item**.
   The card shows the type/status badges, a progress bar, the lesson checklist, and the
   resource as a clickable link.
3. Tick a lesson's checkbox on the card → the "N/M lessons" badge and progress bar update
   immediately.
4. Click **Log session** → pick the item (or leave "General study"), a date, minutes, a
   note → **Log session**. It appears under "Recent study sessions", and the card's "N min
   studied" figure and the stat tiles update.
5. Remove a session from the recent list → the study-minutes figures drop accordingly; the
   learning item itself is unaffected.
6. Edit an item → change status to **Completed** → **Save changes**; archive an item
   (trash → confirm) → gone from the list; its study sessions remain in Firestore and keep
   counting toward the "total" stat.
7. Firestore console → `users/{uid}/learningItems/{id}` (`lessons[]` with stable `id`s,
   `resources[]`, `skillId: null`) and `users/{uid}/studySessions/{id}`.

**Known limitations:**
- **`skillId` has no picker yet** — it's always `null`; Skills ships in Layer 11D, at
  which point a picker can be wired the same way milestones/habits gained one.
- **Assessments are a single free-text field** (`assessmentNotes`), not a structured,
  scorable list — kept simple rather than adding a third embedded array alongside lessons
  and resources.
- **No per-lesson notes or per-lesson time tracking** — notes are one field for the whole
  item; study sessions link to the item as a whole, not to an individual lesson.
- `resources` are plain strings rendered as links when URL-shaped — no favicon/preview
  fetching, no validation that a link resolves.
- `listActiveLearningItems` / `listRecentStudySessions` are bounded, client-filtered reads
  (same trade-off as habits/routines) — no realtime, no pagination UI.

### Layer 11C — Reading — ✅ complete (2026-09-02) — committed + pushed + deployed live

A reading list over `users/{uid}/books`, grouped into Currently reading / Want to read /
Completed / Abandoned, with page-based progress, user-entered highlights, lessons, action
items, and goal/pillar linkage. **Every text field is user-entered** — per spec, there is
no ISBN/metadata lookup, no auto-fetched synopsis or cover art, and no AI summarization;
highlights are verbatim quotes the user chooses to type in, exactly like their own notes.

**Created — `src/features/reading/`:**
- `schema.ts` — `READING_STATUSES` (want-to-read / currently-reading / completed /
  abandoned). `bookSchema` (stored: title, author, status, `currentPage`/`totalPages`,
  started/completed dates, `highlights: {id,quote,pageNumber}[]` ≤100, `lessons: string[]`
  ≤20, `actionItems: {id,title,completed}[]` ≤30, notes, 0–3 pillars, goal link).
  `bookCreateSchema` (`.refine`: current page can't exceed the total when a total is set),
  `bookUpdateSchema` (`.partial()`). `bookFormSchema` (`lessonsText` newline list, mirrors
  the same refine) + `bookInputFromForm`. `emptyHighlight()` / `emptyActionItem()` (stable
  ids, same pattern as Learning's `emptyLesson`) and **pure** `readingProgressPercent`
  (`null` with no total page count, else a clamped 0–100).
- `book-repository.ts` — `bookRepository` (collection `books`) + `listActiveBooks`.
- `reading-stats.ts` — **pure** `summarizeReading` (counts per status, completions in the
  last 30 days).
- `use-reading.ts` — `useReading()`: load + create / update / archive + reload;
  `toggleActionItem(book, itemId)` flips one action item via a normal `update` (same
  one-time-checklist pattern as Learning's lessons — no separate log needed); memoized
  `stats`.
- `components/` — `BookForm` (RHF + zod; status, current/total pages, started/completed
  dates, goal Select, pillars, two `useFieldArray` editors — highlights with a quote +
  page-number pair, action items with a title + completed checkbox — plus a lessons
  textarea), `BookDialog`, `BookCard` (status + `%` badges, a `Progress` bar, pages/
  dates/goal-link row, highlights rendered as styled `<blockquote>`s with their page
  number, a lessons bullet list, a live action-item checklist, pillar badges,
  archive-confirm), `ReadingStats` tiles, `ReadingView` (stats + four status sections,
  each hidden when empty; loading / empty / error).
- `index.ts` barrel.

**Modified:** `src/app/(app)/grow/reading/page.tsx` renders `<ReadingView />` (was a
`ModulePlaceholder`). `docs/DATA_MODEL.md` annotates `books`. Reuses `useGoalOptions`,
`PillarSelect` / `PillarBadges`.

**Tests added:** `schema.test.ts` (create requires title + every highlight/action item to
have content, enum bounds, current-page-vs-total refine both directions, null total bypasses
the page check, `emptyHighlight`/`emptyActionItem` distinct ids, `readingProgressPercent`
null/clamped, form refine + `bookInputFromForm` lesson-splitting + zero-total-to-null
mapping, stored record), `reading-stats.test.ts` (empty; per-status counts + 30-day
completion window), `components/ReadingView.test.tsx` (empty; a book grouped under its
status section with progress/highlights/lessons/action-item checklist/goal link, ticking an
action item calls `toggleActionItem`; new-book dialog; error + retry — hook mocked),
`tests/integration/reading.test.ts` (book linked to a goal; completing an action item
persists; marking it finished; archive; user scoping — emulators; **written, not executed
in-session** — same emulator restriction as prior layers this session). App suite: 87
files / 487 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (87/487) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system`.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; `/grow/reading` → 200.

**Manual test instructions:**
1. `npm run dev`, sign in → **Grow → Reading**. Empty state → "Add your first book".
2. **New book**: title "Deep Work", author, status **Currently reading**, current/total
   pages, add a highlight (quote + page number) and an action item → **Add book**. It
   appears under **Currently reading** with a progress bar and `%` badge, the highlight as
   a styled quote block, and the action item as a checkbox.
3. Tick the action item's checkbox on the card → it strikes through immediately.
4. Edit → change status to **Completed**, set current page to the total, pick a completed
   date → **Save changes**. The book moves from "Currently reading" to the **Completed**
   section.
5. Add a second book with status **Want to read** → it appears in its own section; sections
   with no books are hidden entirely.
6. Archive a book (trash → confirm) → gone; reload → persists, grouping is preserved.
7. Firestore console → `users/{uid}/books/{id}` with `readingStatus`, `highlights[]`
   (`quote`, `pageNumber`), `lessons[]`, `actionItems[]`, audit fields.

**Known limitations:**
- **No book metadata lookup by design** — title/author/cover are entered by hand; this is
  intentional per the spec's copyright constraint, not a missing integration to add later.
- **No per-highlight tags or export** — highlights are a flat list on the book, not
  independently searchable or exportable as quotes.
- Page-based progress assumes a single linear read-through — no support for re-reads or
  multiple reading sessions with separate progress histories (contrast with Learning's
  separate study-session log).
- `listActiveBooks` is a bounded, client-grouped read (same trade-off as habits/routines/
  learning items) — no realtime, no pagination UI.

---

### Layer 11D — Skills — ✅ complete (2026-09-04) — committed + pushed + deployed live — **closes the Grow domain (11A–11D)**

A skill inventory over `users/{uid}/skills`, each with a category, a starting/target
proficiency, a practice plan, user-entered evidence and learning resources, and goal/pillar
links. **Current proficiency and progress-to-target are derived from a `skillReviews` log**,
not stored on the skill — the skill only holds `startingProficiency` (baseline) and
`targetProficiency` (goal); the same "computed, never duplicated" pattern already used for
habit streaks (10B) and Deep Work scores (9B). Also wires up the `skillId` link on Learning
items (Layer 11B), deferred at the time because Skills didn't exist yet.

**Created — `src/features/skills/`:**
- `schema.ts` — `SKILL_CATEGORIES` (technical / creative / physical / interpersonal /
  leadership / language / other), `PROFICIENCY_MIN`/`MAX` (1–5). `skillSchema` (stored:
  title, description, category, `startingProficiency`, `targetProficiency`, practice plan,
  `evidence: string[]` ≤20, `resources: string[]` ≤20, 0–3 pillars, goal link,
  `nextReviewDate`). `skillCreateSchema`, `skillUpdateSchema` (`.partial()`). `skillFormSchema`
  (`evidenceText`/`resourcesText` newline lists) + `skillInputFromForm`. Separate
  `skillReviewSchema` (stored: `skillId`, `date`, `proficiency`, notes) +
  `skillReviewCreateSchema`/`skillReviewFormSchema`/`skillReviewInputFromForm`. **Pure**
  `currentProficiency(skill, reviews)` (latest review by date, else the skill's starting
  proficiency) and `progressToTarget(skill, reviews)` (0–100, clamped).
- `skill-repository.ts` — `skillRepository` (collection `skills`) + `listActiveSkills` +
  `SkillOption`/`listSkillOptions` (for the Learning skill picker).
- `skill-review-repository.ts` — `skillReviewRepository` (collection `skillReviews`,
  ordered by date desc) + `listRecentSkillReviews` (bounded 300, client-grouped by
  `skillId` — same trade-off as habit/routine logs, avoids a composite index).
- `skill-stats.ts` — **pure** `summarizeSkills` (total, due-for-review count, average
  progress-to-target).
- `use-skills.ts` — `useSkills()`: loads skills + reviews in parallel; create / update /
  archive for skills; `logReview` / `removeReview` for reviews; memoized
  `reviewsBySkill: Map<string, SkillReview[]>` and `stats`.
- `use-skill-options.ts` — `useSkillOptions()` (mirrors `useGoalOptions`).
- `components/` — `SkillForm` (RHF + zod; category Select, starting/target proficiency
  Selects — starting proficiency's field notes it updates automatically once a review is
  logged — next-review date, goal Select, `PillarSelect`, practice-plan/evidence/resources
  textareas), `SkillDialog`, `LogReviewDialog` (date, proficiency Select defaulting to the
  skill's current proficiency, notes — keyed by `skill?.id` so it resets per skill rather
  than resetting on every keystroke), `SkillCard` (category + current→target badges, an
  overdue "Review due" badge, a progress bar, practice plan/evidence/resources, a compact
  recent-reviews list, goal link, pillar badges, a "Log review" button, edit + archive with
  confirm), `SkillsStats` tiles, `SkillsView` (stats + grid + loading/empty/error).
- `index.ts` barrel.

**Modified:**
- `src/app/(app)/grow/skills/page.tsx` renders `<SkillsView />` (was a `ModulePlaceholder`).
- `src/features/learning/schema.ts` — `learningItemFormSchema` gained `skillId: z.string()`;
  `learningItemInputFromForm` now maps a blank form value to `null` instead of hardcoding
  `null` for every item.
- `src/features/learning/components/LearningItemForm.tsx` — added a Skill `Select`
  (`skillOptions` prop) next to the existing Goal picker.
- `src/features/learning/components/LearningItemDialog.tsx` — threads `skillOptions` and
  the item's `skillId` default through to the form.
- `src/features/learning/components/LearningItemCard.tsx` — added a `skillTitleById` prop
  and a linked-skill chip alongside the existing goal-link chip.
- `src/features/learning/components/LearningView.tsx` — loads `useSkillOptions()` and
  wires it into the card grid and the item dialog.
- `docs/DATA_MODEL.md` annotates `skills` and adds `skillReviews`.

**Tests added:** `schema.test.ts` (create requires a title, rejects an unknown category and
out-of-1–5 proficiency, partial update, stored record, form + `skillInputFromForm`
evidence/resource-splitting and blank-goal/date-to-null mapping, review form +
`skillReviewInputFromForm`, `currentProficiency` falls back / picks the latest by date
regardless of array order, `progressToTarget` scales and clamps at 100), `skill-stats.test.ts`
(zeros/null average with no skills; due-for-review count + averaged progress with mixed
reviewed/unreviewed skills), `components/SkillsView.test.tsx` (empty state; a skill card with
category/proficiency/progress/practice-plan/evidence/goal-link/recent-review-note; opening
the log-review dialog for a specific skill; opening the new-skill dialog; error + retry — hook
mocked), `tests/integration/skills.test.ts` (skill linked to a goal; two reviews logged and
`currentProficiency` picks the latest; archive; user scoping — emulators; **written, not
executed in-session** — same emulator restriction as prior layers this session). Also updated
`src/features/learning/schema.test.ts` and `components/LearningView.test.tsx` for the new
`skillId` wiring. App suite: 90 files / 507 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (90/507 — two unrelated
pre-existing tests timed out once mid-run and passed on isolated re-run, see Test status
above) · `build` ✅ (47 routes, static export, no warnings) · `format:check` ✅ · functions
suite unchanged ✅ (5). `test:rules` not run — rules untouched. `test:integration` — see
above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive`. Redeployed to
https://mastery-personal-mgmt-system.web.app/ ; smoke-tested `/grow/skills` in a fresh
browser tab — redirects to sign-in (auth guard working), no console errors.

**Manual test instructions:**
1. `npm run dev`, sign in → **Grow → Skills**. Empty state → "Add your first skill".
2. **New skill**: title "Public speaking", category **Interpersonal**, starting proficiency
   **2**, target **4**, a practice plan, evidence/resources lines, next review date →
   **Add skill**. The card shows `2 → 4`, a progress bar, and (if the review date is in the
   past) a "Review due" badge.
3. Click **Log review** → set proficiency to **3**, add a note → **Log review**. The card's
   badge updates to `3 → 4`, the progress bar advances, and the note appears in the recent
   reviews list.
4. Edit the skill and confirm "Current proficiency" shows a hint that it updates from
   reviews, not from the edit form.
5. Go to **Grow → Learning**, create or edit an item, pick the skill from the new **Skill**
   dropdown → save. The learning item card shows a linked-skill chip.
6. Archive the skill (trash → confirm) → gone from the list; reload → persists. Logged
   reviews are not deleted (per the archive-confirm copy).
7. Firestore console → `users/{uid}/skills/{id}` and `users/{uid}/skillReviews/{id}` with
   audit fields.

**Known limitations:**
- **No skill decay / reminder notifications** — `nextReviewDate` is a plain field shown as
  overdue on the card; nothing proactively reminds the user (push notifications ship in
  Layer 17).
- **No review editing or history charting** — reviews can be logged but not edited from the
  UI (only archived via the repository), and there's no trend chart, just a compact recent
  list capped at 3.
- `listActiveSkills`/`listRecentSkillReviews` are bounded, client-grouped reads (same
  trade-off as habits/routines/learning) — no realtime, no pagination UI.
- This closes the Grow domain (11A–11D); Layer 12 (KPI, Analytics & Life Score) has not been
  started and awaits the owner's explicit go-ahead per `CLAUDE.md` §7.

---

### Layer 12 — KPI, Analytics & Life Score — ✅ complete (2026-09-04) — committed + pushed + deployed live

KPI definitions and entries over `users/{uid}/kpis` + `users/{uid}/kpiEntries`, a
documented and configurable Life Score over `users/{uid}/lifeScoreEntries`, and a Trends
view comparing any KPI or the Life Score over time. Turns on the three `/analytics/*`
routes reserved for this layer (`kpis`, `life-score`, `trends`); `/analytics/reports` stays
a placeholder (Layer 16). The dashboard's `lifeScore`/`kpiOverview` fields
(`dashboard-aggregate.ts`) are left unwired, matching this codebase's established
precedent — every prior domain layer (8/9/10/11) also left its reserved dashboard slot
untouched; wiring the dashboard has never been bundled into the layer that introduces the
underlying data.

**Created — `src/features/kpis/`:**
- `schema.ts` — `KPI_DIRECTIONS` (higher-is-better / lower-is-better). `kpiSchema` (stored:
  title, description, free-text `category`, 0–3 pillars, `unit`, `direction`,
  `targetValue` nullable, `weight` 1–5 — its configurable influence on the Life Score —
  goal link, notes). `kpiCreateSchema`, `kpiUpdateSchema` (`.partial()`). `kpiFormSchema` +
  `kpiInputFromForm`. **Pure** `kpiAttainment(kpi, value)`: 0–100 toward the target, `null`
  with no target set (never silently scored as 0); a target of exactly 0 is a pass/fail
  threshold in both directions. Separate `kpiEntrySchema` family (stored: `kpiId`, `date`,
  `value`, `note`) — an append-only time series; **the KPI record never stores a "current
  value"**, every reading is derived from the entry log, the same pattern as habit streaks
  (10B) and skill proficiency (11D). System-calculated entries (auto-derived from other
  domains) are a documented known limitation, not built this layer.
- `kpi-repository.ts` — `kpiRepository` (collection `kpis`) + `listActiveKpis`.
- `kpi-entry-repository.ts` — `kpiEntryRepository` (collection `kpiEntries`, date desc) +
  `listRecentKpiEntries` (bounded 500, client-grouped by `kpiId`).
- `kpi-stats.ts` — **pure** `latestEntry` (most recent by date) and `summarizeKpis` (total,
  with-entries count, average attainment across scorable KPIs).
- `use-kpis.ts` — `useKpis()`: loads KPIs + entries in parallel; create/update/archive for
  KPIs; `addEntry`/`removeEntry` for entries; memoized `entriesByKpi` and `stats`.
- `components/` — `KpiForm` (title, category, unit, direction Select, target number input,
  weight Select with a "higher weight = more influence" hint, goal Select, `PillarSelect`,
  notes), `KpiDialog`, `AddKpiEntryDialog` (date, value, note — keyed by KPI id),
  `KpiCard` (category/direction/attainment badges, a progress bar, latest value vs. target,
  goal link, a `Sparkline` of its last 30 entries with a dashed target line, pillar badges,
  "Add entry", edit + archive with confirm), `KpisStats` tiles, `KpisView`.
- `index.ts` barrel.

**Created — `src/features/life-score/`:**
- `schema.ts` — `lifeScoreEntrySchema` (stored: `date`, `score` 0–100, a frozen `factors[]`
  snapshot — `{kpiId, title, value, attainment, weight}` — and a `note`). Entries are saved
  on demand, not on a schedule; the live score is always recomputed fresh, this is history.
  `saveScoreFormSchema` (an optional note) + `lifeScoreEntryInputFromResult`.
- `life-score.ts` — **pure** `computeLifeScore(kpis, latestValueByKpi)`: the documented
  formula required by the spec — the weighted average of every scorable KPI's attainment
  (each KPI's own `weight`), excluding KPIs with no target or no entry entirely (missing
  data never drags the score down), returning `null` with nothing to score and always
  returning the exact `factors` that contributed, so the UI can show how the number was
  reached and never present an unexplained score.
- `life-score-entry-repository.ts` — `lifeScoreEntryRepository` (collection
  `lifeScoreEntries`, date desc) + `listRecentLifeScoreEntries` (bounded 180).
- `use-life-score.ts` — `useLifeScore()`: composes `useKpis()` for the live inputs, loads
  saved history separately; `saveToday(note)` upserts (by date) rather than duplicating a
  same-day snapshot, so re-saving corrects the day's entry instead of piling up.
- `components/` — `SaveScoreDialog` (an optional note), `LifeScoreView` (big score + `/100`,
  a progress bar, the contributing-factors list with each KPI's value/attainment/weight, a
  `Sparkline` of saved score history, loading/empty/error).
- `index.ts` barrel.

**Created — `src/features/trends/`:**
- `trend-stats.ts` — **pure** `summarizeTrend(values)`: min/max/average/first/last/change
  over a chronological series, `null` for an empty one.
- `components/TrendsView.tsx` — a metric picker (Life Score or any KPI) backed by
  `useKpis()` + `useLifeScore()`, a `Sparkline` of the chosen series, and the trend stats
  tiles; loading/empty/error.
- `index.ts` barrel.

**Created — `src/components/shared/Sparkline.tsx`:** a small dependency-free SVG line
chart (points, optional dashed target line, accessible `role="img"` + `aria-label`) — the
app has no charting library, and this covers every "trend over time" need this layer
introduces (a KPI's entries, Life Score history, the Trends picker) without adding one.

**Modified:**
- `src/app/(app)/analytics/kpis/page.tsx`, `.../life-score/page.tsx`, `.../trends/page.tsx`
  render the real features (were `ModulePlaceholder`s). `.../analytics/reports/page.tsx`
  untouched (Layer 16).
- `docs/DATA_MODEL.md` annotates `kpis`, `kpiEntries`, `lifeScoreEntries`.

**Tests added:** `src/features/kpis/schema.test.ts` (create requires a title, rejects an
unknown direction and out-of-1–5 weight, allows a null target, partial update, stored
record, form + `kpiInputFromForm`, `kpiAttainment` for both directions including the
target-of-0 pass/fail case, entry form + `kpiEntryInputFromForm`), `kpi-stats.test.ts`
(`latestEntry` by date regardless of array order; `summarizeKpis` counts and averages only
scorable KPIs), `components/KpisView.test.tsx` (empty state; a KPI card with
category/attainment/target/goal-link; opening the add-entry dialog for a specific KPI;
opening the new-KPI dialog; error + retry — hook mocked); `src/features/life-score/
schema.test.ts` (entry validation, `lifeScoreEntryInputFromResult` mapping),
`life-score.test.ts` (empty input; excludes no-target/no-entry KPIs rather than scoring
them 0; weighted-average math), `components/LifeScoreView.test.tsx` (not-enough-data state
with Save disabled; score + factors rendered and Save flow calls `saveToday`; history
section appears with 2+ saved entries; error + retry); `src/features/trends/
trend-stats.test.ts` (empty series, multi-point stats, single-point zero-change),
`components/TrendsView.test.tsx` (Life-Score no-data state; trend + stats once history
exists; error + retry); `src/components/shared/Sparkline.test.tsx` (empty renders nothing,
accessible image + path, dashed target line); `tests/integration/kpis.test.ts` (KPI linked
to a goal, two entries logged, archive, user scoping — emulators), `tests/integration/
life-score.test.ts` (score computed from real KPI entries, same-day save overwrites rather
than duplicates, user scoping — emulators; **written, not executed in-session** — same
emulator restriction as prior layers this session). App suite: 99 files / 550 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (99/550) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅ · functions suite unchanged ✅ (5).
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive`. Redeployed to
https://mastery-personal-mgmt-system.web.app/.

**Manual test instructions:**
1. `npm run dev`, sign in → **Analytics → KPIs**. Empty state → "Add your first KPI".
2. **New KPI**: title "Sleep hours", unit "hours", direction **Higher is better**, target
   **8**, weight **3** → **Add KPI**.
3. Click **Add entry** → date today, value **4** → **Add entry**. The card shows a `50%`
   attainment badge and a progress bar at half.
4. Add a second entry a few days later with a higher value → a small trend line (with a
   dashed target line) appears on the card once there are 2+ entries.
5. Go to **Analytics → Life Score**. With one scorable KPI at 50% attainment and weight 3,
   the score shows **50**, with "Sleep hours" listed under Contributing factors
   (value/attainment/weight visible). Click **Save today's score** → confirm; a **Score
   history** section appears after a second day's save.
6. Go to **Analytics → Trends**, pick "Sleep hours" from the metric dropdown → its entries
   render as a trend with Latest/Change/Average/Min/Max tiles; switch to "Life Score" to
   see the saved-score history instead.
7. Archive the KPI (trash → confirm) → gone from the KPI list and excluded from the Life
   Score; its logged entries are not deleted.
8. Firestore console → `users/{uid}/kpis/{id}`, `users/{uid}/kpiEntries/{id}`,
   `users/{uid}/lifeScoreEntries/{id}` with audit fields.

**Known limitations:**
- **No system-calculated KPI entries** — every entry is user-entered this layer; auto-
  deriving entries from Habits/Deep Work/Tasks/etc. is deferred rather than half-built.
- **Life Score weighting is per-KPI only** — there's no separate per-pillar weighting on
  top of it; a KPI's own `weight` is its full influence on the score.
- **No editing of a logged KPI entry** — entries can be added and archived (via the
  repository) but not edited from the UI.
- Trends shows whatever is already loaded (bounded reads: 500 KPI entries, 180 Life Score
  entries) — no custom date-range picker, no comparison of two series side by side.
- `listActiveKpis`/`listRecentKpiEntries`/`listRecentLifeScoreEntries` are bounded reads
  (same trade-off as every prior domain this session) — no realtime, no pagination UI.
- The dashboard's Layer-12-reserved `lifeScore`/`kpiOverview` fields remain unwired — see
  the note above; this matches every prior layer's precedent, not an oversight.

---

### Layer 13 — General AI Architecture — ✅ complete (2026-09-04) — code written + unit-tested; committed + pushed + hosting deployed; **Cloud Functions NOT deployed** (owner's explicit choice — see ADR-0017)

Server-side general AI Coach per `docs/AI_ARCHITECTURE.md`: five authenticated Cloud
Functions sharing one flow (auth → validate → quota → minimal context → provider call →
structured-output validation → usage/audit → persisted exchange → the documented response
contract), an `AiProvider` abstraction implemented against Anthropic Claude, and a client
feature that calls the callables and reads back the resulting exchange history. Two
decisions here were the owner's, not the agent's — asked directly via `AskUserQuestion`:
**write and unit-test everything now, deploy later** (the project stays on the Spark plan;
Blaze is a billing upgrade the owner will make when ready), and **Anthropic Claude** as the
provider. `generateWeeklySummary` (Layer 14) and `recoveryCoachQuery` (Layer 15E, fully
isolated) are explicitly out of scope. Full rationale: ADR-0017.

**Created — `functions/src/ai/`:**
- `shared/contracts.ts` — `AI_INTENTS` (coach-query / planning-recommendations /
  goal-breakdown / reflection-questions / execution-patterns). `aiRequestSchema`
  (`intent`, nullable `targetRef`, nullable `userMessage`, `options.includePrivateJournal`).
  `modelOutputSchema` — what the model itself must produce (`answer`, `assumptions[]`,
  `suggestedActions[]`, `disclaimers[]`) — deliberately **excludes** `influencedBy`:
  `aiResponseSchema` extends it with that field, always attached server-side from the
  context that was actually loaded, so the model can never hallucinate a reference to a
  record it wasn't given.
- `shared/ai-provider.ts` — the `AiProvider` interface (one `complete()` method).
  `anthropic-provider.ts` — the concrete implementation via `@anthropic-ai/sdk` (new
  dependency), model `claude-sonnet-5` behind a named constant. `provider-factory.ts` binds
  it to a Functions secret (`ANTHROPIC_API_KEY`, `defineSecret` — never read outside a
  request, never provisioned this layer since nothing is deployed yet).
- `shared/quota.ts` — per-user cost controls: **pure** `checkQuota(day, month)` (the
  actual threshold decision) plus `assertWithinQuota`/`recordUsage` (Firestore
  read-then-write against `aiUsageDaily`/`aiUsageMonthly` rollup docs — plain arithmetic,
  not `FieldValue.increment`, trading a rare lost update under same-user concurrent
  requests for logic that's fully unit-testable without a live Firestore) plus a per-call
  `aiCallLogs` audit record.
- `shared/context-builder.ts` — per-intent, bounded Admin SDK reads (a `targetRef` doc;
  active goals for coach-query/planning-recommendations; non-private journal entries for
  reflection-questions, unless `includePrivateJournal`; recent tasks for
  execution-patterns) — reads defensively (loose field access) since `functions/` doesn't
  import the client's Zod schemas.
- `shared/prompts.ts` — the shared system preamble (context-only, no invented records, no
  automatic changes, explicit assumptions, no diagnosis, structured-JSON-only) plus one
  instruction string per intent.
- `shared/handler.ts` — `handleAiIntent(intent, request, { db, provider, now? })`: the
  full orchestration, built to take its Firestore instance and provider as parameters
  (not module singletons) specifically so it's unit-testable against fakes. Also exports
  **pure** `extractJson` (tolerates a markdown-fenced reply) and `estimateCostUsd` (a
  rough per-token estimate for the internal spend ceiling, not real billing).
- Five thin callables (`mastery-coach-query.ts` + four `generate-*`/`analyze-*` files)
  each supplying their intent to `handleAiIntent`, bound to `ANTHROPIC_API_KEY` via
  `secrets`. Re-exported from `functions/src/index.ts`.

**Created — `functions/tests/ai/`:** `fakes.ts` (a minimal in-memory Firestore + a
scriptable fake `AiProvider` — just enough of the chained query API the real code calls;
no real Firestore/network anywhere), `contracts.test.ts`, `quota.test.ts` (`checkQuota`
pure threshold logic), `context-builder.test.ts` (per-intent retrieval + the private-
journal filter), `handler.test.ts` (auth/validation/quota-block/happy-path/malformed-
model-JSON/passthrough-HttpsError, using the fakes — genuine coverage of the real
orchestration without touching a live provider). This matches `functions/`'s existing
pure-unit-test convention; there is no emulator-integration harness in that package.

**Created — `src/features/ai-coach/`:**
- `schema.ts` — client mirrors of the callable contract (`coachCallResultSchema`) and the
  persisted `coachExchangeSchema` (read-only: the client never creates/updates it, only
  the Cloud Function does via the Admin SDK).
- `ai-coach-client.ts` — `callCoach(intent, options)`: `httpsCallable` to the matching
  function, response validated with `coachCallResultSchema`, errors normalized via
  `mapFunctionsError`.
- `coach-exchange-repository.ts` — `listRecentCoachExchanges()` (bounded 50, newest first).
- `use-ai-coach.ts` — `useAiCoach()`: loads history; `ask(intent, options)` calls the
  function then reloads the list.
- `components/` — `AiCoachView` (an intent picker, a message box for coach-query, a goal
  picker for goal-breakdown, the other three intents need neither) and `ExchangeCard`
  (answer, assumptions, suggested actions, disclaimers as a warning alert, `influencedBy`
  as badges).
- `index.ts` barrel.

**Modified:**
- `src/lib/firebase/client.ts` — added a `functions` instance (region `europe-west1`,
  matching `functions/src/config/region.ts`) and emulator wiring — the first feature to
  call a Cloud Function from the browser.
- `src/app/(app)/grow/ai-coach/page.tsx` renders `<AiCoachView />` (was a
  `ModulePlaceholder`).
- `functions/package.json` — added `@anthropic-ai/sdk`.
- `docs/DATA_MODEL.md` annotates `coachExchanges`, `aiUsageDaily`, `aiUsageMonthly`,
  `aiCallLogs` (all Admin-SDK-only writes; the generic owner-only Firestore rule already
  covers client reads — no `firestore.rules` change needed).

**Tests added:** see the `functions/tests/ai/` list above (33 functions tests total, 28
new). App side: `src/features/ai-coach/schema.test.ts`, `components/AiCoachView.test.tsx`
(empty state; Ask disabled until a message is typed then calls `ask` with the right
payload; exchange history renders answer/assumptions/actions/influencedBy; error + retry —
hook mocked), `tests/integration/ai-coach.test.ts` (seeds a `coachExchanges` doc with the
client SDK — since there's no client `create()`, matching exactly what the Cloud Function
writes — then reads it back through `listRecentCoachExchanges`; user scoping; **written,
not executed in-session** — same emulator restriction as prior layers). App suite: 101
files / 558 tests. Functions suite: 6 files / 33 tests, executed in-session (no emulator
needed for pure-unit + fake-based tests).

**Verification:** app: `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (101/558) · `build` ✅
(47 routes, static export, no warnings) · `format:check` ✅. functions: `typecheck` ✅ ·
`lint` ✅ (0/0) · `test` ✅ (6/33, executed) · `build` ✅ (`tsc`) · `format:check` ✅.
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive` — **unchanged from every prior layer**;
`functions` is deliberately not in that command (ADR-0015, reaffirmed by ADR-0017).
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; smoke-tested `/grow/ai-coach`
in a fresh browser tab — loads, redirects to sign-in (auth guard), no console errors.

**Manual test instructions (once functions are deployed — see ADR-0017's two-step turn-on):**
1. `npm run dev` with the Functions emulator running (`firebase emulators:start`), sign in
   → **Grow → AI Coach**.
2. Pick **Ask a question**, type a question, submit → an answer appears with its
   assumptions, any suggested actions, and the goals/tasks/etc. it drew on as chips.
3. Pick **Break down a goal**, choose a goal, submit → a breakdown proposal appears as
   suggested actions (nothing is created automatically).
4. Ask something describing a crisis or medical situation → the reply includes a
   disclaimer recommending professional/emergency help, shown as a warning alert.
5. Firestore console → `users/{uid}/coachExchanges/{id}`, `aiUsageDaily/{date}`,
   `aiUsageMonthly/{month}`, `aiCallLogs/{id}` all populated after a call.
6. Without the Functions emulator/deployment running, submitting shows a normalized error
   in the form instead of crashing the page.

**Known limitations:**
- **Cloud Functions are not deployed** — the project remains on the Spark plan; the owner
  chose this explicitly this session (ADR-0017). The AI Coach page is live but every
  request will fail with a normalized network error until functions are deployed.
- **No system-calculated context beyond what's read directly** — the context builder reads
  raw Firestore fields defensively rather than importing client feature logic (e.g. derived
  KPI attainment, habit streaks); a future pass could enrich context with those computed
  values.
- **Quota counters can under-count by one under same-user concurrent requests** — a
  deliberate trade-off for testability over atomic `FieldValue.increment` (see ADR-0017).
- **No usage/cost UI** — `aiUsageDaily`/`aiUsageMonthly`/`aiCallLogs` are written but have
  no client viewer yet; a user hitting a quota only sees the resulting error message.
- **No conversation threading** — each exchange is independent; the model does not see
  prior exchanges as conversation history.
- **`generateGoalBreakdown`'s suggested actions are proposals only** — accepting one does
  not yet create the underlying project/milestone/task; that wiring is a future layer.

---

### Layer 14 — Weekly AI Summary — ✅ complete (2026-09-04) — scheduled Cloud Function written + unit-tested; committed + pushed + hosting deployed; **not deployed** (owner's explicit choice, ADR-0017, reaffirmed ADR-0018)

A daily `onSchedule` function that, for every active user whose local calendar day is
Monday and who hasn't opted out, evaluates their past 7 local days (goals/milestones
completed, task completion/cancellation/overdue, habit consistency, focus time, KPI
movement), asks the AI provider for lessons and suggested priorities grounded only in
those facts, and stores the result — plus a notification — per `docs/AI_ARCHITECTURE.md`
§6. A client feature surfaces the history for review, archive, and delete. Full rationale:
ADR-0018.

**Created — `functions/src/scheduled/`:**
- `weekly-summary/week-window.ts` — **pure** `localWeekday`/`localDateKey`
  (`Intl.DateTimeFormat` in the user's own timezone, not the server's), `pastWeekRange`
  (the 7 local calendar days before today, `[start, end)`), `inRange`.
- `weekly-summary/list-users.ts` — `listActiveUserIds`: paginated (bounded per page,
  ordered by document id, loops via `startAfter` until exhausted) rather than one
  unbounded read, even though the job is expected to touch every user.
- `weekly-summary/collect-week-data.ts` — bounded, defensive Admin SDK reads (same
  approach as Layer 13's `context-builder.ts`) producing goals/milestones completed, task
  classification (completed on-time/late, cancelled, still overdue — mirroring the
  Execution Tracker's 10D logic, same `updatedAt`-approximation known limitation, ADR-0016),
  habit consistency (`completed logs / (active habits × 7)`, `null` with no active habits),
  focus minutes, and KPI movement (first-to-last entry in the week; single-field
  `orderBy` + in-memory grouping avoids a composite index, same trade-off the client's own
  KPI entry list makes). **Pure** `toDateKey` duck-types a Firestore `Timestamp` (for
  `updatedAt`) alongside the plain ISO strings the client already writes for
  `dueDate`/`completedAt`.
- `weekly-summary/weekly-summary-prompt.ts` — the AI touches only two fields: `lessons`
  and `suggestedPriorities`; every other field in the stored document is a computed fact,
  never asked of the model.
- `weekly-summary/generate-weekly-summary-for-user.ts` — orchestrates one user: skips if a
  summary for that exact week already exists (idempotent against a rerun), else collects
  facts, calls the provider, validates its output, and writes both the `weeklySummaries`
  doc and a `notifications` doc (the collection's first-ever write — a minimal, forward-
  compatible shape; Layer 17 owns full delivery/consumption).
- `weekly-summary/run-weekly-summaries.ts` — the batch loop: lists active users, checks
  timezone-aware Monday + opt-in per user, generates, and collects per-user errors without
  aborting the batch.
- `generate-weekly-summary.ts` — the actual `onSchedule` trigger (daily, 01:00 UTC),
  bound to the same `ANTHROPIC_API_KEY` secret as Layer 13's callables. Re-exported from
  `functions/src/index.ts`.

**Modified:**
- `src/features/auth/schema.ts` — `userProfileSchema` gains
  `weeklySummaryEnabled: z.boolean().default(true)` (opt-out model, since no onboarding
  flow asks either way); added to `userProfileUpdateSchema`'s pick list so a future
  Settings UI (Layer 18) needs no schema change. `user-profile-repository.ts`'s
  `buildDefaultProfile` sets it explicitly.
- `functions/tests/ai/fakes.ts` — the shared fake Firestore gained real `orderBy`/
  `startAfter` support (previously `orderBy` was a documented no-op) and an `.empty` flag
  on query results, both needed by this layer's tests and now exercised by them.

**Created — `src/features/weekly-summaries/`** (client — read/archive/delete only; the
scheduled function is the sole writer): `schema.ts`, `weekly-summary-repository.ts`
(`listRecentWeeklySummaries`, `archiveWeeklySummary`, `deleteWeeklySummary` — the spec's
"review, archive, delete" in full, delete being a genuine hard `deleteDoc` since the
generic Firestore rule already allows owner delete on subcollections), `use-weekly-
summaries.ts`, `components/` (`WeeklySummaryCard` with stat tiles + lessons +
suggested-priorities + an archive button + a delete-with-confirm dialog,
`WeeklySummariesView`), `index.ts`.

**Modified — `src/features/ai-coach/components/AiCoachView.tsx`:** restructured around a
`Tabs` component — "Ask" (the existing coach flow, unchanged) and "Weekly Summaries" (the
new view) — rather than adding a new sidebar nav item, since none was reserved for this
layer and the two features are closely related.

**Tests added:** `functions/tests/scheduled/` — `week-window.test.ts` (timezone-aware
weekday resolution, including a UTC-vs-Auckland case where the two disagree; range math),
`list-users.test.ts` (pagination across pages via the newly-real fake `startAfter`),
`collect-week-data.test.ts` (every fact category, including the Firestore-Timestamp vs.
plain-string `toDateKey` duck-typing), `generate-weekly-summary-for-user.test.ts`
(persists summary + notification; idempotent against a rerun),
`run-weekly-summaries.test.ts` (opt-in/opted-out/disabled/wrong-weekday filtering; one
user's failure doesn't abort the batch) — 25 new tests. App side:
`src/features/weekly-summaries/schema.test.ts`, `components/WeeklySummariesView.test.tsx`
(empty state; card renders stats/lessons/priorities; archive; delete-with-confirm; error +
retry — hook mocked); `AiCoachView.test.tsx` gained a tab-switch test (mocking
`WeeklySummariesView` as a stub, since Radix `Tabs.Content` doesn't mount the inactive
panel); `tests/integration/weekly-summaries.test.ts` (seeds a summary with the client SDK
— since there's no client `create()` — then exercises read/archive/delete and user
scoping; **written, not executed in-session** — same emulator restriction as prior
layers). App suite: 103 files / 566 tests. Functions suite: 10 files / 58 tests, all
executed in-session.

**Verification:** app: `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (103/566) · `build` ✅
(47 routes, static export, no warnings) · `format:check` ✅. functions: `typecheck` ✅ ·
`lint` ✅ (0/0) · `test` ✅ (10/58, executed) · `build` ✅ (`tsc`) · `format:check` ✅.
`test:rules` not run — rules untouched. `test:integration` — see above.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive` — unchanged, `functions` deliberately
excluded (ADR-0015/0017/0018). Redeployed to
https://mastery-personal-mgmt-system.web.app/ ; smoke-tested `/grow/ai-coach` in a fresh
browser tab — loads (title "AI Coach · Mastery"), redirects to sign-in, no new console
errors (the pre-existing RSC-prefetch-404 cosmetic issue on `/register`/`/forgot-password`
links was confirmed present but predates this layer).

**Manual test instructions (once functions are deployed):**
1. Set a test user's `weeklySummaryEnabled: true` and `timezone` to a zone whose local day
   is currently Monday; ensure they have some goals/tasks/habits/KPI activity in the past
   week.
2. Trigger `generateWeeklySummary` manually (Cloud Scheduler console, or the Functions
   emulator's manual-trigger UI) and check Firestore for a new
   `users/{uid}/weeklySummaries/{id}` and `users/{uid}/notifications/{id}`.
3. Sign in as that user → **Grow → AI Coach → Weekly Summaries** tab → the summary appears
   with its stat tiles, lessons, and suggested priorities.
4. Click **Archive** → it disappears from the list (but the document remains, just
   `status: "archived"`). Click **Delete** on another one → confirm → it's gone for good.
5. Set `weeklySummaryEnabled: false` on a user and rerun the job → no new summary is
   created for them.
6. Rerun the job again for a user who already has this week's summary → no duplicate is
   created (idempotency check).

**Known limitations:**
- **Not deployed** — same Spark-plan / Blaze situation as Layer 13; nothing generates
  until the owner upgrades and deploys (see ADR-0017/0018's two-step turn-on).
- **No precise local-midnight firing** — the job runs once daily at a fixed UTC time and
  checks each user's local weekday; a user's summary can land anywhere in the following
  ~24h window, not at an exact local time.
- **No Settings UI to toggle `weeklySummaryEnabled`** yet — only editable by hand in
  Firestore until Layer 18. Defaults to opted-in.
- **`listActiveUserIds` reads every active user's profile once per run** — fine at today's
  scale; would need batching or a materialized "due today" index at much larger scale.
- **No conversation/history awareness** — each week's summary is generated independently,
  with no reference to prior weeks' lessons or priorities.
- **`notifications` has no delivery/consumption UI** — the collection now has real
  documents in it, but no bell icon, list, or read/unread UI exists until Layer 17.

---

### Layer 15A — Recovery Center Privacy Architecture — ✅ complete (2026-09-08) — committed + pushed + deployed live

The Recovery Center's "additional privacy gate" per `docs/RECOVERY_PRIVACY.md` §1: a PIN
set up and entered before anything else in the module renders, architected so a future
WebAuthn/biometric method is a data change, not a schema rewrite. No behavioral tracking
data exists yet — `recoveryGoals` and everything else in the spec's §4 feature list is
15B onward. Full rationale: ADR-0019.

**Created — `src/features/recovery/`:**
- `schema.ts` — `LOCK_METHODS` (currently just `"pin"`). `recoveryProfileSchema` — a
  **singleton** keyed by the user's own uid (`recoveryProfiles/{uid}`, not an auto-id):
  `lockMethod`, `pinHash`, `pinSalt`, `failedAttempts`, `lockedUntil`. Deliberately holds
  **no** behavioral fields — those belong to `recoveryGoals` (15B) per the spec's actual
  field list. `pinFormSchema` (setup: pin + confirmPin match) / `pinEntrySchema` (unlock:
  pin only), both requiring a 4–6 digit numeric PIN.
- `pin-crypto.ts` — client-only salted SHA-256 via Web Crypto `SubtleCrypto` (no new
  dependency): `generateSalt`, `hashPin`, `verifyPin`. Documented as a **privacy shield,
  not a security boundary** — the account owner already has full access via Firebase Auth
  regardless of the PIN; there is no server secret this protects.
- `recovery-lock-repository.ts` — `getRecoveryLock` (`null` = no PIN set up yet, using the
  existing owner-only Firestore rule, no rule change needed), `setRecoveryPin`,
  `verifyRecoveryPin` (client-tracked lockout: 5 wrong PINs in a row → 30s lockout, tracked
  in the same doc via normal owner-writes), `resetRecoveryPin` ("forgot PIN" — deletes the
  doc entirely, safe today since it holds nothing else).
- `use-recovery-lock.ts` — `useRecoveryLock()`: loads lock state; "unlocked" is tracked in
  `sessionStorage` (not `localStorage`), keyed by uid, with a 15-minute TTL — a new tab or
  a restarted browser always re-prompts, the more privacy-conservative default.
- `components/` — `PinSetupForm`, `PinEntryForm` (with a "Forgot your PIN?" reset-confirm
  dialog), `RecoveryGate` (the orchestrator: loading/error/setup/entry/unlocked, nothing
  behind it renders until unlocked), `RecoveryHomeView` (shown once unlocked — the
  privacy assurances made human-readable, a "Lock" button, and an honest "coming in
  15B–15F" list rather than fabricated feature content).
- `index.ts` barrel.

**Modified:**
- `src/app/(app)/recovery/page.tsx` renders `<RecoveryGate><RecoveryHomeView /></RecoveryGate>`
  (was a `ModulePlaceholder`).
- `firestore.rules` — no behavior change; added a comment flagging that a later sublayer
  adding a Cloud-Function-only-write recovery collection (relapses ~15C, coach sessions
  ~15E, accountability config ~15F) must restructure the generic owner-only wildcard to
  exclude it by name, since Firestore ORs every matching rule together — a narrower
  `match` block cannot override a broader one that's still present.

**Tests added:** `pin-crypto.test.ts` (salt uniqueness, deterministic hash for the same
salt+pin, different hash for a different salt or pin, verify accepts/rejects correctly),
`schema.test.ts` (pin form match/length/digit validation, stored record validation, unknown
lock method rejected), `components/RecoveryGate.test.tsx` (setup shown with no PIN;
submits a matching pair; entry shown with a PIN; submits to unlock; forgot-PIN reset flow;
renders children only once unlocked; error state — hook mocked),
`components/RecoveryHomeView.test.tsx` (privacy assurances + upcoming list render; Lock
button calls `lock`); `tests/rules/recovery.rules.test.ts` (a dedicated regression suite
for `recoveryProfiles` specifically, mirroring the generic subcollection tests — owner
create/read/update, cross-user read/write denied, unauthenticated denied, spoofed
`createdBy` rejected; **written, not executed in-session**); `tests/integration/
recovery-lock.test.ts` (no lock before setup; set + verify + reject wrong PIN; 5-failure
lockout then `rate-limited`; reset clears the doc and re-throws `not-found`; user scoping;
**written, not executed in-session** — same emulator restriction as prior layers). App
suite: 107 files / 585 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (107/585) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅. `test:rules` — new file written,
not executed (emulator restriction); the underlying rule is unchanged so no regression
risk from this layer. `test:integration` — see above. Functions suite unaffected (15A is
entirely client-side).

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive` — `firestore.rules` was actually
re-uploaded this time (its content changed, comment-only) though behavior is identical.
Redeployed to https://mastery-personal-mgmt-system.web.app/ ; smoke-tested `/recovery` in
a fresh browser tab — loads (title "Recovery Center · Mastery"), redirects to sign-in
(auth guard), no new console errors.

**Manual test instructions:**
1. `npm run dev`, sign in → **Recovery Center** (bottom of the sidebar, marked private).
2. First visit: **Protect the Recovery Center** setup form appears. Enter a 4–6 digit PIN
   twice (mismatched → inline error) → **Set PIN**. The module unlocks immediately and
   shows the Recovery Center home with privacy assurances and a "coming next" list.
3. Click **Lock** → back to the gate. Reload the page within 15 minutes → **still
   unlocked** (sessionStorage). Close and reopen the tab (or wait past 15 minutes) → PIN
   entry appears again.
4. Enter the wrong PIN 5 times in a row → a "too many attempts" message with a ~30s
   cooldown; entering the correct PIN after that succeeds and clears the counter.
5. On the entry screen, click **Forgot your PIN?** → confirm reset → immediately taken to
   the setup form again to choose a new PIN.
6. Firestore console → `users/{uid}/recoveryProfiles/{uid}` (note: id equals your own
   uid) with `pinHash`/`pinSalt` (never the PIN itself) and audit fields. Confirm no other
   recovery collection exists yet.
7. Confirm the Recovery Center never appears on the Dashboard, is not reachable from any
   search/command-palette content lookup, and generates no notification.

**Known limitations:**
- **PIN is a privacy shield, not encryption** — by design (ADR-0019); documented plainly
  so it's never mistaken for a stronger guarantee later.
- **No biometric/WebAuthn method yet** — `LOCK_METHODS` has one value; the schema is
  extensible but nothing beyond PIN is implemented.
- **"Forgot PIN" deletes the whole profile doc** — safe today (no other data lives there);
  must be revisited once 15B+ potentially extends this document.
- **No behavioral tracking data yet** — `recoveryGoals`, check-ins, relapses, coping
  toolkit, Recovery Coach, and accountability partner are all Layer 15B onward.
- **Rules test not executed in-session** — same Firestore-emulator restriction as every
  integration/rules test this session (JDK loopback-selector issue).

---

### Layer 15B — Recovery Data Model — ✅ complete (2026-09-08) — committed + pushed + deployed live

The `recoveryGoals` collection: one record per self-identified behavior the user chooses
to work on, with full create/list/edit/archive behind the Layer 15A PIN gate. Copy is
growth-oriented and neutral per `docs/RECOVERY_PRIVACY.md` §4 — a hard stretch is a
status, not a failure. Check-ins, relapse logs, and the coping toolkit are Layers 15C–15D;
accountability sharing is 15F. Full rationale: ADR-0020.

**Created — `src/features/recovery/`:**
- `recovery-goal-schema.ts` — `RECOVERY_GOAL_STATUSES` (`active` / `going-well` /
  `challenging` / `paused` — deliberately no "failed"/"relapsed" state; setback *events*
  are the 15C `relapses` subcollection). `recoveryGoalSchema`: `behavior`, `description`,
  `motivation`, `startDate`, `triggers[]` / `warningSigns[]` / `copingStrategies[]`
  (each ≤30 items), `supportNotes`, `faithBasedEncouragement` (opt-in boolean, consumed by
  the Recovery Coach in 15E), `recoveryStatus`. `recoveryGoalFormSchema` (newline-list
  text fields) + `recoveryGoalInputFromForm`. Kept as its own file alongside 15A's
  `schema.ts` — recovery is a six-sublayer feature and each sublayer's model stays
  independently legible.
- `recovery-goal-repository.ts` — `recoveryGoalRepository` (collection `recoveryGoals`,
  client-written under the existing generic owner-only rule) + `listActiveRecoveryGoals`.
- `use-recovery-goals.ts` — `useRecoveryGoals()`: load + create / update / archive + reload.
- `components/` — `RecoveryGoalForm` (behavior, context, motivation, started date, "Right
  now" status Select, triggers / warning-signs / coping-strategies newline textareas,
  support notes, a faith-based-encouragement `Switch`), `RecoveryGoalDialog` (with a calm
  "not medical or psychological advice" disclaimer), `RecoveryGoalCard` (status badge,
  optional faith-based badge, motivation shown as a quiet italic line, the three lists,
  edit + archive-with-confirm).
- `index.ts` barrel extended.

**Modified:**
- `src/features/recovery/components/RecoveryHomeView.tsx` — now renders the recovery
  goals list (loading / empty / error), a "New recovery goal" button, and the calm
  disclaimer, in addition to the 15A privacy-assurance card. The "coming next" list
  shrinks to 15C–15F.
- `docs/DATA_MODEL.md` annotates `recoveryGoals` (and marks the still-reserved
  subcollections with their planned sublayer).
- `tests/rules/recovery.rules.test.ts` — gained a `recoveryGoals` describe block (owner
  create/read, cross-user read/write denied, missing-audit-fields rejected).

**Tests added:** `recovery-goal-schema.test.ts` (create requires a behavior, rejects an
unknown status, allows empty lists / null start date, partial update, stored record, form
+ `recoveryGoalInputFromForm` list-splitting and blank-date-to-null); `RecoveryHomeView.test.tsx`
rewritten to also mock `useRecoveryGoals` — empty state opens the dialog, a goal card
renders its status/motivation/lists, archive-with-confirm calls `archive`, error + retry,
plus the retained privacy-assurance / disclaimer / Lock-button assertions;
`tests/integration/recovery-goals.test.ts` (create → status update → archive; user
scoping; **written, not executed in-session** — emulator restriction). App suite: 108
files / 596 tests.

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (108/596) · `build` ✅ (47
routes, static export, no warnings) · `format:check` ✅. `test:rules` / `test:integration`
— new tests written, not executed (emulator restriction); the underlying rule is unchanged
so no regression risk. Functions suite unaffected (15B is entirely client-side).

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive` — `firestore.rules` unchanged, skipped on
upload. Redeployed to https://mastery-personal-mgmt-system.web.app/ ; smoke-tested
`/recovery` in a fresh browser tab — loads (title "Recovery Center · Mastery"), redirects
to sign-in, no console errors.

**Manual test instructions:**
1. `npm run dev`, sign in → **Recovery Center**, enter your PIN (from 15A).
2. **New recovery goal** → name what you're working on, optionally add motivation, a
   start date, and newline lists of triggers / warning signs / coping strategies, pick a
   "Right now" status, toggle faith-based encouragement → **Add goal**. It appears as a
   card with its status badge and lists.
3. Edit the goal → change the status to "Challenging right now" → the badge updates to a
   warning colour with neutral wording (no shame framing).
4. Archive a goal (trash → confirm) → it leaves the active list; reload → still gone;
   Firestore shows `status: "archived"` (not deleted — hard delete is a future Cloud
   Function).
5. Firestore console → `users/{uid}/recoveryGoals/{id}` with `behavior`, the three list
   arrays, `faithBasedEncouragement`, `recoveryStatus`, and audit fields. Confirm it's
   still invisible on the dashboard, in search, and in notifications.

**Known limitations:**
- **Archive only — no hard delete yet.** An archived recovery goal physically persists;
  true deletion (with confirmation, cascading its future subcollections) is a dedicated
  Cloud Function to be built with 15C (ADR-0020, `docs/RECOVERY_PRIVACY.md` §8).
- **`recoveryStatus` is intentionally coarse** — a finer current-state signal, if users
  want one, is a check-in concern (15C), not a bigger enum here.
- **No check-ins / relapse logging / coping toolkit / Recovery Coach / accountability
  partner** — all Layer 15C onward.
- **Rules/integration tests written, not executed in-session** — same emulator
  restriction as every prior layer this session.

---

### Layer 15C — Check-ins & Tracking — ✅ complete (2026-09-05) — committed + pushed + deployed live

Daily check-ins and setback logging under a recovery goal, plus derived streak/progress
numbers and a goal detail view. Check-ins are ordinary client-written owner-only data;
setback (`relapses`) records are written **only** by a Cloud Function, with
`firestore.rules` refusing a direct client write. The setback function is written and
unit-tested but **not deployed** (Spark plan — same pattern as the Layer 13/14 AI
functions). Framing throughout is "restart from here," never failure. Full rationale:
ADR-0021.

**Created — `src/features/recovery/`:**
- `recovery-checkin-schema.ts` — `MAX_URGE = 10`, `haltSchema` (hungry / angry / lonely /
  tired booleans) + `EMPTY_HALT` / `HALT_LABEL`, `checkInFieldsSchema` (`date`,
  `stayedOnTrack`, `urgeIntensity` 0-10, `halt`, `triggersToday[]` / `copingUsed[]`,
  `reflection` ≤2000). `recoveryCheckInSchema` via `defineRecordSchema`. Form schema with
  newline-list text fields + `recoveryCheckInInputFromForm`.
- `recovery-checkin-repository.ts` — bespoke nested repo (the factory is single-level):
  `listRecentCheckIns(goalId, max=90)`, `getCheckInForDate`, `createCheckIn`,
  `updateCheckIn` over `users/{uid}/recoveryGoals/{goalId}/checkIns`, client-written under
  the generic owner-only rule.
- `recovery-progress.ts` — pure `summarizeRecoveryProgress(checkIns)` →
  `{ checkInCount, currentStreak, longestStreak, daysOnTrack, averageUrge, lastCheckInDate }`.
  Streaks derived on read, never stored (same approach as habit streaks in 10B).
- `recovery-relapse-schema.ts` — `relapseFieldsSchema` (`date`, `whatHappened` 1-2000,
  `contributingFactors[]`, `lessonsLearned`, `restartPlan`), `recoveryRelapseSchema`,
  request/result schemas for the Cloud Function, form schema +
  `recoveryRelapseRequestFromForm`.
- `recovery-relapse-client.ts` — `listRecoveryRelapses(goalId, max=50)` (client read only)
  and `recordRecoverySetback(payload)` (`httpsCallable` → `recordRecoverySetback`).
- `use-recovery-checkins.ts` — `useRecoveryCheckIns(goalId)`: load, `submitCheckIn` (upsert
  by date), memoized `progress`.
- `use-recovery-relapses.ts` — `useRecoveryRelapses(goalId)`: load, `logSetback` (calls the
  function then re-lists).
- `components/CheckInDialog.tsx` — keyed form: `Switch` "stayed on track", 0-10 urge
  `Select`, four HALT `Checkbox`es, triggers / coping newline textareas, reflection.
- `components/RelapseLogDialog.tsx` — leads with "A setback is part of the process, not the
  end of it"; submit is "Save & restart".
- `components/RecoveryGoalDetailView.tsx` — back to list, "Check in" + "Log a setback",
  progress `Stat` grid (current streak / longest streak / days on track / avg. urge),
  recent check-ins list (On track / Hard day badge, urge, HALT), setbacks list.

**Created — `functions/`:**
- `src/recovery/record-recovery-setback.ts` — `handleRecordRecoverySetback(request, db)`
  (injectable `db` for tests): `requireAuth` → `validateRequest` → verify the goal exists →
  write `users/{uid}/recoveryGoals/{goalId}/relapses/{id}` via the Admin SDK (audit fields,
  server timestamps) → `validateResponse({ relapseId })`. Exported as the `recordRecoverySetback`
  onCall (`DEFAULT_RUNTIME_OPTIONS`, `toHttpsError`). **Not deployed.**

**Modified:**
- `firestore.rules` — added `isServerMediatedRecoveryWrite(document)`
  (`string(document).matches('(^|.*/)relapses/[^/]+$')`) and `&& !isServerMediatedRecoveryWrite(document)`
  on the recursive-wildcard create / update / delete. Read is unchanged (owner reads its
  relapses). Coach sessions (15E) / accountability (15F) will extend the same guard.
- `functions/src/index.ts` — exports `recordRecoverySetback`; JSDoc updated ("written and
  tested through Layer 15C; NOT deployed").
- `functions/src/recovery/README.md` — documents the setback function.
- `src/features/recovery/components/RecoveryGoalCard.tsx` — added an "Open" button
  (`onOpen`) and switched the archive control to an icon button.
- `src/features/recovery/components/RecoveryHomeView.tsx` — opens the goal detail view when
  a goal is selected; goals list extracted to a `RecoveryGoalsList` helper.
- `src/features/recovery/index.ts` — barrel extended with all 15C exports.
- `docs/DATA_MODEL.md` — `checkIns` and `relapses` described (client-written vs.
  Cloud-Function-mediated).

**Tests added:** `functions/tests/recovery/record-recovery-setback.test.ts` (6:
unauthenticated, invalid payload, goal-not-found, writes + returns id, defaults the
optional fields, wraps errors as `HttpsError`); `recovery-progress.test.ts` (4);
`recovery-checkin-schema.test.ts` (~5); `recovery-relapse-schema.test.ts` (~4);
`components/RecoveryGoalDetailView.test.tsx` (5); `RecoveryHomeView.test.tsx` gained an
"opens the goal detail view" test; `tests/integration/recovery-checkins.test.ts` (create /
find-by-date / update / list, user scoping, direct relapse client write rejected —
**written, not executed in-session**); `tests/rules/recovery.rules.test.ts` gained a
`recoveryGoals subcollections — Layer 15C` block (owner check-in create/read allowed,
direct relapse client write REJECTED, owner relapse READ allowed after an Admin-SDK seed,
cross-user denied — **written, not executed in-session**).

**Verification:** app `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (112 files / 615 tests)
· `build` ✅ (static export, no warnings) · `format:check` ✅. functions `typecheck` ✅ ·
`lint` ✅ · `test` ✅ (11 files / 64 tests) · `build` ✅. `test:rules` / `test:integration`
— new tests written, not executed (emulator restriction); `firestore.rules` compile-checked
at deploy.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive` — `firestore.rules` **changed** this layer,
re-uploaded and compiled clean. Redeployed to https://mastery-personal-mgmt-system.web.app/ .

**Manual test instructions:**
1. `npm run dev`, sign in → **Recovery Center**, enter your PIN, open a recovery goal
   (**Open** on its card).
2. **Check in** → set "stayed on track", pick an urge level, tick any HALT factors, add
   triggers / coping used / a reflection → **Save check-in**. The progress grid updates
   (current streak, days on track, avg. urge) and the entry appears under "Recent
   check-ins".
3. Check in again for the same date → it updates the existing entry, not a duplicate.
4. Check in for several consecutive days with "stayed on track" on → current streak counts
   up; toggle one day off → the streak resets from the most recent on-track day.
5. **Log a setback** → note what happened, contributing factors, a restart plan →
   **Save & restart**. **In production this currently fails** with a callable-function
   error — `recordRecoverySetback` is not deployed (Spark plan). Against the emulator
   (`firebase emulators:start` + functions) it writes `users/{uid}/recoveryGoals/{goalId}/relapses/{id}`
   and the entry shows under "Setbacks".
6. Firestore console → try to write `users/{uid}/recoveryGoals/{goalId}/relapses/x`
   directly from a client SDK → **permission denied** (only the Cloud Function may write
   it); a `checkIns` doc writes fine.

**Known limitations:**
- **`recordRecoverySetback` is not deployed** — the project is on the Spark plan and no
  Cloud Function is shipped. "Log a setback" throws in production until the owner upgrades
  to Blaze and runs `firebase deploy --only functions`. Check-ins work fully (client-only).
- **No hard delete** — archived goals and their check-ins / relapses physically persist;
  the cascading deletion Cloud Function is still deferred (ADR-0020/0021).
- **Progress is derived from the last 90 check-ins** — streaks longer than that window are
  not represented; a stored aggregate is a later concern.
- **No coping toolkit / Recovery Coach / accountability partner** — Layers 15D–15F.
- **Rules / integration tests written, not executed in-session** — emulator restriction.

---

### Layer 15D — Coping Toolkit — ✅ complete (2026-09-05) — committed + pushed + deployed live

A per-goal **coping toolkit**: a list of coping actions the user keeps ready for when an
urge shows up, added freely or one-tap from a built-in suggestion library (evidence-informed
behavioral prompts; faith-based options only when the goal opts in). Surfaces as a section
in the goal detail view. Client-written under the existing owner-only rule — no Cloud
Function, no `firestore.rules` change, no new dependency. Full rationale: ADR-0022.

**Created — `src/features/recovery/`:**
- `recovery-coping-schema.ts` — `COPING_CATEGORIES`
  (`grounding` / `physical` / `social` / `cognitive` / `faith` / `other`) + label map;
  `recoveryCopingActionSchema` (`title`, `category`, `howTo`) via `defineRecordSchema`;
  create / update / form schemas; `COPING_SUGGESTIONS` starter library (11 prompts incl. 3
  `faith`) + `copingInputFromSuggestion`.
- `recovery-coping-repository.ts` — bespoke nested repo over
  `users/{uid}/recoveryGoals/{goalId}/copingActions`: `listCopingActions` (active only,
  `createdAt asc`), `createCopingAction`, `updateCopingAction`, `archiveCopingAction`
  (reversible `status: "archived"`).
- `use-recovery-coping.ts` — `useRecoveryCoping(goalId)`: load + `addCopingAction` /
  `addSuggestion` / `editCopingAction` / `removeCopingAction` + reload.
- `components/CopingActionDialog.tsx` — add/edit form (title, category `Select`, howTo
  `Textarea`).
- `components/CopingToolkitSection.tsx` — the toolkit section: list of coping cards
  (category badge, title, howTo, remove), "Add your own" button, and a "Quick add" chip
  row of unused suggestions (faith entries filtered by the goal's `faithBasedEncouragement`).

**Modified:**
- `src/features/recovery/components/RecoveryGoalDetailView.tsx` — mounts
  `<CopingToolkitSection>` between the check-ins and setbacks sections.
- `src/features/recovery/components/RecoveryGoalDetailView.test.tsx` — mocks
  `../use-recovery-coping`.
- `src/features/recovery/components/RecoveryHomeView.tsx` — "Coming next" list drops to
  15E–15F.
- `src/features/recovery/index.ts` — barrel extended.
- `docs/DATA_MODEL.md` — `copingActions` described; `docs/DECISIONS.md` — ADR-0022;
  `docs/RECOVERY_PRIVACY.md` — Layer 15D status note.

**Tests added:** `recovery-coping-schema.test.ts` (create accept/reject, unknown category,
empty howTo, stored record, every suggestion is a valid input, a faith option exists);
`components/CopingToolkitSection.test.tsx` (empty state + quick-add, faith suggestions
hidden unless opted in, quick-add chip calls the hook, a saved action drops from quick-add
and removes on click, error + retry); `tests/integration/recovery-coping.test.ts`
(create / update / list / archive, user scoping — **written, not executed in-session**);
`tests/rules/recovery.rules.test.ts` gained a `recoveryGoals copingActions — Layer 15D`
block (owner create/read/archive allowed, cross-user denied — **written, not executed
in-session**).

**Verification:** `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (114 files / 626 tests) ·
`build` ✅ (static export, no warnings) · `format:check` ✅. functions suite unchanged
(15D is entirely client-side). `test:rules` / `test:integration` — new tests written, not
executed (emulator restriction); rules unchanged so no regression risk.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive` — `firestore.rules` unchanged, skipped on
upload. Redeployed to https://mastery-personal-mgmt-system.web.app/ ; smoke-tested
`/recovery` in a fresh tab — redirects to sign-in, no new console errors.

**Manual test instructions:**
1. `npm run dev`, sign in → **Recovery Center**, enter your PIN, **Open** a recovery goal.
2. Scroll to **Coping toolkit**. Tap a **Quick add** chip (e.g. "Box breathing") → it
   appears as a card and disappears from the quick-add row.
3. **Add your own** → name it, pick a type, add a short "how it helps" note → **Add to
   toolkit**.
4. Remove a card (the ✕) → it leaves the list; reload → still gone; Firestore shows
   `status: "archived"` on `users/{uid}/recoveryGoals/{goalId}/copingActions/{id}` (not
   deleted).
5. On a goal with faith-based encouragement **on**, the quick-add row includes "Prayer or
   stillness" / "Gratitude list"; turn it off (edit the goal) and those disappear.
6. Confirm the toolkit never appears on the dashboard, in search, or in notifications.

**Known limitations:**
- **No hard delete** — archived coping actions physically persist (same deferred cascading
  Cloud Function as the rest of Recovery, ADR-0020/0021).
- **Suggestion library is a static in-repo array** — editing prompts is a code change, and
  they're English-only until i18n (Layer 18).
- **Not wired into the check-in form** — the 15C `copingUsed` free-text field is unchanged;
  selecting toolkit items there is possible future polish, not part of 15D.
- **No Recovery Coach / accountability partner** — Layers 15E–15F.
- **Rules / integration tests written, not executed in-session** — emulator restriction.

---

### Layer 15E — Recovery Coach — ✅ complete (2026-09-05) — committed + pushed + deployed live

A **fully isolated** AI Recovery Coach per `docs/RECOVERY_PRIVACY.md` §5 and
`docs/AI_ARCHITECTURE.md` §7 — separate endpoint, system prompt, context builder, and
conversation storage, sharing only the per-user AI spend budget. Goal-scoped: it lives in
the recovery goal detail view. The Cloud Function is written and unit-tested but **not
deployed** (Spark plan — same as the Layer 13/14 AI functions and 15C's setback function).
Full rationale: ADR-0023.

**Created — `functions/`:**
- `src/recovery/recovery-coach-context.ts` — `buildRecoveryCoachContext(db, uid, goalId)`:
  reads **only** `recoveryGoals/{goalId}` + its `checkIns` (7) / `relapses` (3) /
  `copingActions` (30), returns `{ text, refs, faithBased, goalBehavior }` or `null` if the
  goal isn't the caller's. Never touches `goals` / `journalEntries` / `tasks`.
- `src/recovery/recovery-coach-query.ts` — `RECOVERY_COACH_SYSTEM` (its own supportive,
  non-judgmental prompt: immediate safe next step, explicit crisis → professional/emergency
  help clause, no diagnosis, no coercive language, structured JSON). `handleRecoveryCoachQuery(request, { db, provider, now? })`:
  `requireAuth` → validate `{ goalId, message }` → `assertWithinQuota` → build context (404
  if the goal is missing) → provider call with an explicit faith-based guidance line
  (opted-in vs not) → `validateResponse` → `bumpUsageCounters` (shared budget only) →
  persist `users/{uid}/recoveryCoachSessions/{id}` with per-call token/latency/cost metrics
  on the doc → return `{ reply, suggestedSteps, disclaimers, influencedBy, sessionId, createdAt }`.
  Exported as the `recoveryCoachQuery` onCall (`ANTHROPIC_API_KEY` secret, 60s). **Not
  deployed.**

**Modified — `functions/`:**
- `src/ai/shared/quota.ts` — extracted `bumpUsageCounters(db, uid, totalTokens, now)` (day +
  month rollups) from `recordUsage`; `recordUsage` now calls it and still writes the
  `aiCallLogs` record for the **general** endpoints. The Recovery Coach calls only
  `bumpUsageCounters`, so nothing recovery-derived lands in `aiCallLogs`.
- `src/index.ts` — exports `recoveryCoachQuery`; JSDoc updated (through Layer 15E).
- `src/recovery/README.md` — documents the coach endpoint + context builder.

**Created — `src/features/recovery/`:**
- `recovery-coach-schema.ts` — request / callable-result / stored-session (`defineRecordSchema`) /
  form schemas.
- `recovery-coach-client.ts` — `askRecoveryCoach(payload)` (`httpsCallable("recoveryCoachQuery")`),
  `listRecoveryCoachSessions(goalId)` (client read, filters to the goal in JS to avoid a
  composite index).
- `use-recovery-coach.ts` — `useRecoveryCoach(goalId)`: load sessions, `ask(message)`,
  `asking` / `askError`, reload.
- `components/RecoveryCoachPanel.tsx` — the goal-scoped panel: isolation note, message box,
  "Ask for a next step", recent replies with steps + disclaimers, loading/empty/error.

**Modified — `src/`:**
- `firestore.rules` — `isServerMediatedRecoveryWrite(collection, document)` now also returns
  true for `collection == 'recoveryCoachSessions'` (top-level, so not matchable by the
  `.../relapses/{id}` regex); the three write rules pass `collection` through. Reads
  unchanged.
- `components/RecoveryGoalDetailView.tsx` — mounts `<RecoveryCoachPanel>` after the coping
  toolkit; its test mocks `../use-recovery-coach`.
- `components/RecoveryHomeView.tsx` (+ test) — "Coming next" drops to just the accountability
  partner (15F).
- `src/features/recovery/index.ts` — barrel extended.
- `docs/DATA_MODEL.md`, `docs/AI_ARCHITECTURE.md` §7, `docs/RECOVERY_PRIVACY.md` updated;
  `docs/DECISIONS.md` — ADR-0023.

**Tests added:** `functions/tests/recovery/recovery-coach-query.test.ts` (8: unauth, no
message, no goalId, goal-not-found, quota exceeded, happy path — session written with
metrics + shared counters bumped + **no `aiCallLogs`**, faith-off prompt line, faith-on
prompt line, malformed reply → HttpsError + counter still bumped);
`functions/tests/recovery/recovery-coach-context.test.ts` (3: null for a missing goal;
summarizes goal/check-ins/setbacks/coping and skips archived; reads **no** general
collections); `functions/tests/ai/quota.test.ts` +3 (`bumpUsageCounters` creates / adds /
writes no log); `src/features/recovery/recovery-coach-schema.test.ts`;
`components/RecoveryCoachPanel.test.tsx` (5); `tests/integration/recovery-coach.test.ts`
(direct client write rejected; read path resolves — **written, not executed in-session**);
`tests/rules/recovery.rules.test.ts` gained a `recoveryCoachSessions — Layer 15E` block
(direct client write REJECTED, owner READ allowed after an Admin seed, cross-user denied —
**written, not executed in-session**).

**Verification:** app `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (116 files / 636) ·
`build` ✅ (static export, no warnings) · `format:check` ✅. functions `typecheck` ✅ ·
`lint` ✅ · `test` ✅ (13 files / 79) · `build` ✅. `test:rules` / `test:integration` — new
tests written, not executed (emulator restriction); `firestore.rules` compile-checked at
deploy.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive` — `firestore.rules` **changed** this layer,
re-uploaded and compiled clean. Redeployed to https://mastery-personal-mgmt-system.web.app/ ;
smoke-tested `/recovery` in a fresh tab — redirects to sign-in, no new console errors.

**Manual test instructions:**
1. `npm run dev`, sign in → **Recovery Center**, PIN, **Open** a recovery goal.
2. Scroll to **Recovery Coach**. Type what's going on and **Ask for a next step**. **In
   production this currently fails** with a callable-function error — `recoveryCoachQuery`
   is not deployed (Spark plan). Against the emulator (`firebase emulators:start` +
   functions) it returns a reply with 0-N suggested steps and any disclaimers, and the
   exchange appears in the list below.
3. Repeat — history accumulates (most recent first, capped at 5 shown).
4. On a goal with faith-based encouragement **on**, replies may include a brief faith-based
   line; with it **off** they never do.
5. Firestore console → try to write `users/{uid}/recoveryCoachSessions/x` directly from a
   client SDK → **permission denied** (only the Cloud Function may write it); reading your
   own sessions works.
6. Confirm the coach and its history never appear on the dashboard, in search, or in
   notifications, and that the general AI Coach (`/grow/ai-coach`) shows none of this.

**Known limitations:**
- **`recoveryCoachQuery` is not deployed** — Spark plan, no Cloud Function shipped. "Ask
  for a next step" throws in production until the owner upgrades to Blaze and runs
  `firebase deploy --only functions`.
- **Goal-scoped only** — there is no general "recovery, no specific goal" coach
  conversation; the request requires a `goalId`.
- **Shared spend budget** — a heavy Recovery Coach day can exhaust the same per-user AI
  quota the general coach uses (by design — one user, one cap).
- **No accountability partner** — Layer 15F.
- **Rules / integration tests written, not executed in-session** — emulator restriction.

---

### Layer 15F — Accountability Partner — ✅ complete (2026-09-05) — committed + pushed + deployed live

The final Recovery Center sublayer. Opt-in only: the owner shares a **narrow slice** of one
recovery goal with a trusted person under one of five permission scopes, with an optional
expiry and one-tap revocation. Per `docs/RECOVERY_PRIVACY.md` §3, grant config is
Cloud-Function-mediated and **the partner never touches Firestore** — they call an
authorized function that returns only the scoped projection. Both Cloud Functions are
written and unit-tested but **not deployed** (Spark plan). Full rationale: ADR-0024.
**Layer 15 (15A–15F) is now complete.**

**Created — `functions/`:**
- `src/recovery/configure-accountability-partner.ts` — `configureAccountabilityPartner`
  onCall (`op: "create" | "update" | "revoke"`): the only writer of
  `users/{uid}/recoveryAccountabilityPartners/{id}`. `create` verifies the goal is the
  caller's; `update` / `revoke` verify the grant is. `revoke` stamps `revokedAt`.
- `src/recovery/accountability-projection.ts` — `buildAccountabilityProjection(db, ownerUid,
  grant, now)`: reads only the shared goal + its check-ins / relapses, recomputes the
  streak inline, and returns an allowlist projection — each scope fills only its own fields
  (`streak-only` → streak; `status-only` → status; `check-in-completed` → checked-in-today +
  last date; `selected-summary` → status + streak + days-on-track + last date;
  `custom-limited-access` → only the ticked field subset). A bare `setbackCount` (a number,
  never narrative) only when the grant opts in. Never returns reflections, HALT, triggers,
  setback text, coping actions, or coach sessions.
- `src/recovery/get-accountability-projection.ts` — `getAccountabilityProjection` onCall:
  the only way a partner sees anything. Requires the caller's **verified** email to match
  an **active, unexpired, unrevoked** grant; returns nothing but the projection.

**Modified — `functions/`:**
- `src/index.ts` — exports both functions; JSDoc through Layer 15F.
- `src/recovery/README.md` — documents both.
- `tests/ai/fakes.ts` — the fake Firestore doc ref gained `update()` (merge semantics) —
  first recovery function to use `ref.update()` over `set()`.

**Created — `src/features/recovery/`:**
- `recovery-accountability-schema.ts` — scopes + labels + descriptions, custom-field
  vocabulary, grant record schema, the `configure*` discriminated-union request schema, the
  projection result schema, and the owner form schema.
- `recovery-accountability-client.ts` — `configureAccountabilityPartner` (callable),
  `listAccountabilityPartners(goalId)` (owner read of own grants), `getAccountabilityProjection`
  (partner callable).
- `use-recovery-accountability.ts` — owner side: load grants, `configure` (create / update /
  revoke), `saving` / `saveError`.
- `use-accountability-projection.ts` — partner side: load the one scoped projection.
- `components/AccountabilityPartnerDialog.tsx` — the grant form (email, label, scope
  `Select` with a live description, custom-field checkboxes, a setback-count switch, a
  reminders switch, an expiry date).
- `components/AccountabilitySection.tsx` — the section in the goal detail view: partner
  list (label, email, scope badge, expiry, revoked state, the shareable
  `/recovery/partner?owner=…&grant=…` link), "Share with a partner" → dialog, revoke.
- `components/PartnerProjectionView.tsx` (+ `PartnerProjectionPage` route wrapper) — the
  partner-facing card: renders only the fields present in the projection, plus a "no notes,
  triggers, setback details, or coach conversations" note.

**Created — `src/app/`:**
- `(app)/recovery/partner/page.tsx` — the partner route, **outside** the Recovery Center
  PIN gate (the viewer is the partner, not the owner). Still auth-gated by the `(app)`
  layout; the function re-checks the verified email.

**Modified — `src/`:**
- `firestore.rules` — `isServerMediatedRecoveryWrite` now also returns true for
  `collection == 'recoveryAccountabilityPartners'`. Owner reads unchanged.
- `components/RecoveryGoalDetailView.tsx` — mounts `<AccountabilitySection>` after the
  Recovery Coach; its test stubs the section.
- `components/RecoveryHomeView.tsx` (+ test) — the "Coming next" block is removed (Layer 15
  is done).
- `src/features/recovery/index.ts` — barrel extended.
- `docs/DATA_MODEL.md`, `docs/RECOVERY_PRIVACY.md` §6 status; `docs/DECISIONS.md` —
  ADR-0024.

**Tests added:** `functions/tests/recovery/configure-accountability-partner.test.ts` (7:
unauth, invalid payload, goal-not-found on create, create normalizes email + null
`revokedAt`, update changes scope/label, revoke stamps `revokedAt`, update-missing →
HttpsError); `get-accountability-projection.test.ts` (9: unauth, unverified email denied,
email mismatch denied, revoked denied, expired denied, `streak-only` shape,
`selected-summary` shape + no setback count unless opted in, opted-in setback count,
`custom-limited-access` only ticked fields); `accountability-projection.test.ts` (3: null
for a missing goal, streak breaks on the most recent hard day, no fields outside scope);
`src/features/recovery/recovery-accountability-schema.test.ts`;
`components/AccountabilitySection.test.tsx` (5); `components/PartnerProjectionView.test.tsx`
(2); `tests/integration/recovery-accountability.test.ts` (direct client write rejected;
owner list resolves — **written, not executed in-session**); `tests/rules/recovery.rules.test.ts`
gained a `recoveryAccountabilityPartners — Layer 15F` block (direct client write REJECTED,
owner READ allowed after an Admin seed, cross-user read denied — **written, not executed
in-session**).

**Verification:** app `typecheck` ✅ · `lint` ✅ (0/0) · `test` ✅ (119 files / ~648) ·
`build` ✅ (48 routes, static export, no warnings) · `format:check` ✅. functions
`typecheck` ✅ · `lint` ✅ · `test` ✅ (16 files / 98) · `build` ✅. `test:rules` /
`test:integration` — new tests written, not executed (emulator restriction);
`firestore.rules` compile-checked at deploy.

**Deploy:** `NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app npm run build`
then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project
mastery-personal-mgmt-system --non-interactive` — `firestore.rules` **changed** this layer,
re-uploaded and compiled clean. Redeployed to https://mastery-personal-mgmt-system.web.app/ ;
smoke-tested `/recovery` in a fresh tab — redirects to sign-in, no new console errors.

**Manual test instructions:**
1. `npm run dev`, sign in → **Recovery Center**, PIN, **Open** a recovery goal.
2. Scroll to **Accountability partner** → **Share with a partner** → enter a partner's
   email, a label, pick a scope (the description updates live), optionally tick custom
   fields / a setback count / an expiry → **Share with them**. **In production this
   currently fails** — `configureAccountabilityPartner` is not deployed (Spark plan).
   Against the emulator (`firebase emulators:start` + functions) the grant appears in the
   list with a `/recovery/partner?owner=…&grant=…` link.
3. As the partner (a second signed-in Mastery account whose verified email matches), open
   that link → **Shared with you** shows only the fields the scope permits, nothing else.
4. Back as the owner, **Edit** the grant to a narrower scope, or revoke it (the person
   icon) → reload the partner link → it now shows "This shared view isn't available".
5. Firestore console → try to write `users/{uid}/recoveryAccountabilityPartners/x` directly
   from a client SDK → **permission denied**; reading your own grants works.
6. Confirm none of this appears on the dashboard, in search, or in notifications.

**Known limitations:**
- **Both Cloud Functions are not deployed** — Spark plan. Configuring a partner or viewing
  a projection throws in production until the owner upgrades to Blaze and runs `firebase
  deploy --only functions`.
- **The partner must be a Mastery user with a verified email** on the address the owner
  entered — there is no invite flow for someone without an account.
- **Reminder delivery is Layer 17** — `sendCheckInReminders` is stored but nothing sends a
  reminder yet.
- **No hard delete** — a revoked grant persists (revoked, inert) until the deferred
  cascading deletion Cloud Function.
- **Rules / integration tests written, not executed in-session** — emulator restriction.

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
