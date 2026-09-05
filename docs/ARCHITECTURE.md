# Mastery — Architecture

How the code is organized and the patterns every layer follows. Rules here are binding;
`CLAUDE.md` §3 and §8 summarize them.

---

## 1. Layered model

```
┌─────────────────────────────────────────────────────────────┐
│  UI            app/ routes (thin) + components/ + features/  │  React, Tailwind, design system
├─────────────────────────────────────────────────────────────┤
│  Domain logic  services/ + hooks/ + feature domain modules   │  orchestration, rules, derived state
├─────────────────────────────────────────────────────────────┤
│  Data access   repositories/ + Firestore converters         │  user-scoped CRUD, pagination, audit
├─────────────────────────────────────────────────────────────┤
│  Infrastructure lib/firebase, lib/security, providers/,      │  Firebase SDK, App Check, env, errors
│                 Cloud Functions (functions/)                 │
└─────────────────────────────────────────────────────────────┘
```

- A route/page component only: reads params, calls a hook/service, renders states
  (loading / empty / error / success). No Firestore calls, no business rules in pages.
- Hooks bridge UI and services; they expose typed state machines, not raw promises.
- Services hold orchestration and domain rules. They call repositories, never the Firebase
  SDK directly.
- Repositories are the only place that talks to Firestore/Storage. They obtain the
  authenticated UID internally and scope every read/write to `users/{uid}/**`.
- Cloud Functions hold anything that must be trusted: AI calls, Recovery sensitive access,
  accountability-partner access, scheduled jobs. Server-controlled PDF generation is the
  intended long-term path for reports; Layer 16 ships client-composed reports rendered to a
  print-styled page (PDF via the browser's "Save as PDF") because the app is a static
  export and Cloud Functions are not deployed (ADR-0015 / ADR-0025).

## 2. Directory structure

```
src/
  app/                      Next.js App Router routes (thin)
    (auth)/                 login, register, forgot-password
    (protected)/            authenticated shell + module routes
  components/
    ui/                     design-system primitives (Button, Input, Card, ...)
    layout/                 shell: Sidebar, Topbar, BottomNav, Breadcrumbs
    shared/                 cross-feature composites (EmptyState, ErrorState, DataTable)
  features/
    auth/ dashboard/ vision/ plans/ goals/ projects/ milestones/ roadmaps/
    tasks/ habits/ routines/ calendar/ focus/ pomodoro/ journal/ learning/
    reading/ skills/ kpis/ analytics/ reports/ ai-coach/ recovery/
    notifications/ settings/
      each: components/  hooks/  <feature>Service.ts  schema.ts  types.ts
  hooks/                    cross-cutting hooks (useAuth, useMediaQuery, ...)
  lib/
    firebase/               client + admin init, emulator wiring, converters
    validation/             shared Zod helpers, common schemas
    utils/                   pure helpers (dates, formatting, ids)
    security/               CSP, app-check helpers, auth guards
    analytics/              Core Web Vitals + product analytics wrappers
  providers/                React context providers (Auth, Theme, I18n, ...)
  repositories/             user-scoped repository interfaces + Firebase implementations
  services/                 domain services not owned by a single feature (aggregation)
  types/                    shared domain types + inferred Zod types
  styles/                   Tailwind layers, design tokens

functions/
  src/
    ai/ reports/ notifications/ recovery/ scheduled/ shared/
  tests/

docs/  locales/  public/  tests/
```

Keep clear domain boundaries. Never create one oversized global service / hook / context /
page / component.

## 3. Validation & trust boundaries (Zod)

Validate at every boundary where untrusted data enters typed code:

| Boundary | Validated with |
|---|---|
| Form submit | `zodResolver(schema)` via React Hook Form |
| Firestore document read | converter runs `schema.parse` on `snapshot.data()` |
| Cloud Function request | `schema.parse(request.data)` before any logic |
| Cloud Function / AI response | output schema `parse` before returning to client |
| URL / route params | param schema in the route loader/handler |
| Environment variables | one `env.ts` module parsing `process.env` at startup |

One schema per entity in `features/<x>/schema.ts`; the domain `type` is `z.infer` of it.

## 4. Repository pattern

```ts
interface GoalRepository {
  list(opts: PageQuery): Promise<Page<Goal>>;
  get(id: string): Promise<Goal | null>;
  create(input: GoalCreate): Promise<Goal>;
  update(id: string, patch: GoalPatch): Promise<Goal>;
  archive(id: string): Promise<void>;
}
```

- Implementation resolves `uid` from the auth context (client) or verified token (server).
- All queries rooted at `collection(db, 'users', uid, 'goals')`.
- Every write sets audit fields (`createdAt`/`updatedAt` server timestamp, `createdBy`/
  `updatedBy` = uid, `version` increment, `status`).
- Reads run through a typed Firestore converter that normalizes Timestamps to ISO strings
  and validates with Zod.
- List queries are always paginated (`limit` + cursor). No `getDocs` on an unbounded
  collection.

## 5. State, data fetching, real-time

- Prefer one-time reads. Use a real-time listener only where the feature requires live
  updates (e.g. active Pomodoro session, calendar day in view) and always unsubscribe.
- Dashboard and reports read from an **aggregation service** that batches the needed
  queries once per view; widgets receive already-aggregated props. Layer 16's
  `report-data.ts` is one such service: a single `Promise.all` over the domain repositories,
  filtered to the chosen period, returning one `ReportData` object. It only ever reads
  non-recovery collections, so a report can never leak Recovery Center data.
- No global "load everything on login". Fetch per route, on demand, paginated.
- Layer 17's notification reminders are produced by an **idempotent client-side due-item
  scan** (`reminder-scan.ts`, pure) run when the notifications page mounts: it reads the
  same domain repositories, compares against the user's preferences, and creates only the
  rows whose `dedupeKey` isn't already present. A server-side sweep (timezone-exact, works
  while the app is closed, drives FCM push) is deferred to a Blaze move (ADR-0026).

## 6. Error, loading, empty, success states

- A normalized `AppError` type: `{ code, messageKey, cause?, retryable }`. `mapFirebaseError`
  and `mapFunctionsError` convert SDK errors to it.
- Shared components: `LoadingState`, `EmptyState`, `ErrorState` (with retry). Every data
  view renders one of the four states — never a blank screen or an unhandled throw.
- Route-level `error.tsx` and a top-level error boundary catch the rest.

## 7. Routing & layouts

- `(auth)` group: unauthenticated pages, redirect to dashboard if already signed in.
- `(protected)` group: `layout.tsx` enforces auth (redirect to `/login` when signed out),
  renders the responsive shell, and wraps children in the module error boundary.
- Recovery Center routes sit behind an additional privacy gate component, not just the
  auth guard.

## 8. Provider abstraction

- **Calendar**: internal event model behind a `CalendarAdapter` interface; the internal
  implementation is the only one until it is stable. Future Google/Outlook/CalDAV adapters
  implement the same interface.
- **AI**: a `AiProvider` interface in `functions/src/ai/shared`; the concrete provider is
  swappable and its key lives only in function config/secrets.
- **Auth**: Firebase Auth wrapped by `authService` so the rest of the app depends on the
  wrapper, not the SDK.

## 9. Internationalization & theme

- `next-intl` **v4, client-side only** (static export — no middleware / `[locale]` segment /
  plugin). Catalogues live in `messages/<locale>.json` (`en`, `nl`); `src/i18n/I18nProvider`
  (outermost provider) loads the active catalogue and feeds `NextIntlClientProvider`.
  `src/i18n/localeStore` (a `useSyncExternalStore` store like `themeStore`) holds the locale
  in `localStorage`, keeps `<html lang>` in sync, and reacts to browser language on first
  run. `useTranslations()` in client components; new strings must use it (`CLAUDE.md` §3),
  and each domain's existing literals are migrated incrementally — see ADR-0027.
- `ThemeProvider` applies `dark` / `light` / `system`; an inline pre-hydration script sets
  the initial class to avoid theme flash. Locale and theme are `localStorage`-only today
  (a Firestore mirror for cross-device sync is a follow-up).

## 9a. PWA (Layer 19)

- `public/manifest.webmanifest` + generated icons (`icon-192/512`, `icon-maskable-512`,
  `apple-touch-icon`) linked from root `metadata`. `display: standalone`, `start_url:
  /dashboard`.
- `public/sw.js` — a hand-written service worker (no Workbox / no build plugin, ADR-0028).
  Navigations: network-first → cached URL → `/offline`. `/_next/static/**` + icons +
  manifest: cache-first. Cross-origin never intercepted. **Recovery Center navigations are
  never cached and never served from cache** (`RECOVERY_PRIVACY.md` §7). Registered by
  `components/pwa/ServiceWorkerRegister` (skipped on `localhost`), auto-updates via
  `SKIP_WAITING` + `controllerchange` reload.
- `components/pwa/`: `useOnlineStatus` → `OfflineBanner` (in `Providers`, every route);
  `useInstallPrompt` → `InstallButton` (Settings only, no banner).
- Offline support is **app-shell + static assets only** — it does not make Firestore data
  available offline, and the offline page/banner say so.

## 10. Performance guardrails

Route-level and feature-level code splitting; lazy-load heavy features (calendar, charts,
editors); analyze the bundle each release; review Firestore queries and indexes; paginate;
aggregate; control subscriptions; optimize images; review Cloud Function cold starts;
review AI token cost; monitor Core Web Vitals. Never ship client bundles containing
privileged credentials.

**Enforced (Layer 23):** `scripts/analyze-bundle.mjs` (`npm run analyze`) checks the
static export against a gzip budget — total JS, total raw, and largest single chunk — and
fails the build on a breach; it runs in the CI `app` job after `npm run build`. The budget
is a ratchet, not a target: see [`PERFORMANCE.md`](PERFORMANCE.md) for the numbers, the
code-splitting inventory (incl. the `next/dynamic` command palette), the Firestore
read-discipline audit, the Cloud Function cold-start / token-cost review, and the Core Web
Vitals plan.
