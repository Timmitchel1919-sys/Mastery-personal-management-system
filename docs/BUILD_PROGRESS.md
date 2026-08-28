# Mastery — Build Progress

Living build tracker. Updated at the end of every layer.

---

## Snapshot

| Field | Value |
|---|---|
| **Current layer** | Layer 2 — Mastery Design System (complete) |
| **Next approved layer** | Layer 3 — Firebase Foundation ⚠️ **needs the Firebase project created + project id confirmed by the owner first** (ADR-0004) |
| **Completed layers** | Layer 0, Layer 1, Layer 2 |
| **In-progress work** | none |
| **Test status** | ✅ `vitest run` — 9 files, 38 tests passing (env, errors, validation, cn, theme, Button, FormField, Badge, EmptyState) |
| **Build status** | ✅ `typecheck`, `lint`, `test`, `build`, `format:check` all pass. Routes: `/`, `/_not-found`, `/api/health`, `/design-system`. |
| **Deployment status** | Not deployed. Firebase project not created (needed at Layer 3). Frontend target: Firebase App Hosting. |
| **Repository** | `origin` → github.com/Timmitchel1919-sys/Mastery-personal-management-system.git · single `main` branch |
| **Stack (installed)** | Next 16.3.3 · React 19.2.8 · TypeScript 5.9 (strict) · Tailwind CSS 4.1 · ESLint 9.39 (flat) · Zod 4.1 · Vitest 4.1 + Testing Library · Prettier 3.9 · Radix UI · class-variance-authority · lucide-react |

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
