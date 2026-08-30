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
**Date:** 2026-08-27 · **Status:** accepted · **Deviates from:** Final Master Prompt §3 and §27

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
