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
  accountability-partner access, scheduled jobs, server-controlled PDF generation.

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
  queries once per view; widgets receive already-aggregated props.
- No global "load everything on login". Fetch per route, on demand, paginated.

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

- `next-intl` with locale files in `locales/`. No literal user-facing strings in
  components. `I18nProvider` reads the profile preference, falls back to browser language.
- `ThemeProvider` applies `dark` / `light` / `system`; an inline pre-hydration script sets
  the initial class to avoid theme flash. Preference stored in `users/{uid}.theme`.

## 10. Performance guardrails

Route-level and feature-level code splitting; lazy-load heavy features (calendar, charts,
editors); analyze the bundle each release; review Firestore queries and indexes; paginate;
aggregate; control subscriptions; optimize images; review Cloud Function cold starts;
review AI token cost; monitor Core Web Vitals. Never ship client bundles containing
privileged credentials.
