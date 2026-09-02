# CLAUDE.md — Mastery Engineering Constitution

This file is the operational contract for building **Mastery**, an AI-Powered Personal
Operating System. Every contributor (human or AI) reads this before touching the
repository. It is authoritative; where a layer request conflicts with this file, stop
and reconcile before coding.

> Tagline: **Plan. Focus. Act. Grow.**
> Source of truth for scope: [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) and the Final Master Prompt PDF.

---

## 1. Project overview

Mastery is a **secure, multi-user, production-grade** personal operating system that
turns long-term vision into measurable daily execution across three life pillars —
**Spiritual, Personal, Societal** — through the loop:

```
Plan  ->  Focus  ->  Act  ->  Grow
```

Planning cascade: Vision → Five-Year → One-Year → Quarter → Month → Week → Day → Task →
Execution → Measurement → Reflection → Improvement.

Stack: Next.js (App Router) + TypeScript strict + React + Tailwind + the Mastery design
system on the frontend; Firebase (Auth, Firestore, Storage, Cloud Functions, Cloud
Messaging, App Check, Emulator Suite) for backend and infrastructure. Hosting and
deployment are **entirely on Firebase** (Firebase App Hosting for the Next.js app).

---

## 2. Repository rules

1. Inspect the repository and read `CLAUDE.md` + all relevant `docs/` before modifying files.
2. Implement **only the requested layer or sublayer**. Never pull work forward from a later layer.
3. Preserve all stable, completed functionality. Do not rebuild completed modules unless a
   dependency forces a controlled refactor (and then record it in `docs/DECISIONS.md`).
4. Reuse existing components, services, hooks, schemas, repositories, and utilities.
5. Keep page components thin. Business logic lives in services, repositories, hooks, domain
   modules, or Cloud Functions — never in a page/route component.
6. Do not introduce placeholder production data, hardcoded user names, or fake statistics.
7. Do not expose secrets, API keys, or privileged credentials in client code or in git.
8. Every layer ends with: updated `docs/BUILD_PROGRESS.md`, a full list of changed files,
   manual test instructions, and an honest list of known limitations.
9. One commit (or a small tight series) per completed layer. See §10.

## 3. Architecture rules

- Strict TypeScript. No avoidable `any`. Prefer `unknown` + narrowing at boundaries.
- Validate **every trust boundary** with Zod: form input, Firestore reads, Cloud Function
  request/response payloads, AI provider output, URL params.
- Separate concerns: **UI ↔ domain logic ↔ data access ↔ infrastructure**.
- Data access goes through **authenticated, user-scoped repositories**. Repositories obtain
  the authenticated UID internally (from the auth context / Admin SDK). UI never passes an
  arbitrary user id for a user-owned record.
- Normalize Firebase errors into a typed app-error shape. Normalize Firestore Timestamps to
  a single canonical representation (ISO string / `Date`) at the converter boundary.
- Every async surface has explicit **loading, empty, success, and error** states.
- Paginate potentially large collections. No unbounded Firestore reads. Prefer one-time
  reads over permanent listeners unless real-time is a stated requirement.
- Dashboard and report data come from **aggregation services**, not per-widget queries.
- Mobile-first; then tablet and desktop. Semantic HTML, keyboard navigable, reduced-motion
  aware, accessible labels/focus/errors.
- No hardcoded user-facing strings — everything through the i18n layer (`next-intl`).
- Audit fields on important records: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`,
  `status`, `version` (+ `archivedAt` where applicable). Server timestamps where appropriate.
- Prefer server-side enforcement over client-side assumptions. Never rely on hidden UI for
  authorization.
- Full structure and patterns: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 4. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Directories / files (non-component) | `kebab-case` | `life-vision/`, `use-auth.ts` |
| React components + their files | `PascalCase` | `PrimaryButton.tsx` |
| Hooks | `useX` camelCase | `useAuth`, `useGoals` |
| Services / repositories | `xxxService`, `xxxRepository` | `authService`, `goalRepository` |
| Zod schemas | `xxxSchema` + inferred `Xxx` type | `goalSchema` → `type Goal` |
| Firestore converters | `xxxConverter` | `goalConverter` |
| Cloud Functions | `camelCase` verb-noun | `masteryCoachQuery`, `generateWeeklySummary` |
| Types / interfaces | `PascalCase`, no `I` prefix | `Goal`, `AuthContextValue` |
| Constants / enums values | `SCREAMING_SNAKE` for consts, `PascalCase` union literals | `MAX_PAGE_SIZE` |
| Test files | `*.test.ts(x)` colocated; rule tests in `functions/tests` or `tests/rules` | `goal.test.ts` |
| Firestore collections | `camelCase` plural | `users`, `lifeVisions`, `weekPlans` |
| Branches | `main` only for this project (see §10) | — |
| Commits | Conventional Commits | `feat(auth): add Google sign-in` |

## 5. Security requirements

- Owner-only Firestore and Storage rules; users read/write only their own `users/{uid}/**`.
- Users cannot assign themselves privileged roles. No client-controlled admin roles; any
  future admin capability uses trusted server-issued custom claims only.
- All AI and all Recovery Center sensitive access flows through **authenticated, authorized
  Cloud Functions**. Provider keys server-side only.
- App Check on Firestore, Storage, and Functions. Input validation on every function.
  Secure CORS. Content-Security-Policy. Secret management via environment / secret manager.
- Environment separation: development, test, staging, production. No production secrets in
  preview environments.
- Emulator-based rules tests are mandatory for any layer that changes `firestore.rules` or
  `storage.rules`.
- Recovery Center: stronger controls — separate collections, privacy gate (PIN first,
  WebAuthn-ready), isolated AI context, never surfaced in dashboard/search/notifications.
- Full detail: [`docs/SECURITY.md`](docs/SECURITY.md), [`docs/RECOVERY_PRIVACY.md`](docs/RECOVERY_PRIVACY.md).

## 6. Testing requirements

- Test types: unit, component, repository, Zod schema, Firestore rules, Storage rules,
  Cloud Function, integration, e2e, accessibility, responsive.
- The 24 critical journeys (registration → PWA install) are enumerated in
  [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md). Each becomes covered by the layer
  that introduces its feature and stays green thereafter.
- Add tests for critical logic in the same layer that adds the logic. Use the Firebase
  Emulator Suite for anything touching Firestore/Storage/Functions.
- A layer is not done while any relevant test fails.

## 7. Layer-by-layer build procedure

For every layer:

1. Read `CLAUDE.md` + relevant `docs/`. Inspect the repo. Review `docs/BUILD_PROGRESS.md`.
2. Identify completed functionality to preserve; summarize current state; list dependencies
   and risks; write a concise implementation plan.
3. Implement only that layer/sublayer.
4. Run the verification commands (§9). Fix every failure.
5. Update `docs/BUILD_PROGRESS.md` and `docs/CHANGELOG.md`. Record any deviation in
   `docs/DECISIONS.md`.
6. List all created/modified/moved/deleted files. Provide manual test instructions. State
   known limitations honestly.
7. Commit and push to `main` (§10). **Do not start the next layer.**

Build order (24 layers, 46 discrete steps counting sublayers). Full list in
[`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) §Build Order:

```
0  Project Constitution            12 KPI, Analytics, Life Score
1  Project Foundation              13 General AI Architecture
2  Mastery Design System           14 Weekly AI Summary
3  Firebase Foundation             15 Recovery Center (15A–15F)
4  Authentication & User Isolation 16 Reports & PDF Export
5  Application Shell & Navigation  17 Notifications
6  Core Data Model & Repositories  18 Internationalization & Theme
7  Dashboard MVP                   19 PWA & Mobile Readiness
8  Plan Domain (8A–8H)             20 Security Hardening
9  Focus Domain (9A–9E)            21 Complete Testing Program
10 Act Domain (10A–10D)            22 Deployment & CI/CD
11 Grow Domain (11A–11D)           23 Performance, Cost, Accessibility
```

Do not begin AI, Recovery Center, reports, push notifications, or external integrations
before authentication, planning, tasks, habits, calendar, and KPI foundations are stable.

## 8. Prohibited implementation patterns

- Business logic inside page/route components.
- A single oversized global service / hook / context / component.
- Passing a user id from the client to scope a user-owned record.
- Client-side AI provider SDKs holding privileged credentials.
- Unbounded / uncontrolled Firestore reads; loading all user data at startup.
- Permanent listeners where a one-time read suffices; duplicate dashboard queries.
- Client-controlled roles or authorization by hiding UI.
- Hardcoded user-facing strings, user names, or production statistics.
- Placeholder/mock data shipped to production paths.
- Committing secrets, `.env` files, or service-account keys.
- Reproducing copyrighted book content the user did not supply.
- Recovery data mixed into general analytics, general AI context, dashboard, or search.
- Upgrading dependencies without a documented reason in `docs/DECISIONS.md`.
- Marking a layer complete with failing typecheck / lint / tests / build.

## 9. Required verification commands

Run all of these before declaring a layer complete (available from Layer 1 onward, once
`package.json` exists):

```bash
npm run typecheck      # tsc --noEmit, strict
npm run lint           # eslint, zero errors
npm test               # unit / component / schema / repository tests
npm run build          # production build must pass
npm run test:rules     # Firestore/Storage emulator rule tests (layers that touch rules)
npm run test:e2e       # end-to-end (from the layer that adds e2e; runs in CI thereafter)
```

If a command does not yet exist for the current layer, say so explicitly in
`docs/BUILD_PROGRESS.md` rather than skipping silently.

## 10. Git & release workflow

- **Single branch: `main`.** When a layer's verification passes (§9) and its definition of
  done is met (§11), commit it and push straight to `origin/main`. No `develop`, no
  `feature/*` branches. (Deviation from the PDF's git strategy — ADR-0002.)
- Remote: `https://github.com/Timmitchel1919-sys/Mastery-personal-management-system.git`
- Conventional Commits, scoped by domain: `feat(goals):`, `feat(calendar):`,
  `security(recovery):`, `test(rules):`, `perf(dashboard):`, `docs:`, `chore:`.
- One commit (or a small tight series) per completed layer. Commit only when acceptance
  criteria pass.
- After committing and pushing a layer, report the changed files, a concise `git diff`
  summary, the verification results, and any known limitations.
- Never force-push. Never rewrite published history. Never delete branches or commits
  without the user asking.
- (History: ADR-0002 policy → manual-approval policy on 2026-08-28 (`75a202f`) → restored
  to commit-and-push-per-layer on the owner's instruction.)

### 10.1 Mandatory end-of-session commit + push + deploy

**Every working session ends with the code committed, pushed, and deployed — no
exceptions.** A session is not finished while local work is uncommitted, `origin/main` is
behind, or the live site does not reflect `main`.

At the end of each session, once §9 verification is green and §11 is met:

1. **Commit** all layer changes to `main` with a Conventional Commit message (§10 rules,
   plus the `Co-Authored-By` trailer).
2. **Push** to `origin/main`
   (`https://github.com/Timmitchel1919-sys/Mastery-personal-management-system`).
3. **Deploy** the result so it is live at
   **`https://mastery-personal-mgmt-system.web.app/`**:
   ```bash
   npm run build   # next build → static export to out/ (ADR-0015)
   firebase deploy --only hosting,firestore:rules,firestore:indexes,storage \
     --project mastery-personal-mgmt-system --non-interactive
   ```
   Deploy targets the production Firebase project **`mastery-personal-mgmt-system`**
   (`.firebaserc` `default`) on the **Spark (free) plan** — hosting + Firestore/Storage
   rules + indexes only. **Do not add `functions`** to this command: Cloud Functions
   deploy needs the Blaze plan and no function is shipped yet (revisit at the AI /
   Recovery layers). Never deploy to the emulator-only `demo-*` ids.
4. **Report** the commit SHA, the `git push` result, and the deployed Hosting URL +
   release id. If any step fails, say so explicitly — do not report the session as done.

The pipeline is wired (ADR-0015): `output: "export"` in `next.config.ts`, `hosting` block
in `firebase.json` (`public: "out"`, `cleanUrls`). If a future layer needs SSR, middleware,
or server route handlers, that forces a move to Firebase App Hosting (needs Blaze) —
record it as a new ADR and update this section. Runbook: `docs/DEPLOYMENT.md` §2a.

## 11. Definition of done (every layer)

A layer is complete only when **all** hold:

1. Implementation matches the approved specification for that layer.
2. Existing functionality still works.
3. `typecheck` passes. 4. `lint` passes. 5. Relevant tests pass. 6. Production `build` passes.
7. Security rules tested where relevant. 8. Mobile behavior verified. 9. Accessibility checked.
10. Loading, empty, and error states exist. 11. No secrets exposed.
12. No unrelated future features introduced.
13. `docs/BUILD_PROGRESS.md` updated. 14. Changed files listed. 15. Manual test instructions supplied.
16. Known limitations documented honestly.
17. The layer is committed and pushed to `origin/main`, **and** deployed live to
    `https://mastery-personal-mgmt-system.web.app/` per §10.1, with the commit SHA and
    deployed release id reported.

Never declare completion while failures remain.
