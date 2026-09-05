# Mastery — Deployment

Mastery is hosted and deployed **entirely on Firebase**. Full deployment automation lands
in **Layer 22**; this document is the target and is filled in as infrastructure is created.

---

## 1. Environments

| Environment | Purpose | Firebase project id |
|---|---|---|
| development | local (emulators) + shared dev | `mastery-personal-mgmt-system` |
| test | automated test / emulator CI | `demo-mastery` (emulator-only, no cloud project) |
| staging | pre-production verification | _TBD — create `mastery-personal-mgmt-stg` before Layer 22_ |
| production | live | **`mastery-personal-mgmt-system`** |

> Created 2026-08-28 (Layer 3). The requested id `mastery-personal-management-system` is 34
> characters; GCP project ids are capped at 30, so the closest available id was used
> (ADR-0008). Until staging/prod are split (Layer 22), `mastery-personal-mgmt-system` serves
> as the single cloud project and `demo-*` ids serve the emulator-only test path.
> Web SDK config lives in `.env.local` (git-ignored); `.env.example` documents every key.
> Default Functions region: `europe-west1`.

## 2. Hosting model

- **Frontend (Next.js App Router):** **static export (`output: "export"`) → Firebase
  Hosting** on the Spark (free) plan (ADR-0015). The app is a client-side SPA against the
  Firebase JS SDK — no server runtime is used. ADR-0003 (Firebase App Hosting) is the
  fallback target for when a layer needs SSR / middleware / server route handlers; App
  Hosting requires the Blaze plan.
- **Backend:** Firebase Authentication, Cloud Firestore, Firebase Storage, Cloud Functions,
  Cloud Messaging, App Check — same Firebase project per environment. Cloud Functions
  deploy needs Blaze and is not part of the per-session release yet.
- **Source control:** GitHub — `https://github.com/Timmitchel1919-sys/Mastery-personal-management-system.git`,
  single `main` branch (ADR-0002).

## 2a. Mandatory per-session release (CLAUDE.md §10.1)

Every session ends with: **commit → push `origin/main` → deploy live.** ✅ **Pipeline wired
2026-09-02** — first live deploy done (Layer 9D session).

- Live URL: **https://mastery-personal-mgmt-system.web.app/**
- Firebase project: `mastery-personal-mgmt-system` (`.firebaserc` `default`, Spark plan)
- GitHub: https://github.com/Timmitchel1919-sys/Mastery-personal-management-system
- Config: `next.config.ts` → `output: "export"` + `images.unoptimized`; `firebase.json` →
  `hosting` block (`public: "out"`, `cleanUrls: true`, `_next/static` → `max-age=3600,
  must-revalidate`). `src/app/api/health/route.ts` is `force-static` (emitted as a static
  JSON asset).

```bash
# .env.local MUST exist in the build dir (see below), then:
npm run typecheck && npm run lint && npm test
NEXT_PUBLIC_APP_ENV=production NEXT_PUBLIC_APP_URL=https://mastery-personal-mgmt-system.web.app \
  npm run build   # § 9 gate; build → out/
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage \
  --project mastery-personal-mgmt-system --non-interactive
```

Notes / follow-ups:

- **`.env.local` must be present in the build directory.** With `output: "export"` the
  `NEXT_PUBLIC_FIREBASE_*` values are inlined into the JS **at build time** — a build
  without them ships a bundle that throws `Missing Firebase configuration` in the browser.
  Git worktrees do **not** inherit the main checkout's `.env.local`; copy it in first
  (`cp <main-checkout>/.env.local .env.local`). `.env.local` stays git-ignored.
- **Set `NEXT_PUBLIC_APP_ENV=production`** on the release build (shell env wins over
  `.env.local`, which holds `development`). Fold this into a prod env file / CI secret
  store at Layer 22.
- **Do not add `functions`** to the deploy — needs Blaze; no function shipped yet.
- **`_next/static` caching:** Turbopack's static-export chunk filenames are **not**
  guaranteed content-addressed across builds — a redeploy can reuse a filename for changed
  content. So the cache header is `max-age=3600, must-revalidate` (not `immutable`).
  A returning visitor who loaded a *previously broken* build still holds it until that
  hour expires or they hard-reload (Ctrl/Cmd+Shift+R). Revisit with a real build-id
  strategy at Layer 22.
- **Known cosmetic 404:** `<Link>` prefetch for pages inside a route group (`(auth)` /
  `(app)`) requests an RSC `…__PAGE__.txt` payload whose exported filename doesn't match —
  it 404s in the console. Navigation itself works (the `.html` pages serve fine). Fix
  candidates: `trailingSlash: true`, or move off static export.
- `firebase` CLI must be authenticated (`firebase login`) or a CI service account set.

## 3. CI/CD (Layer 22)

**GitHub Actions.** Two workflows, Node pinned by `.nvmrc` (24), plus `dependabot.yml`
(weekly npm + actions updates). ADR-0031.

### `.github/workflows/ci.yml` — on push to `main` and every PR to `main`

| Job | What it runs | Runner needs |
|---|---|---|
| **`app`** | `npm ci` → `typecheck` → `lint` → `format:check` → `test:coverage` (unit + component + a11y, v8 coverage gate) → `build` (production static export). Uploads `out/` + `coverage/` artifacts. | Node |
| **`functions`** | `functions/`: `npm ci` → `typecheck` → `lint` → `test` (vitest, fakes) → `build`. | Node |
| **`emulator`** | `npm run test:rules` + `npm run test:integration` under `firebase emulators:exec`. | Node + JDK 17 |
| **`e2e`** | `npm run test:e2e:install` (Playwright browsers) → `firebase emulators:exec --only auth,firestore,storage --project demo-mastery "npm run test:e2e"` (chromium-desktop + mobile-safari). Uploads `playwright-report/`. | Node + JDK 17 |
| **`deploy`** | `needs: [app, functions, emulator, e2e]`; `if: push && ref == refs/heads/main`. `npm ci` → `build` (prod) → `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --non-interactive` against the production project, auth via a service-account JSON written from `secrets.FIREBASE_SERVICE_ACCOUNT`. GitHub Environment `production` (URL pinned). | Node |

`concurrency` cancels superseded runs per ref. **`functions` is never in the deploy
`--only` list** — needs Blaze + a shipped function (ADR-0017 / ADR-0029); it joins when
that happens.

### `.github/workflows/pr-preview.yml` — on every same-repo PR

Builds with `NEXT_PUBLIC_APP_ENV=staging` and `firebase hosting:channel:deploy
pr-<number> --expires 7d`. Skipped for forked PRs (no secrets). **No production data path
is touched** — a preview channel is a separate Hosting URL on the same project.

### Required repository secrets (owner sets these once)

| Secret | Used by | Notes |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | `deploy`, `pr-preview` | JSON for a service account with **Firebase Hosting Admin** + **Cloud Datastore Index Admin** + rules deploy on the prod project. Paste the whole JSON. |
| `FIREBASE_PROJECT_ID` | `deploy`, `pr-preview` | optional — defaults to `mastery-personal-mgmt-system`. |
| `NEXT_PUBLIC_APP_URL` | `app` | optional — defaults to the live URL. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` … `_MEASUREMENT_ID` | all build steps | the web SDK config (not secret, but environment-scoped); the export inlines them at build time (ADR-0015). |

The `emulator` and `e2e` jobs use the reserved `demo-*` project id and need **no** secret.
The manual per-session release (§2a) stays the fallback while the secrets are being set up.

Security checks: `npm audit` findings are reviewed per ADR-0029 (currently 6 moderate,
all dev-only transitive); a dedicated `audit`/secret-scan job can be added once a policy on
failing the build is agreed.

## 4. Configuration

- `.env.example` (added in Layer 1, extended in Layer 3) documents every variable.
- Client: `NEXT_PUBLIC_FIREBASE_*` web config per environment.
- Server: Functions secrets / Google Secret Manager for AI provider keys and any
  third-party keys.
- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`,
  `storage.rules` added in Layer 3.

## 5. Runbook (to be completed as it becomes real)

| Task | Command / process |
|---|---|
| Release (automated) | push to `main` → `ci.yml` runs the four verification jobs → `deploy` job builds + `firebase deploy` to production. |
| Release (manual fallback) | §2a — `npm run build` then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system --non-interactive` |
| Preview a PR | open the PR → `pr-preview.yml` publishes `pr-<n>` channel (7-day expiry); URL in the run log. |
| Deploy frontend only | `npm run build && firebase deploy --only hosting` (static export in `out/`) |
| Deploy rules only | `firebase deploy --only firestore:rules,storage` |
| Deploy indexes | `firebase deploy --only firestore:indexes` |
| Deploy functions | `firebase deploy --only functions` (needs Blaze; not shipped yet) |
| Rollback frontend | `firebase hosting:rollback`, or re-release a prior version from the Hosting console |
| Rollback functions | redeploy previous function version / `firebase functions:rollback` where available |
| Enable App Check | console + enforce per service (Layer 20) |
| Domain configuration | Hosting custom domain in the Firebase console (Layer 22) |

## 6. Pre-launch checklist (Layer 22)

- [x] CI workflow (`ci.yml`) covers typecheck, lint, format, unit/component/a11y + coverage
      gate, functions suite, rules + integration (emulator), e2e (Playwright + emulator),
      production build — all as blocking jobs before `deploy`.
- [x] `deploy` job gated on all four verification jobs and `push` to `main` only; uses a
      GitHub Environment (`production`) and a service-account secret.
- [x] PR preview channel workflow (`pr-preview.yml`), skipped for forks (no secrets).
- [x] `firebase.json` `--only` list excludes `functions` (Spark plan) — CI cannot
      accidentally attempt a Blaze-only deploy.
- [x] CSP / security headers verified live (Layer 20).
- [x] No secret in any client bundle — only `NEXT_PUBLIC_*` web config is inlined; the
      service account lives only in GitHub secrets and is written to `$RUNNER_TEMP`.
- [ ] **Owner action:** add the repository secrets in §3 (`FIREBASE_SERVICE_ACCOUNT`, the
      `NEXT_PUBLIC_FIREBASE_*` set). Until then, releases use the manual fallback (§2a).
- [ ] **Owner action:** provision `staging` (+ optionally isolated `test`) Firebase
      projects and point `pr-preview` / a `staging` branch at them (ADR-0008 deferral).
- [ ] App Check enforced in staging + production (Layer 20 wiring done; console toggle
      pending — ADR-0029).
- [ ] Cloud Functions deploy added to `ci.yml` `deploy` `--only` list once the project is
      on Blaze and a function ships.
- [ ] Rollback rehearsed: `firebase hosting:rollback` (frontend); prior version from the
      Hosting console.
- [ ] Custom domain configured in the Hosting console (optional).
