# Mastery — Build Progress

Living build tracker. Updated at the end of every layer.

---

## Snapshot

| Field | Value |
|---|---|
| **Current layer** | Layer 3 — Firebase Foundation (complete) |
| **Next approved layer** | Layer 4 — Authentication & User Isolation |
| **Completed layers** | Layer 0, Layer 1, Layer 2, Layer 3 |
| **In-progress work** | none |
| **Test status** | ✅ app: `vitest run` — 12 files, 53 tests (env, errors, firebase-error, timestamps, converters, validation, cn, theme, Button, FormField, Badge, EmptyState). ✅ rules: `npm run test:rules` — 2 files, 6 tests (Firestore + Storage deny-all, emulator). ✅ functions: 1 file, 5 tests (validateRequest / validateResponse / toHttpsError). |
| **Build status** | ✅ app: `typecheck`, `lint`, `test`, `build`, `format:check`. ✅ functions: `typecheck`, `lint`, `build` (emits `functions/lib`), `test`. Routes unchanged: `/`, `/_not-found`, `/api/health`, `/design-system`. |
| **Deployment status** | Not deployed. Firebase project **`mastery-personal-mgmt-system`** created (ADR-0008) with a registered Web app; config in `.env.local`. Emulator Suite wired (auth/firestore/storage/functions/ui). Frontend target: Firebase App Hosting. |
| **Repository** | `origin` → github.com/Timmitchel1919-sys/Mastery-personal-management-system.git · single `main` branch |
| **Stack (installed)** | Next 16.3.3 · React 19.2.8 · TypeScript 5.9 (strict) · Tailwind CSS 4.1 · ESLint 9.39 (flat) · Zod 4.1 · Vitest 4.1 + Testing Library · Prettier 3.9 · Radix UI · class-variance-authority · lucide-react · firebase 12.18 · firebase-admin 14.3 · firebase-functions 7.3 · firebase-tools 15.28 · @firebase/rules-unit-testing 5 |

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
