# Mastery — Architecture Decision Records

Chronological log of decisions that deviate from the Final Master Prompt or that lock in a
choice future layers depend on. Newest at the bottom. Format: context → decision →
consequences.

---

## ADR-0001 — Fresh restart with no history backup
**Date:** 2026-08-27 · **Status:** accepted

**Context.** A prior build attempt reached Layers 0–8A on branch
`feature/layer-04-authentication`, but the working tree had been wiped and the history was
tangled. The owner wants a clean rebuild.

**Decision.** Delete the existing git history entirely (`rm -rf .git && git init`), keep no
backup branch, and rebuild from Layer 0. Non-code assets on disk (spec PDF, logo images)
are retained.

**Consequences.** All previous commits are unrecoverable. Every layer is re-implemented
against the current documentation. No migration concerns from the old code.

---

## ADR-0002 — Single `main` branch, push each layer directly
**Date:** 2026-08-27 · **Status:** accepted · **Deviates from:** Final Master Prompt §31 (Git Strategy)

**Context.** The prompt prescribes `main` + `develop` + `feature/layer-*` branches. This is
a solo, sequential, layer-by-layer build.

**Decision.** Use a single `main` branch. Each completed layer is committed with a
Conventional Commit message and pushed straight to `origin/main`. No `develop`, no feature
branches, unless the owner asks for one.

**Consequences.** Simpler flow, linear history, one commit (or a tight series) per layer.
CI runs on `main`. Loss of PR-based review gates is accepted for this project.

---

## ADR-0003 — Firebase App Hosting for the frontend (not Vercel)
**Date:** 2026-08-27 · **Status:** superseded for now by ADR-0015 (static export → Firebase Hosting); remains the fallback once SSR is needed · **Deviates from:** Final Master Prompt §3 and §27

**Context.** The prompt names Vercel for the Next.js frontend. The owner wants everything
hosted and deployed on Firebase.

**Decision.** Deploy the Next.js App Router frontend via **Firebase App Hosting**. All
backend services (Auth, Firestore, Storage, Functions, Messaging, App Check) are in the
same Firebase project per environment. GitHub remains source control.

**Consequences.** One provider to operate and bill. CI/CD (Layer 22) targets Firebase App
Hosting instead of Vercel. Any Vercel-specific references in the prompt are treated as
"the hosting platform" and mapped to App Hosting.

---

## ADR-0004 — Firebase project id slug `master-personal-manger`
**Date:** 2026-08-27 · **Status:** superseded by ADR-0008

**Context.** The owner wants the project id to be "Master personal manger". Firebase
project ids must be lowercase, 6–30 chars, `a-z 0-9 -`, starting with a letter — spaces and
capitals are invalid.

**Decision.** The production project id will be the slug **`master-personal-manger`**
(preserving the owner's spelling). The owner creates the Firebase project(s) in the console
and confirms the exact id(s) — and per-environment ids — before Layer 3 begins. `DEPLOYMENT.md`
holds the environment↔id table.

**Consequences.** Layers 0–2 need no Firebase project. Layer 3 is blocked until the
project exists and the id is confirmed here.

---

## ADR-0005 — Launch languages English + Dutch; Spanish architected-for
**Date:** 2026-08-27 · **Status:** accepted · **Source:** Final Master Prompt §21

**Decision.** Ship English and Dutch locale content at launch. Build the i18n architecture
(next-intl, locale files, no hardcoded strings, locale-aware formatting) so Spanish can be
added later without structural change; no Spanish content required in the first release.

---

## ADR-0006 — 24-layer / 46-step build plan
**Date:** 2026-08-27 · **Status:** accepted · **Source:** Final Master Prompt §29

**Decision.** Adopt the prompt's build order verbatim: Layers 0–23, with Layer 8 (8A–8H),
Layer 9 (9A–9E), Layer 10 (10A–10D), Layer 11 (11A–11D), and Layer 15 (15A–15F) built as
sublayers — 46 discrete build steps in total. One layer/sublayer per work session; do not
start the next before the current one meets the definition of done.

---

## ADR-0007 — Radix UI primitives + CVA + lucide-react for the design system
**Date:** 2026-08-27 · **Status:** accepted · **Layer:** 2

**Context.** `docs/DESIGN_SYSTEM.md` requires accessible overlay/menu/listbox components
(Dialog, DropdownMenu, Tooltip, Select, Tabs, RadioGroup, Checkbox, Switch) with full
keyboard support, focus trapping, and correct WAI-ARIA semantics. `CLAUDE.md` §3 mandates
keyboard navigation and accessible focus/labels. Hand-rolling compliant versions of these
patterns is high-risk and high-maintenance. The Final Master Prompt's stack list does not
name a headless component library but does list Lucide, clsx, and tailwind-merge.

**Decision.** Add unstyled primitive dependencies:
- **`@radix-ui/react-*`** (avatar, checkbox, dialog, dropdown-menu, label, radio-group,
  select, separator, slot, switch, tabs, toggle-group, tooltip) — accessible behavior only;
  all styling is ours via Tailwind tokens.
- **`class-variance-authority`** — typed component style variants.
- **`lucide-react`** — icon set (already named in the prompt's stack).

Components live in `src/components/ui/` as thin styled wrappers; the rest of the app imports
from `@/components/ui`, never from Radix directly.

**Consequences.** ~13 small runtime deps added. Radix is React 19 compatible. If Radix is
ever replaced, the blast radius is limited to `src/components/ui/`. Deferred primitives
(Accordion, Popover, Toast, Combobox, Slider, DatePicker, Table/DataTable, Pagination,
CommandPalette) are added by the layers that first need them, following the same pattern.

---

## ADR-0008 — Firebase project id `mastery-personal-mgmt-system`; region `europe-west1`
**Date:** 2026-08-28 · **Status:** accepted · **Layer:** 3 · **Supersedes:** ADR-0004

**Context.** The owner asked for the Firebase project id
`mastery-personal-management-system` (matching the GitHub repo name). GCP/Firebase project
ids are limited to 6–30 characters; that string is 34. The owner authorized creating the
project via the CLI with the closest valid id. `mastery-personal-manager` (24 chars) was
already registered globally by another account.

**Decision.** Created **`mastery-personal-mgmt-system`** (28 chars) via
`firebase projects:create` and registered a Web app. This single cloud project serves
local dev + (for now) production; the emulator-only test path uses the reserved
`demo-*` id space and needs no cloud project. Staging/production split is deferred to
Layer 22. Default Cloud Functions region: **`europe-west1`** (`functions/src/config/region.ts`),
chosen for EU data locality.

**Consequences.** `.firebaserc` `default` = `mastery-personal-mgmt-system`. Web SDK config
lives in `.env.local` (git-ignored); `.env.example` documents the keys.
`docs/DEPLOYMENT.md` §1 holds the environment↔id table. ADR-0004's placeholder slug
(`master-personal-manger`) is retired.

---

## ADR-0009 — Client-side route protection in Layer 4 (no SSR session yet)
**Date:** 2026-08-28 · **Status:** accepted · **Layer:** 4

**Context.** Layer 4 uses the Firebase Web SDK on the client only. Server components and
middleware have no access to the auth state without a session cookie, which requires a
Cloud Function / route handler to mint and verify an ID-token cookie — meaningful extra
infrastructure.

**Decision.** Protect authenticated routes on the client: the `(app)` route-group layout
consumes `useAuth()`, renders a `LoadingState` while the session resolves, and
`router.replace('/login?next=…')` when unauthenticated. The `(auth)` group redirects
already-signed-in users to `/dashboard`. Firestore/Storage security rules remain the real
enforcement boundary — the client guard is UX, not security.

**Consequences.** A brief loading state on protected routes during hydration; no
server-rendered personalization for authed pages yet. A session-cookie + middleware
approach can be layered on later (candidate for Layer 5 or Layer 20) without changing the
`useAuth` contract. `react-hook-form` + `@hookform/resolvers` were added from the approved
stack list (no ADR needed for those).

---

## ADR-0010 — `cmdk` for the command palette
**Date:** 2026-08-28 · **Status:** accepted · **Layer:** 5

**Context.** The shell spec (`MASTER_SPEC.md` §3) requires a command palette. It needs
combobox semantics: type-ahead filtering, arrow-key navigation, `aria-activedescendant`,
and grouped results. `DESIGN_SYSTEM.md` listed CommandPalette as deferred to its consuming
layer — this is that layer.

**Decision.** Add **`cmdk`** (1.1.x, React 19 compatible). It ships an accessible,
unstyled command primitive and reuses `@radix-ui/react-dialog` (already a dependency) for
the modal. Styling is ours via Tailwind tokens. Used only in
`src/components/layout/command-palette.tsx`.

**Consequences.** One small dependency. If replaced, the blast radius is a single file.
The palette currently searches navigation destinations + actions; full-text content search
is added once modules have data.

---

## ADR-0011 — Client-SDK generic repository factory
**Date:** 2026-08-28 · **Status:** accepted · **Layer:** 6

**Context.** `ARCHITECTURE.md` §4 calls for user-scoped repositories that resolve the uid
internally, stamp audit fields, validate reads with Zod, and paginate. Layers 8–12 each
need a repository per collection; hand-writing ~25 near-identical repositories is wasteful
and error-prone.

**Decision.** `src/lib/repository/createFirestoreRepository(config)` — a factory that,
given `{ collectionName, schema, createSchema, updateSchema }`, returns a typed
`{ list, get, create, update, archive, unarchive }`. It uses the **Firebase Web SDK** and
takes the uid from the client auth state (`getFirebaseClient().auth.currentUser`), matching
the Layer 4 pattern. `list` fetches `limit + 1` for `hasMore` and uses the last row's id as
an opaque cursor (re-fetched as a `startAfter` snapshot). Audit stamping lives in the repo
(not the converter) to avoid `FieldValue`/type friction; integrity is *also* enforced in
`firestore.rules`.

**Consequences.** Domain layers write only a schema + `createFirestoreRepository(...)`.
`create`/`update` do a read-back (one extra read) so returned entities carry real server
timestamps. Server-side data access (Admin SDK, for SSR / Cloud Functions) is **not** in
this factory yet — an admin variant with the same interface is added when a server code
path first needs user-scoped reads (candidate: Layer 13/14/16). Cursor pagination is
forward-only; `orderBy` must be a stored field.

---

## ADR-0012 — Dashboard MVP: aggregation service now, Quick Notes as the one live widget
**Date:** 2026-08-28 · **Status:** accepted · **Layer:** 7

**Context.** Layer 7 ("Dashboard MVP") lands before Layers 8–12, which create goals,
tasks, habits, KPIs, and the Life Score. There is almost no domain data to aggregate yet.

**Decision.**
- Build the real deliverable — **`loadDashboardAggregate()`**: one batched, user-scoped
  read pass returning a typed `DashboardAggregate`. Future domains add their query to its
  `Promise.all`; widgets never read Firestore directly (`ARCHITECTURE.md` §5). Fields for
  not-yet-built features return `null` / `[]` with a `// Layer N` marker.
- Ship **Quick Notes** as a fully functional widget: `users/{uid}/quickNotes` via the
  Layer 6 `createFirestoreRepository`, with add / edit / archive in the UI. It is the one
  end-to-end proof of the schema → repo → rules → aggregation → UI path, and "Quick notes"
  is an explicit dashboard widget in the prompt.
- Every other widget (priorities, goal progress, habit streaks, milestones, Life Score,
  KPI overview, AI Coach, focus/tasks/habits stat tiles) is wired to the aggregate and
  renders a clear empty state that links to its module, labelled with its planned layer.
- The Recovery shortcut shows **no** streak/count/detail — just a private way in.

**Consequences.** When Layers 8–12 arrive they extend `loadDashboardAggregate()` and swap
each placeholder widget's body for real data; the page, hook, layout, and states already
exist. `quickNotes` is added to `DATA_MODEL.md`. Greeting/date are client-clock derived,
guarded by a `useMounted()` hook to stay hydration-safe.

---

## ADR-0013 — Life Vision as a typed, pillar-linked collection; domain rule-validation deferred
**Date:** 2026-08-29 · **Status:** accepted · **Layer:** 8A

**Context.** `PRODUCT_REQUIREMENTS.md` §2 lists ten kinds of vision content (mission, core
values, purpose, legacy, three directions, vision statements, future-self, principles),
each linked to one or more life pillars. `DATA_MODEL.md` has `users/{uid}/lifeVisions/{visionId}`
(a collection).

**Decision.**
- Model Life Vision as a **collection of typed items** (`category` enum + `title` +
  `content` + `pillarIds: LifePillar[]` (1–3)), not one big singleton document. Fits the
  "each item links to pillars" requirement and the Layer 6 `createFirestoreRepository`
  cleanly.
- `listActiveVisions()` fetches a bounded page (100) and filters `status === "active"` in
  JS — avoids a `(status, createdAt)` composite index while collections are small. A real
  index + query is added if/when a vision collection grows large.
- Shared **`PillarSelect`** / **`PillarBadges`** components (in `components/shared/`) —
  every Plan/Analytics domain (8B–8G, 12) links pillars, so they are built once here.
- **Per-collection domain-value validation in `firestore.rules` is deferred to Layer 20.**
  Firestore OR-combines every matching rule, so a stricter `match /users/{uid}/lifeVisions/...`
  block cannot tighten the Layer 6 catch-all `match /users/{uid}/{collection}/{document=**}`
  without restructuring it. Layer 20 (Security Hardening) does that restructuring for all
  domains at once. Until then, write shape is enforced by the repository's Zod
  `createSchema`/`updateSchema`, and the catch-all still enforces ownership + audit-field
  integrity.

**Consequences.** 8B–8G reuse the pillar components and the same feature shape
(schema + repository + hook + view + dialog). Layer 20 gains a defined task: split the
subcollection rules per collection with domain-value checks.

---

## ADR-0014 — One plan shape across five tier collections; transform-free create schemas
**Date:** 2026-08-29 · **Status:** accepted · **Layer:** 8B (applies through 8C)

**Context.** `DATA_MODEL.md` lists five planning-tier collections (`fiveYearPlans`,
`yearPlans`, `quarterPlans`, `monthPlans`, `weekPlans`). Their fields are identical
(objective, desired outcomes, key measures, dates, status, progress, review notes,
pillars, parent link). Also: `createFirestoreRepository`'s config types `createSchema` as
`ZodType<TCreate>` (output = input), so a create schema with Zod transforms/defaults does
not type-check against it.

**Decision.**
- One `planFieldsSchema` → `planSchema` (stored, via `defineRecordSchema`),
  `planCreateSchema` (`.refine` for date ordering, **no transforms, no defaults** — every
  field explicit), `planUpdateSchema` (`.partial()`).
- A separate `planFormSchema` holds the form's own shape (string dates incl. `""`); a pure
  `planInputFromForm(values, parentId)` maps it to `PlanCreate` (`"" → null`) on submit.
- `repositories.ts` builds a `PlanRepository` per tier from the shared schemas;
  `PLAN_REPOSITORIES` is a `Partial<Record<PlanHorizon, …>>` — **8B wires `five-year` /
  `one-year`; 8C adds `quarter` / `month` / `week`.** `getPlanRepository` throws for an
  unwired tier. `PlansView` / `usePlans` are parameterized by `horizon`.
- The plan's own lifecycle is `planStatus` (`planned`/`active`/`complete`/`abandoned`),
  kept separate from the base record `status` (`active`/`archived`).

**Consequences.** 8C is ~5 lines (3 repo entries + 3 route files reusing `PlansView`).
Feature schemas across the app should keep `createSchema` transform-free and do any
string→typed mapping in an explicit helper (pattern for later domains).

---

## ADR-0015 — Static export to Firebase Hosting (defer App Hosting)
**Date:** 2026-09-02 · **Status:** accepted · **Layer:** 9D session (deploy pipeline) · **Supersedes for now:** ADR-0003

**Context.** The owner requires the app to be committed, pushed, and **deployed live after
every session** (`CLAUDE.md` §10.1), at `https://mastery-personal-mgmt-system.web.app/`.
Firebase App Hosting (ADR-0003) requires the **Blaze (pay-as-you-go)** plan; the project
`mastery-personal-mgmt-system` is on the **Spark (free)** plan and upgrading billing is the
owner's call, not the agent's. Meanwhile the app through Layer 9D is entirely client-side:
client auth (ADR-0009), the Firebase JS SDK for all data, no middleware, no server route
handlers (the one `/api/health` handler is a static liveness marker), no `next/image`
usage, no `rewrites`/`redirects`/`headers` in `next.config`.

**Decision.**
- `next.config.ts` → `output: "export"` + `images: { unoptimized: true }`. `next build`
  emits a fully static site to `out/`.
- `src/app/api/health/route.ts` → `export const dynamic = "force-static"` (emitted as a
  static JSON asset; `timestamp` = build time).
- `firebase.json` gains a `hosting` block: `public: "out"`, `cleanUrls: true`,
  `trailingSlash: false`, long-lived immutable cache for `/_next/static/**`.
- Per-session deploy: `npm run build` then
  `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
  --project mastery-personal-mgmt-system --non-interactive`. **No `functions`** — Cloud
  Functions deploy needs Blaze and none is shipped.
- Firebase web SDK config is read from `.env.local` at build time and baked into the
  static bundle.

**Consequences.**
- Free hosting, deployable today, no billing decision blocking the §10.1 rule. First live
  deploy done 2026-09-02 (266 files).
- **No SSR / middleware / server route handlers / ISR / on-demand revalidation** until this
  is revisited. The first layer that needs any of them (candidates: Layer 13 General AI if
  it proxies through Next routes rather than `functions/`, Layer 16 Reports/PDF, Layer 17
  server-driven notifications) must either keep that logic in `functions/` (Cloud Functions,
  already the plan for AI/Recovery) or move the frontend to App Hosting — a new ADR + a
  Blaze upgrade.
- `NEXT_PUBLIC_APP_ENV` is still `development` in the release build; a prod env file / CI
  secret store (Layer 22) fixes that.
- ADR-0003 stays on record as the intended end state for a server-rendered frontend.

---

## ADR-0016 — Execution Tracker is a read-only aggregation; no `executionLogs` collection
**Date:** 2026-09-02 · **Status:** accepted · **Layer:** 10D — closes the Act domain

**Context.** `docs/DATA_MODEL.md` reserved `users/{uid}/executionLogs/{logId}` since Layer 0
for the Execution Tracker (spec: compare planned vs completed vs delayed vs cancelled vs
rescheduled work; estimated vs spent time; focus quality; energy; reasons for
non-completion). By Layer 10D, every one of those facts already lives somewhere: task
status/dates/estimate/actual/`resolutionReason` (10A), habit schedule + logs (10B), routine
steps + logs (10C), and focus quality / energy on Deep Work sessions (9B). Writing a
parallel `executionLogs` record would duplicate state that's already the source of truth
elsewhere, with the same drift risk the codebase has already ruled out twice — the Deep
Work session score (9B) and habit streaks (10B) are both computed on read for exactly this
reason.

**Decision.** `src/features/execution-tracker/` adds **no new Firestore collection**. It
is pure aggregation: `execution-tracker.ts` classifies/sums existing Task, Habit(+log),
Routine(+log), and Deep Work data for a period (`today` / `week`); `use-execution-tracker.ts`
composes the existing `useTasks` / `useHabits` / `useRoutines` / `useDeepWork` hooks and
memoizes the summary; `ExecutionTrackerView` renders it. "Rescheduled" is **not** reported
as its own category — tasks don't keep a due-date-change history, so it can't be derived
honestly; "cancelled" timing is approximated from `updatedAt` (tasks have no dedicated
cancellation timestamp). Both are recorded as known limitations rather than faked.
`docs/DATA_MODEL.md`'s `executionLogs` line is retired in favor of a note pointing here.

**Consequences.** No composite indexes, no new write path, no risk of the tracker
disagreeing with the records it's summarizing. If a future layer needs durable historical
snapshots (e.g. "what did the tracker say last month" after source records changed), that
would justify a real `executionLogs` collection — revisit with a new ADR rather than
retrofitting this one.

---

## ADR-0017 — General AI Architecture: Anthropic Claude provider; written and tested but not deployed this layer
**Date:** 2026-09-04 · **Status:** accepted · **Layer:** 13 — General AI Architecture

**Context.** Layer 13 (`docs/AI_ARCHITECTURE.md`) requires every AI request to go through
an authenticated Cloud Function, with a swappable `AiProvider` abstraction so the concrete
vendor is never baked into an endpoint. Two decisions were the owner's to make, not the
agent's: (1) which AI provider to call, and (2) whether to upgrade the Firebase project
`mastery-personal-mgmt-system` off the Spark (free) plan — required because Cloud
Functions cannot be deployed on Spark (ADR-0015 already deferred this once). Asked
directly, the owner chose Anthropic Claude as the provider and chose to have this layer's
code **written and unit-tested now, deployed later** rather than upgrading to Blaze this
session.

**Decision.**
- `functions/src/ai/shared/ai-provider.ts` defines the `AiProvider` interface (one
  `complete()` method); `anthropic-provider.ts` implements it via `@anthropic-ai/sdk`
  (new dependency, model `claude-sonnet-5`, swappable via a named constant).
  `provider-factory.ts` binds the concrete provider to a Functions secret
  (`ANTHROPIC_API_KEY`, `defineSecret`) — never read outside a request, never in client code.
- Five callables share one flow (`shared/handler.ts`): `requireAuth` → validate the
  request → enforce a per-user quota (`shared/quota.ts`: daily request/token ceiling,
  monthly token ceiling, via `aiUsageDaily`/`aiUsageMonthly` rollup docs) → build a minimal
  per-intent context (`shared/context-builder.ts`, bounded Admin SDK reads) → call the
  provider → validate its structured JSON reply against `modelOutputSchema` → attach the
  context refs server-side as `influencedBy` (**never model-produced** — the model cannot
  hallucinate a reference to a record it wasn't actually given) → record a per-call audit
  entry (`aiCallLogs`) → persist the exchange (`coachExchanges`) → return the documented
  response contract. `masteryCoachQuery`, `generatePlanningRecommendations`,
  `generateGoalBreakdown`, `generateReflectionQuestions`, `analyzeExecutionPatterns` are
  thin wrappers supplying their intent.
- `handleAiIntent(intent, request, { db, provider, now? })` takes its Firestore instance
  and provider as parameters rather than importing singletons, so
  `functions/tests/ai/handler.test.ts` exercises the real orchestration logic against a
  small in-memory Firestore/provider fake — no real network call, no Firestore emulator,
  consistent with `functions/`'s existing pure-unit-test convention (there is no
  emulator-integration-test setup in that package today).
- Quota counters are read-then-written plain arithmetic, not `FieldValue.increment` —
  trading a rare lost update under concurrent requests from the same user for logic that's
  fully unit-testable without a live Firestore.
- Client side: `src/lib/firebase/client.ts` gains a `functions` instance (region
  `europe-west1`, matching `functions/src/config/region.ts`) — the first feature to call a
  Cloud Function from the browser. `src/features/ai-coach/` calls the five callables and
  reads back `coachExchanges` (read-only — the client never writes it; only the Admin SDK
  does) for the AI Coach page's history.
- **Not deployed.** `firebase.json`'s `functions` codebase and predeploy step already
  existed (ADR-0015); the end-of-session deploy command still deploys `hosting,
  firestore:rules,firestore:indexes,storage` only, unchanged. `ANTHROPIC_API_KEY` has not
  been provisioned as a Functions secret. The AI Coach page is live in the static bundle
  and will show a normalized network error if used before functions are deployed.

**Consequences.**
- Nothing here blocks §10.1's mandatory hosting deploy — only the Cloud Functions half of
  this layer is deferred, and that was true for every layer since ADR-0015 (no function
  has ever been deployed).
- Turning this on later needs exactly two owner actions, no further code: upgrade
  `mastery-personal-mgmt-system` to Blaze, then `firebase deploy --only functions --project
  mastery-personal-mgmt-system` after setting the `ANTHROPIC_API_KEY` secret
  (`firebase functions:secrets:set ANTHROPIC_API_KEY`).
- System-calculated KPI/habit-derived context enrichment, `generateWeeklySummary` (Layer
  14), and `recoveryCoachQuery` (Layer 15E, fully isolated from this code) are explicitly
  out of scope for this ADR.

---

## ADR-0018 — Weekly AI Summary: timezone-respecting daily scheduler; a new opt-in field; first use of `notifications`
**Date:** 2026-09-04 · **Status:** accepted · **Layer:** 14 — Weekly AI Summary

**Context.** `docs/AI_ARCHITECTURE.md` §6 requires the weekly summary to "respect timezone
and opt-in" and to notify the user. Three things didn't exist yet: (1) no scheduled
(`onSchedule`) function anywhere in `functions/`; (2) no opt-in field on the user profile
— `userProfileSchema` had `timezone` (Layer 4/6) but nothing for this preference; (3) the
`notifications` collection was reserved since Layer 0 but never written to (Layer 17 owns
its delivery/consumption UI).

**Decision.**
- **Scheduling, not per-user cron.** `generateWeeklySummary` (`functions/src/scheduled/
  generate-weekly-summary.ts`) is one `onSchedule` job running daily at 01:00 UTC — not 24
  separate per-offset triggers. It lists every active user
  (`weekly-summary/list-users.ts` — paginated, ordered by `__name__`) and, for each,
  checks whether **today is Monday in that user's own stored `timezone`**
  (`week-window.ts`'s `localWeekday`, via `Intl.DateTimeFormat`) before generating anything
  for them. This is a real per-user timezone check, not a fixed UTC day, at the cost of a
  small (≤24h) latency versus firing exactly at each user's local midnight.
- **A new opt-in field.** `userProfileSchema` gains `weeklySummaryEnabled: z.boolean().
  default(true)` (opt-out by default, since there's no onboarding flow asking either way
  yet) — checked by the scheduler before generating. No Settings UI exists to toggle it
  yet (Layer 18); until then it can only be changed by editing the Firestore document
  directly. `userProfileUpdateSchema` already accepts it so Layer 18 needs no schema work.
- **Facts computed server-side, defensively** (`weekly-summary/collect-week-data.ts`) —
  the same "read raw Firestore fields, don't import client schemas" approach Layer 13's
  `context-builder.ts` established, extended with `toDateKey()` to duck-type a Firestore
  `Timestamp` (`updatedAt`/`createdAt`, real server timestamps) alongside the plain ISO
  date strings the client already writes for fields like `dueDate`/`completedAt`. Task
  on-time/late/cancelled/overdue classification mirrors the Execution Tracker's approach
  (10D, ADR-0016) reimplemented for Admin SDK reads — the same known limitation applies
  ("cancelled" timing approximated from `updatedAt`, no dedicated event timestamp).
- **AI touches only "lessons" and "suggestedPriorities."** Every other field in a
  `weeklySummaries` document is a computed fact, never asked of the model — avoiding any
  chance of the AI inventing a number. This mirrors Layer 13's `influencedBy` design
  (attach facts server-side, ask the model only for the synthesis it's actually good at).
- **Idempotent by week.** Before generating, the job checks for an existing summary with
  the same `weekStart` for that user and skips if found — a rerun (manual retry, a
  double-fire) never produces a duplicate.
- **First write to `notifications`.** One record per generated summary
  (`type: "weekly-summary"`, `title`, `body`, `relatedId`, `read: false`) — a minimal,
  forward-compatible shape; Layer 17 owns the full delivery/consumption UI and may extend
  this shape, not replace it.
- **Client:** `src/features/weekly-summaries/` reads/archives/deletes (all three
  operations the spec asks for: "review, archive, delete"); the Cloud Function is the only
  writer. No new nav item — the feature surfaces as a second tab ("Weekly Summaries") on
  the existing AI Coach page (`Grow → AI Coach`) rather than a new sidebar entry, since no
  slot was reserved for it and the two features are closely related.
- **Testing:** `functions/tests/ai/fakes.ts`'s fake Firestore gained real `orderBy`/
  `startAfter` support (previously a no-op) and an `.empty` flag on query results — both
  needed for `listActiveUserIds`'s pagination and `generateWeeklySummaryForUser`'s
  idempotency check — and both are now exercised by dedicated tests, not just assumed.
- **Not deployed**, same as Layer 13 (ADR-0017) — the Spark-plan / Blaze decision is
  layer-independent; this scheduled function joins the same not-yet-deployed set.

**Consequences.**
- A user's summary can land anywhere in a ~24h window after their local Monday begins,
  not at a precise local time — acceptable for a weekly digest, called out explicitly so
  it isn't mistaken for a bug later.
- `weeklySummaryEnabled` will likely move into a richer preferences object when Layer 17/18
  build real notification/settings management — this field is intentionally minimal and
  additive, not a preview of that future shape.
- `listActiveUserIds` reads every active user's profile once per run; fine at today's
  scale, revisit (batching, a materialized "due today" index) if the user base grows large
  enough to make a full daily scan expensive.
