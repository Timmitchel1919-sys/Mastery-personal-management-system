# Mastery — Performance, Cost & Accessibility

Layer 23 review. This is the standing record of how Mastery keeps its bundle, its
Firestore reads, its Cloud Function cost, and its accessibility in check, plus the
budgets CI enforces. Update it whenever a budget moves or a new heavy surface lands.

Related: `docs/ARCHITECTURE.md` §10 (guardrails), `docs/AI_ARCHITECTURE.md` §Cost,
`docs/TESTING_STRATEGY.md` §4b/§4c (a11y + coverage), ADR-0032.

---

## 1. Shape of the app

Static export (`output: "export"`, ADR-0015) → a client-side SPA on Firebase Hosting
(Spark plan). No server runtime, so "performance" here is: **initial JS**, **route
splitting**, **Firestore read volume**, and **Cloud Function cold-start / token cost**.
Core Web Vitals are dominated by the first-load JS parse and the Firebase Auth round-trip.

---

## 2. Bundle budget (enforced)

`scripts/analyze-bundle.mjs` walks `out/_next/static`, prints every JS/CSS asset by gzip
size, and fails the build if any budget is exceeded. It runs:

- locally — `npm run analyze` (after a build) or `npm run build:analyze`
- in CI — the `app` job, right after `npm run build` (ADR-0031, ADR-0032)

| Budget | Value | Today | Headroom |
|---|---|---|---|
| Total JS, gzip (sum of all chunks) | **900 KiB** | ~801 KiB | ~11% |
| Total JS, raw | **3200 KiB** | ~2760 KiB | ~16% |
| Largest single chunk, gzip | **240 KiB** | ~192 KiB | ~25% |

These are a **ratchet, not a target** — set just above the real numbers to catch an
accidental heavy dependency (a date library, a charting lib, a second icon set), not to
force hand-optimisation. Raising a budget needs a line in this table and a reason.

**What's in the big chunks** (gzip): the largest (~192 KiB) is the Firestore SDK;
`firebase/auth` + `firebase/app` are the next tier; then React + Next runtime; then
`next-intl` + the bundled `en`/`nl` message catalogues. Nothing app-authored is close.

---

## 3. Code splitting

- **Route level** — automatic. Every `src/app/**/page.tsx` is its own entry; a visit to
  `/plan/goals` never downloads `/focus/calendar`.
- **Firebase SDK** — already fully modular (`firebase/app`, `/auth`, `/firestore`,
  `/functions`, `/storage`); `getFirebaseClient()` is lazy (first call constructs the
  singleton). `firebase-admin` is `server-only` and imported by nothing in the app graph.
- **Command palette** (`cmdk`) — `src/components/layout/app-shell.tsx` mounts it through
  `next/dynamic` and only after the first ⌘K/Ctrl-K, so `cmdk` is a separate chunk that
  most sessions never fetch. The shortcut handler lives in `ShellProvider`, so the key
  still works before the palette is mounted.
- **Charts** — there is no charting dependency. `src/components/shared/Sparkline.tsx` is a
  ~40-line dependency-free SVG and covers every trend view (KPIs, Life Score history).
- **Reports / print** — `ReportDocument` renders inline and prints via `window.print()`
  and an `@media print` block; no PDF library is shipped.

### Open recommendations (not done in Layer 23 — would need touching every repo)

- Defer `firebase/functions` and `firebase/storage` out of `getFirebaseClient()` until the
  first AI call / first upload. Saves ~15–25 KiB gzip off the first load. Deferred because
  it changes the shape of every repository and the AI hooks.
- A real build-id strategy so `_next/static` can go back to `immutable` caching (see
  `docs/DEPLOYMENT.md` §2a — Turbopack export filenames aren't reliably content-hashed).

---

## 4. Firestore read discipline

- **No listeners.** `grep -r onSnapshot src/` is empty — every read is one-time. Real-time
  was never a stated requirement (`CLAUDE.md` §3).
- **Pagination everywhere.** `src/lib/repository/pagination.ts` — `DEFAULT_PAGE_SIZE = 20`,
  `MAX_PAGE_SIZE = 100`, `clampLimit()` enforced in `firestore-repository.ts` and in
  `pageQuerySchema`. Nested subcollection repos take an explicit page size.
- **No startup bulk load.** The shell fetches only the auth profile. Each feature hook
  fetches its own page on mount; the dashboard uses aggregation hooks, not per-widget
  fan-out (`CLAUDE.md` §3, ADR from Layer 7).
- **Indexes** are declared in `firestore.indexes.json` and deployed with every release.

---

## 5. Cloud Function cost & cold start

Functions are **written and unit-tested, not deployed** (Spark plan — ADR-0017/0021/0023).
When they ship on Blaze:

- **Runtime** — `DEFAULT_RUNTIME_OPTIONS` (`functions/src/config/region.ts`): `256MiB`,
  `timeoutSeconds: 30`, region `europe-west1` (co-located with the users). AI callables
  raise the timeout to 60s and attach the `ANTHROPIC_API_KEY` secret.
- **Cold start** — v2 / Cloud Run; keep `minInstances: 0` on Spark→early-Blaze (cost over
  latency); revisit `minInstances: 1` for `masteryCoachQuery` only if p95 first-token
  latency is a complaint. No function pulls a heavy dep at module load (the Anthropic SDK
  is imported lazily in the provider).
- **Token cost** — `functions/src/ai/shared/`: `MAX_TOKENS_PER_DAY = 200_000`,
  `MAX_TOKENS_PER_MONTH = 2_000_000` per user (`quota.ts`); `max_tokens` capped per
  request; every call priced (`$3/1M` in, `$15/1M` out) and logged with tokens/latency/
  outcome. Recovery Coach shares the per-user spend ceiling but writes its metrics to the
  session doc, never to `aiCallLogs` (privacy — `docs/AI_ARCHITECTURE.md`).

---

## 6. Core Web Vitals

No analytics sink exists on the Spark plan, so CWV is not collected in production yet.
Plan: add a `web-vitals` reporter that POSTs to a `logWebVitals` callable once the project
is on Blaze (tracked in `docs/DEPLOYMENT.md` §6). Until then, verify with Lighthouse
against the live URL per release. Structural safeguards already in place: font is the
system stack (no web-font CLS), `images.unoptimized` + `max-width:100%` (no layout shift
from images), the theme is applied before paint (Layer 18, no flash), and the offline
banner is `position: fixed` (no reflow when it appears).

---

## 7. Accessibility

Baseline (Layers 2, 5, 18): semantic landmarks, a skip link, visible `:focus-visible`
rings, a global `prefers-reduced-motion` block in `globals.css`, `next-intl` for every
string, `<html lang>` synced to the active locale.

Automated (`src/test/a11y.test.tsx`, runs in `npm test` — `axe-core`, `color-contrast`
and `region` disabled because jsdom can't compute either): shared states, offline banner,
sidebar nav, a rendered report, **the `FormField` label/description/error wiring, and the
`Sparkline` accessible name** (added in Layer 23). e2e keyboard/focus paths run in
Playwright (`tests/e2e/`, CI).

Known gap: colour-contrast is only checked by eye against the design tokens + Lighthouse,
not in CI (jsdom limitation). Both themes were checked at the token level in Layer 18.

---

## 8. What Layer 23 changed

- `scripts/analyze-bundle.mjs` + `npm run analyze` / `build:analyze`; the `app` CI job
  now fails on a bundle-budget breach.
- `tests/unit/bundle-budget.test.ts` (script logic + "real build within budget" when
  `out/` is present); `tests/unit/ci-workflow.test.ts` asserts the CI `analyze` step.
- `app-shell.tsx` — command palette moved behind `next/dynamic` + first-open latch.
- Two more `a11y.test.tsx` cases (forms, charts).
- No runtime/UI change a user can see; no new dependency.
