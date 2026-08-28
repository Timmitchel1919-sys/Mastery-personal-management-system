# Changelog

All notable changes to Mastery are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project builds in numbered
layers; each entry maps to a layer.

## [Unreleased]

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
