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

---

## ADR-0019 — Recovery Center privacy gate: a client-side PIN, a singleton profile keyed by uid, session-scoped unlock
**Date:** 2026-09-08 · **Status:** accepted · **Layer:** 15A — Recovery Center Privacy Architecture

**Context.** `docs/RECOVERY_PRIVACY.md` §1 requires "an additional privacy gate... before
opening the module — PIN protection first, architected for future biometric/WebAuthn" on
top of the owner-only Firestore rules every collection already has. §2 reserves
`users/{uid}/recoveryProfiles/{profileId}` without describing its fields (§2's field list
— "behavior, start date, motivation, triggers..." — describes `recoveryGoals`, a different
collection, not yet built). Three design questions needed answering before any code: what
the PIN actually protects against, where its config lives, and how "unlocked" persists.

**Decision.**
- **The PIN is a privacy shield, not a security boundary.** It protects against a
  shoulder-surfer or someone picking up an already-signed-in device casually opening the
  module — not against the account owner, who already has full Firebase Auth access to
  their own data regardless. This framing (stated explicitly in `schema.ts`'s doc comment)
  is why a client-side salted-SHA-256 hash-and-compare (`pin-crypto.ts`, Web Crypto
  `SubtleCrypto`, no new dependency) is an appropriate implementation: there is no
  server-side secret to protect, so there is nothing a server-mediated check would add
  here that the owner-only Firestore rule doesn't already provide.
- **`recoveryProfiles/{uid}`** — a singleton keyed by the user's own uid (not an
  auto-generated id), holding only lock-gate fields (`lockMethod`, `pinHash`, `pinSalt`,
  `failedAttempts`, `lockedUntil`). `lockMethod` is an enum with a single value today
  (`"pin"`) specifically so a future WebAuthn method is a data/logic change, not a schema
  rewrite. This collection intentionally carries **no** behavioral data — `recoveryGoals`
  (15B) is where "behavior, triggers, motivation..." lives, per §2's actual description.
- **Client-tracked lockout, not a Cloud Function.** 5 wrong PINs in a row locks further
  attempts out for 30 seconds, tracked entirely in the `recoveryProfiles` doc via normal
  client writes (owner-only rule already sufficient — no relapse/coach/accountability data
  exists in this collection to require Cloud-Function mediation per §3). A determined
  attacker with Firestore write access already has the user's Firebase Auth session, at
  which point the PIN was never the security boundary anyway.
- **Unlocked state lives in `sessionStorage`, keyed by uid, with a 15-minute TTL** —
  cleared when the tab closes, so a new tab or a restarted browser always re-prompts. This
  is more privacy-conservative than `localStorage` (which would stay unlocked across
  browser restarts) at the cost of re-prompting slightly more often than some users might
  want; revisit only if that trade-off proves wrong in practice.
- **"Forgot your PIN" deletes the whole `recoveryProfiles` doc**, forcing setup again.
  Safe today because the collection holds nothing but lock config; this must be
  reconsidered before Layer 15B adds real data to a `recoveryProfiles` document if that
  document's shape ever grows beyond pure lock-gate fields.
- **`firestore.rules` unchanged** — the existing generic owner-only subcollection rule
  already covers `recoveryProfiles` correctly for this layer's fully-client-writable
  lock config. A code comment now flags that a later sublayer adding a
  Cloud-Function-only-write collection (relapses ~15C, coach sessions ~15E, accountability
  config ~15F) must restructure that generic match to exclude the new collection by name,
  since Firestore ORs every matching rule together — a narrower `match` block placed
  alongside the wildcard cannot make anything *more* restrictive on its own. A dedicated
  `tests/rules/recovery.rules.test.ts` regression test was added anyway (mirroring the
  generic subcollection tests but specific to `recoveryProfiles`), so a future rules
  change to this exact path is caught immediately rather than relying on the generic
  suite alone.
- **Module shell:** `RecoveryGate` wraps the entire `/recovery` route; nothing behind it
  (including the honest "coming in 15B–15F" home screen) mounts before `unlocked` is true.
  No dashboard, search, or notification code references Recovery Center — true before this
  layer and unchanged by it (allowlist, not denylist, per §1/§3).

**Consequences.**
- The PIN adds real friction against casual access without pretending to be encryption —
  documented plainly so a future contributor doesn't mistake it for a stronger guarantee
  than it is.
- If `recoveryProfiles` later needs to hold more than lock config, "forgot PIN deletes the
  doc" must be revisited (e.g. split lock fields into a nested map so a reset can clear
  just those) — flagged above, not solved here since no such data exists yet.
- Building the actual behavioral tracking (`recoveryGoals` and everything in §4) is
  entirely deferred to Layer 15B onward, per `CLAUDE.md` §7's "implement only the
  requested sublayer."

---

## ADR-0020 — Recovery goal data model: neutral status vocabulary, archive-only, per-sublayer schema files
**Date:** 2026-09-08 · **Status:** accepted · **Layer:** 15B — Recovery Data Model

**Context.** `docs/RECOVERY_PRIVACY.md` §2 lists a recovery goal's fields loosely
("behavior, start date, motivation, triggers, warning signs, coping strategies, support
preferences, privacy settings, current status") and §4 mandates "growth-oriented and
neutral" language with "no shame-focused presentation." §8 routes hard data deletion
through a dedicated Cloud Function. Three calls needed making.

**Decision.**
- **`recoveryStatus` is a small, neutral, self-report vocabulary:** `active` ("Working on
  it"), `going-well` ("Going well"), `challenging` ("Challenging right now"), `paused`
  ("Paused"). No "failed"/"relapsed"/"broken streak" state — a hard stretch is
  `challenging`, framed as a moment, not a verdict. Setback *events* (with restart flow)
  are the `relapses` subcollection in 15C, deliberately not a goal status.
- **"support preferences" → `supportNotes` (free text) + `faithBasedEncouragement`
  (boolean, opt-in, default off).** The spec's "user-selected faith-based options" (§4) is
  modelled as this one explicit opt-in flag on the goal, consumed later by the Recovery
  Coach (15E). "privacy settings" per-goal is **not** modelled here — the whole module is
  already PIN-gated, and per-goal sharing scope belongs to the accountability-partner
  config in 15F, not to the goal record.
- **Archive only in this layer; no client hard delete.** `recoveryGoals` will grow
  subcollections (check-ins, relapses, coping actions) that Firestore won't cascade-delete,
  and §8 already assigns "data deletion" to a Cloud Function with confirmation. So 15B's UI
  offers reversible archive (`status: "archived"`, same as every other domain) and defers
  true deletion to that function, to be built in the sublayer that first adds a
  subcollection worth cascading (~15C).
- **A separate `recovery-goal-schema.ts` / `recovery-goal-repository.ts` alongside 15A's
  `schema.ts` / `recovery-lock-repository.ts`**, rather than one growing file. Recovery is
  a six-sublayer feature; keeping each sublayer's model in its own file keeps the lock
  gate (15A) and the behavioral model (15B+) legible and independently reviewable. The
  feature barrel re-exports from all of them.
- **No `firestore.rules` change** — `recoveryGoals` is client-written under the existing
  generic owner-only subcollection rule, same as any other domain and the same as 15A's
  `recoveryProfiles`. `tests/rules/recovery.rules.test.ts` gained a `recoveryGoals`
  describe block anyway (owner create/read, cross-user denied, missing-audit-fields
  rejected) as a targeted regression net for this sensitive path.

**Consequences.**
- The status vocabulary is intentionally coarse; if check-ins (15C) prove that users want
  a finer current-state signal, that's a check-in concern (a richer, time-stamped picture)
  rather than a reason to expand this enum.
- Hard delete being deferred means an archived recovery goal (and later its subcollections)
  physically persists until the deletion function ships — acceptable for now, flagged as a
  known limitation.

---

## ADR-0021 — Recovery check-ins & setbacks: client-written check-ins, Cloud-Function-mediated relapses, derived streaks
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 15C — Check-ins & Tracking

**Context.** Layer 15C adds the first two subcollections under `recoveryGoals/{goalId}`:
daily **check-ins** and **setback (relapse) records**. `docs/RECOVERY_PRIVACY.md` §3 says
relapse/coach/accountability writes "must go through Cloud Functions" with rules rejecting
direct client writes; §4 mandates growth-oriented, non-shaming language. The existing
`createFirestoreRepository` factory only models one level under `users/{uid}`. Streak and
progress numbers could be stored or derived.

**Decision.**
- **Check-ins are client-written** under the existing generic owner-only subcollection
  rule — they are low-risk self-report data (`date`, `stayedOnTrack`, `urgeIntensity` 0-10,
  HALT booleans, `triggersToday`/`copingUsed`, `reflection`), one document per goal per
  day, upserted by date.
- **Relapses are written only by the `recordRecoverySetback` Cloud Function.**
  `firestore.rules` gained `isServerMediatedRecoveryWrite(document)` —
  `string(document).matches('(^|.*/)relapses/[^/]+$')` — and the generic
  `users/{uid}/{collection}/{document=**}` create/update/delete rules now carry
  `&& !isServerMediatedRecoveryWrite(document)`. Firestore ORs all matching rules, so the
  guard has to sit on the wildcard rule itself, not in a narrower `match` block. The client
  reads relapses back directly (owner-only read is unchanged); it just cannot write them.
- **The function (like the AI functions in 13/14) is written and unit-tested but NOT
  deployed** — the project stays on the Spark plan; `firebase deploy` remains
  `--only hosting,firestore:rules,firestore:indexes,storage`. Consequence: "Log a setback"
  will fail in production until the owner upgrades to Blaze and deploys functions.
- **Bespoke nested repositories** (`recovery-checkin-repository.ts`,
  `recovery-relapse-client.ts`) hand-rolled with `buildCreateAudit`/`makeConverter`, since
  the factory is single-level. Handlers take injectable deps for testing.
- **Streaks and progress are derived, never stored.** `summarizeRecoveryProgress(checkIns)`
  is a pure function (same pattern as habit streaks in 10B) computing `currentStreak`,
  `longestStreak`, `daysOnTrack`, `averageUrge`, `lastCheckInDate` on read.
- **Setback framing is "restart from here."** The relapse dialog leads with "A setback is
  part of the process, not the end of it"; the submit action is "Save & restart"; the goal
  has no "relapsed" status (ADR-0020) — a setback is an event, and the streak simply
  begins again.

**Consequences.**
- The `relapses` path is now the template for the coach-session (15E) and accountability
  (15F) Cloud-Function-only writes — the same rules guard extends by adding path patterns.
- Because progress is derived, a very long check-in history is read in full to compute it;
  `listRecentCheckIns` caps at 90 days, which bounds the read and the streak window. If a
  user needs streaks longer than 90 days, that becomes a stored-aggregate concern later.
- `string(document).matches(...)` in `firestore.rules` is only compile-checked at deploy
  time; this layer's deploy re-uploads the rules, so a syntax error surfaces there.

---

## ADR-0022 — Coping toolkit: per-goal client-written subcollection with a built-in suggestion library
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 15D — Coping Toolkit

**Context.** `docs/RECOVERY_PRIVACY.md` §4 lists a "coping toolkit (user-selected
faith-based options + evidence-informed behavioral techniques)"; the data model reserves
`users/{uid}/recoveryGoals/{goalId}/copingActions/{actionId}`. Questions: is this
client-written or Cloud-Function-mediated; what fields; how do the "evidence-informed
techniques" and "faith-based options" get in front of the user without shipping clinical
content.

**Decision.**
- **`copingActions` is client-written** under the existing generic owner-only subcollection
  rule — a coping action is a plain reference note the user writes for themselves, not one
  of the §3 server-mediated records (relapses / coach sessions / accountability). The 15C
  `isServerMediatedRecoveryWrite` guard matches `.../relapses/{id}` only, so no
  `firestore.rules` change was needed; `tests/rules/recovery.rules.test.ts` gained a
  `copingActions` block as a regression net anyway.
- **Bespoke nested repository** (`recovery-coping-repository.ts`), same reason as the 15C
  check-in repo: `createFirestoreRepository` is single-level. Removal is a reversible
  `status: "archived"` write, consistent with every other recovery record — true deletion
  is still the deferred cascading Cloud Function (ADR-0020/0021).
- **Minimal fields: `title`, `category`, `howTo`.** `category` is a small neutral enum
  (`grounding` / `physical` / `social` / `cognitive` / `faith` / `other`). No usage
  counters, no "favorite" flag, no scheduling — a toolkit is a list you glance at during an
  urge, and anything more is speculative.
- **A built-in `COPING_SUGGESTIONS` library** (urge surfing, 5-4-3-2-1 grounding, box
  breathing, 10-minute delay, replacement activity, message a support person,
  self-compassion pause, plus three `faith` entries) rendered as one-tap "Quick add" chips.
  These are short behavioral prompts, not diagnosis or treatment — the module's standing
  "not medical or psychological advice" disclaimer covers them. `faith` suggestions are
  only offered when the goal has `faithBasedEncouragement` enabled (ADR-0020's opt-in
  flag); a suggestion already saved drops out of the quick-add row.
- **The toolkit lives in `RecoveryGoalDetailView`** as its own section between check-ins
  and setbacks — no new route, no nav entry (Recovery is one page). `RecoveryHomeView`'s
  "Coming next" list drops to 15E–15F.

**Consequences.**
- The check-in form's free-text `copingUsed` field (15C) is left as-is; wiring the toolkit
  into that field as selectable chips is a possible later polish, not part of 15D.
- Because suggestions are a static in-repo array, adding or rewording them is a code change
  (and a translatable-strings concern when i18n lands in Layer 18) — acceptable for a small
  curated set.
- No Cloud Function and no new dependency this layer.

---

## ADR-0023 — Recovery Coach: an isolated AI endpoint that shares only the spend budget
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 15E — Recovery Coach

**Context.** `docs/RECOVERY_PRIVACY.md` §5 and `docs/AI_ARCHITECTURE.md` §7 require the
Recovery Coach to be *fully isolated* from the general planning AI: separate endpoint,
system prompt, context builder, and conversation storage. Layer 13 already built a reusable
AI stack (`AiProvider`, `handleAiIntent`, quota/usage, fakes). The open questions: how much
of that stack does the Recovery Coach reuse without breaching isolation, and where does its
conversation live.

**Decision.**
- **`recoveryCoachQuery` lives in `functions/src/recovery/`, not `functions/src/ai/`**, and
  does **not** go through `handleAiIntent`. It has its own request/response contracts,
  its own `RECOVERY_COACH_SYSTEM` prompt (supportive, non-judgmental, "restart from here"
  framing, immediate safe next step, explicit crisis→professional/emergency-help clause,
  no diagnosis, no coercive language), and its own `buildRecoveryCoachContext` that reads
  **only** `recoveryGoals/{goalId}` + its `checkIns` / `relapses` / `copingActions`. The
  general `buildContext` already reads only `goals` / `journalEntries` / `tasks`, so
  isolation holds in both directions by construction.
- **Storage: `users/{uid}/recoveryCoachSessions/{id}`, Cloud-Function-only.**
  `firestore.rules` `isServerMediatedRecoveryWrite` gained a `collection` parameter and now
  also returns true for `collection == 'recoveryCoachSessions'` (a top-level collection, so
  it can't be matched by the `.../relapses/{id}` path regex). Client reads are unchanged;
  only writes are blocked, making the function the sole writer. Nothing is written to
  `coachExchanges`.
- **Shared surface = the spend budget only.** `quota.ts` gained `bumpUsageCounters(db, uid,
  totalTokens, now)`, extracted from `recordUsage` (a controlled refactor — `recordUsage`
  now calls it, behavior identical, covered by new tests). The Recovery Coach calls
  `assertWithinQuota` + `bumpUsageCounters` so it shares one per-user daily/monthly AI
  cap, but it writes **no `aiCallLogs` record** — its per-call token/latency/cost metrics
  live on the `recoveryCoachSessions` document instead. The rollup counters are bare
  integers with no intent breakdown, so sharing them leaks nothing about recovery use;
  putting an `intent: "recovery-coach"` row in the general `aiCallLogs` collection would
  have (§1: "never used for unrelated analytics").
- **Faith-based encouragement** is gated on the goal's `faithBasedEncouragement` flag
  (ADR-0020) and passed to the model as an explicit one-line instruction ("has / has not
  opted in") rather than left implicit.
- **UI: a `RecoveryCoachPanel` section in the goal detail view**, goal-scoped. No new
  route, no nav entry. `RecoveryHomeView`'s "Coming next" list drops to just 15F.
- **Not deployed** — same as every Cloud Function so far (Spark plan, ADR-0017/0018/0021).
  "Ask for a next step" throws in production until Blaze + `firebase deploy --only
  functions`.

**Consequences.**
- `recoveryCoachSessions` docs carry token/latency/cost fields the client schema doesn't
  model; `makeConverter`'s Zod parse strips them on read, so the client history is clean.
- The coach is goal-scoped; a general "recovery, no specific goal" conversation is not
  supported (the request requires `goalId`). Revisit if a use case appears.
- `bumpUsageCounters` is now the extraction point any future non-general AI surface should
  reuse to share the budget without touching `aiCallLogs`.

---

## ADR-0024 — Accountability partner: email-identified grant, two Cloud Functions, projection-only reads
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 15F — Accountability Partner

**Context.** `docs/RECOVERY_PRIVACY.md` §6 lets the owner share a recovery goal with a
partner under one of five permission scopes (`streak-only`, `status-only`,
`check-in-completed`, `selected-summary`, `custom-limited-access`), with an optional
expiry and revocation. §3: "accountability partners never receive direct Firestore
access — all partner reads go through an authenticated, authorized Cloud Function that
returns only the explicitly granted projection", and grant configuration is itself
Cloud-Function-mediated. Open questions: how is a partner identified/authenticated, and
how much of a partner-facing UI belongs in 15F.

**Decision.**
- **The partner is another Mastery user, identified by verified email.** The grant stores
  `partnerEmail` (lowercased). `getAccountabilityProjection` reads `request.auth.token.email`
  + `email_verified` and requires an exact match against an active, unexpired, unrevoked
  grant. No invite tokens, no unauthenticated entry point — matches §3's "authenticated,
  authorized Cloud Function" literally and keeps the surface small.
- **Two functions, both Cloud-Function-only writes / reads:**
  `configureAccountabilityPartner` (`op: "create" | "update" | "revoke"`, owner-scoped, the
  only writer of `recoveryAccountabilityPartners`) and `getAccountabilityProjection` (the
  only way a partner sees anything). `firestore.rules` `isServerMediatedRecoveryWrite` now
  also matches `collection == 'recoveryAccountabilityPartners'`. The **owner** still reads
  their own grants directly (for the config list); a **partner** never touches Firestore.
- **The projection is built by scope, allowlist-style** (`accountability-projection.ts`).
  Each scope fills only its fields; everything else stays `null`. `custom-limited-access`
  exposes only the ticked subset of
  `{recoveryStatus, currentStreak, daysOnTrack, checkedInToday, lastCheckInDate}`. A bare
  `setbackCount` (a number, never narrative) is included only when the grant opts in *and*
  the scope is `selected-summary` or `custom`. Reflections, HALT, triggers, relapse
  `whatHappened`/`lessonsLearned`, coping actions, journal, and coach sessions are never
  reachable through this path.
- **Streak is recomputed inside the function** (consecutive most-recent `stayedOnTrack`
  days) rather than importing `src/features/recovery/recovery-progress.ts` — `functions/`
  and `src/` are separate packages, same reason as the coach context builder (ADR-0023).
- **Partner-facing UI ships in 15F**: a `/recovery/partner?owner=…&grant=…` page
  (`PartnerProjectionView`), **outside** the Recovery Center PIN gate — the viewer is the
  partner, not the owner, and has no PIN. The owner shares the relative link from the
  goal detail view's `AccountabilitySection`.
- **Reminder delivery is out of scope** — §6's "whether check-in reminders are sent" is
  stored as `sendCheckInReminders` on the grant; actually sending them is Layer 17.
- **Not deployed** — same as every Cloud Function so far (Spark plan). Configuring a
  partner or viewing a projection throws in production until Blaze + `firebase deploy
  --only functions`.

**Consequences.**
- Layer 15 (Recovery Center, 15A–15F) is complete. `RecoveryHomeView`'s "Coming next"
  block is removed.
- The `fakes.ts` Firestore double gained an `update()` method (merge semantics) — the
  first recovery function to use `ref.update()` rather than `set()`.
- A partner must have a Mastery account with a verified email on the same address the owner
  entered; there is no flow for inviting someone who has not signed up. Acceptable for
  now; revisit if needed.

---

## ADR-0025 — Reports: client-composed, print-to-PDF, metadata-only persistence
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 16 — Reports & PDF Export

**Context.** `docs/PRODUCT_REQUIREMENTS.md` §11 asks for weekly / monthly / quarterly /
annual / goal / habit / focus / KPI / planning-vs-execution reports, "server-controlled PDF
where practical", Mastery branding, user-chosen sections, missing-data handling, a
downloadable record, export metadata, and a hard rule that Recovery Center data is never
included. But the app is a **static export** (ADR-0015 — no SSR, no route handlers) and
Cloud Functions are **not deployed** (Spark plan, ADR-0017 onward), so there is no server to
control a PDF today.

**Decision.**
- **A report is a period + a set of sections, not nine separate report types.** The
  spec's "weekly/monthly/quarterly/annual" becomes the *period* (a preset that fills a date
  range, plus "custom"); "goal/habit/focus/KPI/planning-vs-execution" become selectable
  *sections* (`summary`, `goals`, `habits`, `focus`, `kpis`, `planning`). One flexible
  report beats nine near-duplicate ones.
- **The report body is composed on the client.** `report-data.ts` is an aggregation
  service — one `Promise.all` over the goal / milestone / task / habit / habitLog /
  focusSession / kpi / kpiEntry repositories, filtered to the range, returning one
  `ReportData`. It **never reads a recovery collection** (allowlist by construction), which
  is how §11's "never leak Recovery Center information" is guaranteed — plus a test that
  asserts it.
- **PDF = the browser's "Save as PDF".** `ReportDocument` renders a branded, paper-styled
  page (`data-report-print`); a small `@media print` block in `globals.css` isolates it and
  hides app chrome (`data-print-hide`); a "Download PDF" button calls `window.print()`.
  No new dependency (no `jspdf` / `pdfmake` / `@react-pdf/renderer`), no server.
- **`users/{uid}/reports/{reportId}` stores metadata only** — title, period, range,
  sections, `format: "pdf"`, `generatedAt`. It is the "downloadable record" / history and
  the "export metadata" the spec asks for. Client-written under the generic owner-only rule
  (a metadata row carries nothing sensitive) — no rules change, no Cloud Function.
- **A future `generateReportPdf` Cloud Function is the documented server path** but is
  **not stubbed** this layer — unlike the AI/recovery functions it would have no consumer
  today (the client path is complete), and stubbing it would be speculative. Revisit when
  the project moves to Blaze / App Hosting.

**Consequences.**
- Reads are capped at one repository page (100 rows) per collection, the same cap every
  other feature already lives with — a report over a very long "annual" period on a very
  active account could undercount. Flagged as a known limitation.
- "Completed in period" for goals / milestones is approximated from `updatedAt` (no
  dedicated completion-timestamp field), the same approximation the Execution Tracker
  (ADR-0016) and the weekly summary (Layer 14) already make.
- The report renders in a fixed light "paper" palette regardless of the app theme — a
  deliberate document metaphor, and it prints correctly.

---

## ADR-0026 — Notifications: in-app centre + client reminder scan now; FCM push deferred
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 17 — Notifications

**Context.** `docs/PRODUCT_REQUIREMENTS.md` §12 asks for in-app **and** Firebase Cloud
Messaging notifications: task / event / habit / milestone / planning-review / KPI reminders,
weekly-summary alerts, user preferences with quiet hours and timezone, read/unread state,
safe deep links, permission handling, token lifecycle, and duplicate prevention. But the
app is a **static export** (ADR-0015) with **no deployed Cloud Functions** (Spark, ADR-0017
onward), and FCM needs a service worker, a VAPID key, a token store, and a server-side
send — none of which have a runtime today.

**Decision.**
- **Ship the in-app notification centre in full.** `/notifications` lists notifications
  (unread / earlier), marks read/unread, dismisses (archive), deep-links each row to a safe
  in-app route (`notificationHref`), and shows a preferences panel — category toggles,
  quiet hours (`HH:mm`, midnight-crossing aware), timezone, and the milestone-lead /
  KPI-stale windows. The topbar bell shows an unread badge (`useUnreadNotificationCount`, a
  single bounded read, re-run on navigation).
- **Reminders are produced by an idempotent client-side scan** (`reminder-scan.ts`, a pure
  function; run by `use-notifications.ts` when the page mounts). It reads the goal /
  milestone / task / habit / habitLog / kpi / kpiEntry repositories, resolves "today" and
  "now" in the user's timezone, and returns the reminders that should exist. Each carries
  `dedupeKey = <type>:<relatedId>:<localDay>`; the caller creates only the ones not already
  present, so re-running is safe. Category preferences gate whole reminder types.
- **`notifications` and `notificationPreferences` are client-written** under the generic
  owner-only rule — no server mediation (a reminder row and a preferences singleton carry
  nothing sensitive; Recovery is excluded by construction, not by a rule). No
  `firestore.rules` change. The existing Layer 14 `generateWeeklySummary` still writes the
  `weekly-summary` row via the Admin SDK; its rows simply lack a `dedupeKey` (schema
  default `""`).
- **FCM push is deferred.** No service worker, no `registerPushToken`, no VAPID key, no
  send/sweep function this layer. The `pushEnabled` preference is stored (so the UI is
  complete) but inert, with a "not available in this build yet" note. Push — and a
  timezone-exact server sweep that works while the app is closed, plus `event-today`
  reminders that need the recurrence engine — arrive together when the project moves to
  Blaze / App Hosting. Same lineage as the deferred `generateReportPdf` (ADR-0025).

**Consequences.**
- Reminders only refresh while the app is open and the notifications page is visited;
  there is no background delivery. Acceptable for an in-app-only centre; the server sweep
  fixes it later.
- The scan reads one repository page (100 rows) per collection — the same cap the rest of
  the app uses.
- "Planning-review due" is approximated from a goal's `updatedAt` vs its `reviewFrequency`
  cadence (no dedicated last-reviewed field) — same approximation family as Layers 14 / 16.
- `notificationPreferences` is a new collection; added to `docs/DATA_MODEL.md`.

---

## ADR-0027 — i18n: `next-intl` client-side, English + Dutch, migrate a slice not the whole app
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 18 — Internationalization & Theme
**Builds on:** ADR-0005 (English + Dutch at launch, Spanish architected-for), ADR-0015 (static export)

**Context.** `CLAUDE.md` §3 requires "no hardcoded user-facing strings — everything through
the i18n layer (`next-intl`)". Layers 1–17 shipped with English string literals throughout
(~127 test files, dozens of feature views). Layer 18 must add the i18n architecture and
Dutch. A full string migration across 17 layers of features is not a one-session task and
retro-fitting `useTranslations` into every component that a feature-view test renders would
churn ~30 test files at once.

**Decision.**
- **`next-intl` v4, client-side only.** The app is a static export (ADR-0015) — no
  middleware, no `[locale]` route segment, no `next-intl/plugin`, no server
  `getRequestConfig`. `src/i18n/I18nProvider` (outermost in `Providers`) reads the locale
  from `localStorage` via a `useSyncExternalStore` `localeStore` (mirrors `lib/theme.ts`'s
  `themeStore`), loads the bundled `messages/<locale>.json`, and feeds
  `NextIntlClientProvider`. `useTranslations()` works in every client component under it.
  `localeStore` also keeps `<html lang>` in sync and reacts to cross-tab changes.
- **English + Dutch catalogues** (`messages/en.json`, `messages/nl.json`), kept
  structurally identical (a test asserts the key sets match). English mirrors the
  pre-i18n copy so untouched assertions keep passing.
- **Migrate a coherent, visible slice this layer, not everything:** the sidebar / bottom
  navigation, the new **Settings** page (language picker + theme + profile), and the
  **Notifications** feature (view + preferences). Everything else stays English and is an
  explicit, tracked **incremental migration backlog** — §3 becomes an *enforced-going-
  forward* rule (new strings use `useTranslations`; each domain is migrated as it is next
  touched). Deliberately left for the backlog: breadcrumbs, page headers, and the shared
  `EmptyState` / `ErrorState` / `LoadingState` defaults — i18n-ing those would force ~30
  feature-view test files to add the provider in one commit.
- **Theme was already built** (Layer 2 — `themeStore`, `ThemeProvider`, `ThemeToggle`).
  Layer 18's "Theme" contribution is surfacing it on the Settings page; locale, like
  theme, is `localStorage`-only (cross-device sync via a Firestore mirror is a follow-up).
- **Test helper `src/test/intl.tsx`** (`renderWithIntl` / `IntlWrapper`) wraps
  `NextIntlClientProvider` with the English catalogue by default, so the four migrated test
  files opt in with a one-line change.
- **New dependency:** `next-intl@^4` (documented here per §8).

**Consequences.**
- Most of the app is still English regardless of the locale toggle until the backlog is
  worked through. The toggle visibly affects navigation, Settings, Notifications, and
  `<html lang>` today.
- A `nav` message key is derived from a destination's href (`/plan/goals` -> `nav.items.plan_goals`,
  `_` not `.` to avoid next-intl's key nesting); a component pairs `t.has(key) ? t(key) : item.label`
  so an unkeyed destination still shows English.
- ICU features (`{count}` plurals, dates/numbers via `useFormatter`) are available now for
  new strings.

**Follow-up (2026-09-06) — shared page chrome migrated (the safe subset).** `SearchTrigger`,
`ModulePlaceholder`, and `SectionLanding` now use `useTranslations`; new `chrome.*`
namespace in both catalogues (`SectionLanding` also picks up the nav-section /
nav-item labels via the existing `t.has(navMessageKey(href)) ? …` pattern). None of the
three is rendered by any test, so **zero test files changed**.

**Deliberately left English (bigger churn than expected):**
- **`BreadcrumbTrail` / `Breadcrumbs`.** A first attempt to translate the trail via
  `useTranslations` broke **28 test files / 128 tests**: 30 feature-view components render
  `<BreadcrumbTrail />` inside their `<PageHeader>`, and their `render(<XxxView />)` tests
  have no `NextIntlClientProvider`. Reverted — `buildBreadcrumbs` stays a pure
  English-fallback function and the labels come from the (English) nav config. Same
  blast-radius class as the state components below.
- **`EmptyState` / `ErrorState` / `LoadingState` default strings** — making them consume
  `states.*` needs the ~31 view-test files that exercise a loading/error branch switched
  to `renderWithIntl`.
- **Per-domain feature-view copy** (Plan / Focus / Act / Grow / Analytics / Recovery) —
  migrated as each domain is next touched.

The common thread: any string in a component that a `render(<XxxView />)` test mounts
transitively needs those ~30 test files put on `renderWithIntl` in one commit. That
conversion is the real remaining i18n task and is still deferred by the owner
(2026-09-06).

---

## ADR-0028 — PWA: hand-rolled service worker, no build-time PWA plugin
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 19 — PWA & Mobile Readiness

**Context.** `docs/PRODUCT_REQUIREMENTS.md` §15 asks for an installable PWA: manifest,
icons, theme metadata, a service worker, an offline app shell, safe static-asset caching,
update handling, and explicit offline behaviour that never implies uncached cloud data is
available. `RECOVERY_PRIVACY.md` §7 adds: the Recovery Center gets extra scrutiny before
*any* offline storage. The app is a static export (ADR-0015) on Firebase Hosting; Turbopack
+ Next 16 + `output: "export"` make `next-pwa` / `@ducanh2912/next-pwa` integration
fragile.

**Decision.**
- **No PWA build plugin.** `public/sw.js` is a small hand-written service worker (no
  Workbox) — legible, no coupling to the export pipeline, versioned by a `VERSION` const.
  Registered by `src/components/pwa/ServiceWorkerRegister` after `load`, **skipped on
  `localhost`** (a stale dev SW is pure friction), and it auto-activates a new worker
  (`SKIP_WAITING` on `updatefound` → reload on `controllerchange`).
- **Caching strategy:** navigations are network-first → cached copy of that URL → `/offline`;
  `/_next/static/**` + icons + manifest are cache-first; everything else is network with a
  cache fallback. Cross-origin (Firestore / Auth / Google APIs) is never intercepted.
- **Recovery Center is fail-closed offline.** `sw.js` never writes a `/recovery*` navigation
  to the cache and never serves one from cache — offline, it returns `/offline` rather than
  a stale private page. Satisfies §7 without needing a separate storage policy (there is no
  offline recovery data — all recovery reads are the Firestore client SDK, which is
  offline-aware on its own).
- **Icons are generated, not hand-drawn assets.** A one-off Node script (built-in `zlib`,
  no `sharp`) rasterised an indigo "M" monogram to `icon-192/512`, a padded
  `icon-maskable-512`, and a 180px `apple-touch-icon`. Plain but valid; a designed icon set
  can replace the files without any code change.
- **Install affordance in Settings, not a banner.** `useInstallPrompt` captures
  `beforeinstallprompt`; `InstallButton` (Settings) shows only where the browser supports it
  and the app isn't already installed. No intrusive install prompt.
- **Offline indicator:** `useOnlineStatus` (`useSyncExternalStore` over `online`/`offline`)
  drives a thin fixed `OfflineBanner` in `Providers`, on every route.
- **Hosting headers** (`firebase.json`): `/sw.js` is `no-store` + `Service-Worker-Allowed: /`;
  `/manifest.webmanifest` gets `application/manifest+json`.

**Consequences.**
- Offline support is an **app-shell cache only** — it lets already-visited pages and static
  assets load without a connection; it does **not** make Firestore data available offline
  (the offline page and banner say so). Full offline data would need IndexedDB persistence
  + the Firestore offline cache, a later decision.
- No new npm dependency.
- iOS install is manual (Add to Home Screen) — `beforeinstallprompt` is Chromium-only;
  `InstallButton` simply renders nothing there.

---

## ADR-0029 — Security hardening: CSP with `'unsafe-inline'`, App Check wired-not-enforced
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 20 — Security Hardening

**Context.** `CLAUDE.md` §5 and `docs/SECURITY.md` §5–6 require App Check on Firestore /
Storage / Functions, a Content-Security-Policy that restricts `script-src` / `connect-src` /
etc. with "no inline script except the pre-hydration theme setter with a nonce/hash", and
the standard transport headers. The app is a **static export** (ADR-0015) on Firebase
Hosting (Spark), with **no deployed Cloud Functions**.

**Decision.**
- **All security headers ship as a `firebase.json` `"source": "**"` header block** — CSP,
  HSTS (2y, `includeSubDomains; preload`), `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy:
  same-origin-allow-popups`, `Cross-Origin-Resource-Policy: same-origin`, a deny-all
  `Permissions-Policy`, `X-DNS-Prefetch-Control: off`. Verified by
  `tests/unit/security-headers.test.ts`.
- **`script-src` uses `'unsafe-inline'`, not a nonce/hash — accepted deviation from
  SECURITY.md §6.** A static export has no server to mint a per-request nonce, and Next's
  inline `__next_f` hydration scripts have no stable hash. The residual risk is bounded by
  `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, a tight `connect-src`
  (only `'self'` + Firebase / Google endpoints), React auto-escaping, and the single
  audited `dangerouslySetInnerHTML` (the constant theme script). A move to Firebase App
  Hosting / SSR later unlocks nonce + `strict-dynamic` — its own ADR then.
- **CSP allowlist is Firebase- and Google-sign-in-shaped:** `connect-src` covers
  `*.googleapis.com` / `*.firebaseio.com` / `firebase.googleapis.com` / `*.cloudfunctions.net`
  / `*.run.app`; `frame-src` covers `*.firebaseapp.com` (auth handler) + `accounts.google.com`
  + `apis.google.com` + `www.google.com` (reCAPTCHA for App Check); `script-src` adds
  `apis.google.com` + `gstatic.com` + `google.com`. `COOP: same-origin-allow-popups` because
  Google auth uses `signInWithPopup`.
- **App Check is wired but a no-op.** `src/lib/firebase/app-check.ts` `ensureAppCheck(app)`
  runs right after `initializeApp` (browser only, never on the emulator) and initializes
  `ReCaptchaV3Provider` **only when `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` is set** —
  loaded via dynamic import so the App Check bundle is absent otherwise. The owner sets the
  key and turns on **enforcement** in the Firebase console; init failures are swallowed.
- **One `firestore.rules` tightening:** the profile `email` is frozen on update (it is
  owned by Firebase Auth; a client rewriting the Firestore copy just desyncs it). Rules
  test added (`tests/rules/firestore.rules.test.ts`); the mandatory emulator run is
  deferred as it has been all session (sandbox JDK restriction). No `storage.rules` change
  — owner-only + image/PDF + 10 MB is the entire surface until an upload feature exists.
- **`npm audit`:** 6 moderate advisories, all transitive under `firebase-admin` →
  `@google-cloud/storage` → `teeny-request` / `retry-request`. `firebase-admin` at the repo
  root is **dev-only** (server helper + rules-testing) and is never in a shipped bundle
  (the export has no server; `functions/` pins its own `firebase-admin@14`). No forced
  breaking downgrade; revisit when upstream ships a patched line.

**Consequences.**
- If a future third-party embed (analytics, a widget) is added, its origin must be added to
  the CSP explicitly — a silent failure otherwise (no report-uri is configured; add one if
  CSP tuning gets active).
- App Check gives *no* protection until the owner completes the console steps; the wiring
  just means it's a config change, not a code change.

---

## ADR-0030 — Testing program: Playwright e2e, axe-in-jsdom a11y, a coverage floor
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 21 — Complete Testing Program

**Context.** `docs/TESTING_STRATEGY.md` names eleven test types and 24 critical journeys;
Layers 1–20 shipped unit / schema / component / rules / integration / function tests as
they went. Layer 21 consolidates: it must land the **e2e** pillar, an **accessibility**
pillar, a **coverage** gate, and an honest map of every journey to its test. The sandbox
can't run the Firebase emulators (JDK loopback restriction, since Layer 9) or install
Playwright browsers.

**Decision.**
- **e2e = Playwright** (`@playwright/test`), `tests/e2e/` (5 specs, journeys 1/2/4/6/8/15/16/17/20/24),
  each run on **chromium-desktop + mobile-safari** — the second project also discharges the
  *responsive* type. `playwright.config.ts`'s `webServer` starts `npm run dev` with
  `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`; specs use role/label selectors and assert
  persistence across reloads (so they prove the Firestore round-trip, not just local state).
  Scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:install`. **Written, not executed
  in-session** — browsers/emulators aren't available here; they run in CI.
- **a11y = axe-core in jsdom** (`axe-core`, not `jest-axe`) via `src/test/a11y.ts`
  `expectNoAxeViolations(container)`, with `color-contrast` + `region` disabled (no layout
  in jsdom). One dedicated file (`src/test/a11y.test.tsx`) covers the shared states, the
  offline banner, the sidebar nav, and a report document; **this runs** as part of
  `npm test`. New views add an entry or an inline assertion.
- **coverage = `@vitest/coverage-v8`** with `reporter: text-summary/html/json-summary` and
  **thresholds pinned at the current baseline** (≈ 54% stmts / 57% lines / 60% branches /
  49% funcs) over `src/features` + `src/lib` + `src/components` + `src/i18n` + `src/config`,
  excluding `*-repository.ts` / `*-client.ts` / `src/lib/firebase/**` / `src/providers/**` /
  `src/app/**` (exercised by the emulator + e2e suites, not this one). The gate means
  "coverage can only hold or rise"; a coverage sprint is out of scope for the *program*
  layer. Script: `test:coverage`.
- **The journey matrix in `TESTING_STRATEGY.md` §4 gets a "Covered by" column** — every one
  of the 24 has a named automated owner (e2e where browser-shaped, otherwise component /
  schema / rules / function / integration). Journey 3 (real Google popup) stays
  manual-only; the mocked-provider path is component-tested.
- **New devDeps:** `@playwright/test`, `axe-core`, `@vitest/coverage-v8` (documented per §8).

**Consequences.**
- CI must run four suites — `npm test` (+ coverage gate), `functions:test`, `test:rules` +
  `test:integration` (emulator), `test:e2e` (Playwright + emulator + browsers). Wiring that
  into an actual pipeline is Layer 22.
- e2e + rules + integration remain "green in CI, unrun locally in this environment" — the
  same standing limitation every layer since 9 has carried; it is not new debt from Layer 21.
- The coverage floor is modest; treat it as a ratchet, not a target.

---

## ADR-0031 — CI/CD: GitHub Actions, deploy-from-`main`, emulator + Playwright in CI
**Date:** 2026-09-05 · **Status:** accepted · **Layer:** 22 — Deployment & CI/CD
**Builds on:** ADR-0002 (single `main`), ADR-0008 (project ids), ADR-0015 (static export)

**Context.** Every layer already runs the §9 gate locally and deploys by hand per §10.1.
Layer 22 automates that: run the full test program (Layer 21) on every push/PR and deploy
production from `main`. Constraints — single Firebase project on Spark (no Functions
deploy, no separate staging project yet), a static export, and a repo whose CI has to be
authored without being able to run GitHub Actions from here.

**Decision.**
- **GitHub Actions**, one verification workflow (`ci.yml`) + one preview workflow
  (`pr-preview.yml`) + `dependabot.yml`. Node pinned by `.nvmrc` (24) and read via
  `actions/setup-node`'s `node-version-file`.
- **`ci.yml` = five jobs**: `app` (typecheck / lint / format / `test:coverage` / prod
  build), `functions` (its own package suite), `emulator` (`test:rules` + `test:integration`
  under `firebase emulators:exec`, JDK 17), `e2e` (`test:e2e:install` then Playwright under
  `emulators:exec` on the reserved `demo-mastery` id, JDK 17), and `deploy`
  (`needs: [app, functions, emulator, e2e]`, `if: push && ref == refs/heads/main`). The
  four verification jobs run in parallel; deploy waits for all of them.
- **Deploy from `main`, in CI, using a service-account JSON** written from
  `secrets.FIREBASE_SERVICE_ACCOUNT` to `$RUNNER_TEMP` and exposed as
  `GOOGLE_APPLICATION_CREDENTIALS`. `--only hosting,firestore:rules,firestore:indexes,storage`
  — **`functions` is deliberately absent** (Spark; ADR-0017). A `production` GitHub
  Environment scopes the secret and records the deploy URL.
- **Web config is inlined at build time** (`output: "export"`), so every build step —
  `app`, `deploy`, `pr-preview` — receives the `NEXT_PUBLIC_FIREBASE_*` values from repo
  secrets. `NEXT_PUBLIC_APP_ENV=production` on release builds (shell env beats
  `.env.local`).
- **PR previews** publish to a `pr-<number>` Hosting channel (7-day expiry) on the same
  project — a separate URL, no production data path. Skipped for forked PRs (no secrets).
- **The manual §2a release stays the documented fallback** until the owner adds the
  secrets; the workflow doesn't break anything by existing without them (it just fails the
  `deploy`/`preview` job, which is skipped on forks and easy to re-run once configured).
- **`test:e2e` / `test:rules` / `test:integration` are CI-first.** They have never run in
  this build's sandbox (emulator loopback restriction since Layer 9; Playwright browsers
  uninstallable). `ci.yml` is where they actually execute. A tiny
  `tests/unit/ci-workflow.test.ts` parses `ci.yml` and asserts the job graph, the gate
  commands, and that the deploy `--only` list never contains `functions` — so a bad edit
  to the pipeline fails `npm test`.

**Consequences.**
- Owner has two one-time setup tasks: add the repo secrets (§3 of `DEPLOYMENT.md`), and —
  when ready — provision a real `staging` project and split `pr-preview` onto it (the
  ADR-0008 deferral).
- Adding a Cloud Function later means: move to Blaze, add `functions` to the `deploy`
  `--only` list and a `functions` deploy step, add the AI provider secret to the
  `functions` env. `ci-workflow.test.ts` will need its `not…functions` assertion relaxed
  then.
- CI wall-clock is dominated by `e2e` (browser download + emulator boot + two viewports);
  acceptable for a per-push gate, revisit with sharding if it drags.

---

## ADR-0032 — Layer 23: an enforced bundle budget, a deferred command palette, no CWV sink yet

**Status:** accepted (2026-09-05) · **Layer:** 23 — Performance, Cost & Accessibility

**Context.** Layer 23 is the optimisation pass. The app is a static export SPA on the
Spark plan, so the levers are initial JS, route splitting, Firestore read volume, and
(future) Cloud Function cost. Most guardrails were already honoured — modular Firebase
imports, one-time reads only, `DEFAULT_PAGE_SIZE`/`MAX_PAGE_SIZE`, aggregation hooks on the
dashboard, no charting dependency. What was missing was a *regression guard* and a written
record.

**Decision.**
- **`scripts/analyze-bundle.mjs` + a budget gate.** Walks `out/_next/static`, reports gzip
  sizes, fails on breach. Budgets: total JS 900 KiB gzip / 3200 KiB raw, largest chunk
  240 KiB gzip — each ~10–25% above today's real numbers. Runs locally (`npm run analyze`
  / `build:analyze`) and in CI (`app` job, after `build`). It is a **ratchet like the
  coverage floor** (ADR-0030): a moved budget needs a line + reason in
  `docs/PERFORMANCE.md` §2.
- **Command palette behind `next/dynamic`.** `cmdk` is never on screen at first paint; the
  shell mounts `CommandPalette` only after the first ⌘K (latched so re-opens don't
  re-fetch). The shortcut handler stays in `ShellProvider` so the key works before mount.
- **No `web-vitals` dependency yet.** Real CWV collection needs a callable to POST to —
  that's a Blaze/Functions concern. Documented as a deferred item; Lighthouse-against-live
  is the interim check.
- **Accessibility: two more `axe` cases** (`FormField` wiring, `Sparkline` name). No CSS
  change — reduced-motion, focus rings, skip link, landmarks were already there.
- **Not done on purpose:** deferring `firebase/functions` + `firebase/storage` out of the
  eager client singleton (touches every repository — recorded as an open recommendation in
  `docs/PERFORMANCE.md` §3), and a real `_next/static` build-id strategy.

**Consequences.**
- A dependency that adds >~100 KiB gzip now fails CI until someone justifies the budget
  bump. `scripts/**/*.mjs` gets a `no-console: off` ESLint override (Node CLI tooling).
- `tests/unit/bundle-budget.test.ts` covers the script logic and asserts the real build is
  within budget when `out/` exists; `ci-workflow.test.ts` asserts the CI `analyze` step.
- `web-vitals` wiring, colour-contrast in CI, and the Firebase-SDK deferral are carried
  forward in `docs/PERFORMANCE.md` §3/§6.

---

## ADR-0033 — Brand pivot: Gold/Obsidian/Ivory/Slate design system, light as primary theme

**Status:** accepted (2026-09-06) · **Owner request:** full UI foundation rebuild

**Context.** The owner requested a full visual-identity rebuild around the real Mastery
logo assets (`public/brand/mastery-mark.png`, `mastery-logo.png`) — a premium
"gold/obsidian/ivory/slate" system replacing the Layer 2 indigo palette, LIGHT as the
primary theme (not dark), restrained glassmorphism, and a new public marketing landing
page (the root route was a Layer-1 placeholder; no such page existed in the 24-layer
plan). This explicitly supersedes both the Layer 2 indigo tokens and the gold/obsidian
direction is unrelated to — and replaces as the shipped brand — the separate green
"performance instrument" dark-theme exploration published as a design canvas earlier the
same day (that canvas is not implemented; it stays a reference artifact only).

**Decision.**
- **Token values are the owner's exact hex spec**, contrast-checked and adjusted only
  where the raw values failed WCAG for their role: `--border-strong` (light `#7A828D`,
  dark `#6B7480` — the requested tones were 1.5–2.9:1 against the surfaces they outline;
  raised to clear 3:1 non-text contrast), `--ring` (light `#8A6500`, the brief's own "Dark
  Gold" — raw Mastery Gold is only ~2.5:1, too low for a focus indicator), `--subtle`
  (kept verbatim per the owner's spec — a tertiary/placeholder role, not required to hit
  body-text contrast), and every semantic/accent fill (`primary`, `accent`, `warning`)
  pairs with **dark obsidian text**, never white, per the owner's own instruction extended
  consistently to every gold-family fill. Full numbers: `docs/DESIGN_SYSTEM.md` is not yet
  updated to match (tracked below).
- **One token layer, both themes.** Same `--color-*` names in `globals.css` (`:root`,
  `@media (prefers-color-scheme: dark)`, `[data-theme="light"]`, `[data-theme="dark"]`) —
  every existing component (`Button`, `Input`, `Card`, …) re-themes with zero code changes
  because they already consumed semantic tokens, never raw hex (Layer 2 discipline paying
  off). Pillar accents (`--pillar-*`) are untouched — out of scope, not mentioned in the
  brief.
- **New tokens**: `--gold-subtle` (light `#FBF6E8`, dark a deep gold-tinted charcoal) and
  `--glass-fill` / `--glass-border-color` (rgba pairs consumed by `.mastery-glass`, the
  generalized version of Layer-18's `.mastery-glass-card` — blur 24px, an
  `@supports not (backdrop-filter)` opaque fallback, restrained to nav / auth cards /
  floating panels / modals / feature cards, never dashboard tables or forms).
- **New shared components** (`src/components/ui/`): `Logo` (wraps the two real PNG assets
  — `variant="mark"` for the sidebar/compact nav, `variant="full"` for auth/landing;
  intrinsic width/height hardcoded from the real asset dimensions, never redrawn),
  `GlassPanel`/`GlassCard`, `PasswordInput` (show/hide toggle), `ProgressRing`,
  `SectionHeader`. `Button`'s existing `primary`/`outline`/`ghost` variants already satisfy
  Primary/Secondary/Ghost — no new button components.
- **New `src/components/marketing/` tree** + a rebuilt `src/app/page.tsx`: nav (glass,
  scroll-aware opacity, mobile `Sheet` menu), hero, a conceptual (not literal) product
  preview in a glass panel, 3 value-prop cards, the Plan→Focus→Act→Grow loop as 4 steps,
  the Spiritual/Personal/Societal framework as a connected glass-node diagram, an AI
  section, a CTA band, and a footer. Copy is grounded in the app's real, already-shipped
  feature set (Recovery Center isolation, the actual pillar/loop model) — nothing
  fabricated.
- **Auth screens** (`AuthCard`, login/register/forgot-password) now default to the glass
  variant with the full logo and the owner's exact copy ("Welcome back." / "Continue your
  journey.", "Create your MASTERY." / "Build a system around the life you want to live.").
  The sign-up form's fields stay `Name` (not split First/Last) — changing the data model
  is out of scope for a UI-only rebuild.
- **Sidebar** now renders the real logo (`Logo variant="mark"`/`"full"`) instead of a text
  wordmark, in both the expanded and collapsed rail states.

**Consequences.**
- Every already-shipped authenticated screen (dashboard, Plan/Focus/Act/Grow/Analytics,
  Recovery Center, Settings, …) re-themes automatically via the token swap — verified live
  via a headless-Chromium screenshot of `/dashboard`, no regressions, no purple/indigo
  remnants.
- `docs/DESIGN_SYSTEM.md` and `docs/MASTER_SPEC.md` still describe the old indigo palette
  and don't mention a marketing landing page — a documentation-catch-up pass is owed, not
  done in this change (the code + this ADR are the source of truth in the meantime).
- The root route (`/`) is no longer a placeholder; it is a real, public, unauthenticated
  page. It introduces no new backend/data dependency (fully static, no Firestore reads).
- The green dark-theme canvas from earlier the same day remains published as a reference
  artifact but is explicitly not the shipped direction — noted here to avoid future
  confusion between the two.
