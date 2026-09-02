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

On every push to `main` and every pull request, CI runs:

1. Dependency installation (clean, locked)
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run test:rules` (emulator)
6. `npm run build` (production)
7. Security checks where supported (dependency audit, secret scan)

On `main`, after green CI: `npm run build` then `firebase deploy --only
hosting,firestore:rules,firestore:indexes,storage` (static export → Firebase Hosting,
ADR-0015). Functions deploy is added when a Cloud Function ships and the project is on
Blaze. Preview builds for pull requests where supported. **No production secrets in
preview environments.**

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
| Per-session release | §2a — `npm run build` then `firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project mastery-personal-mgmt-system --non-interactive` |
| Deploy frontend only | `npm run build && firebase deploy --only hosting` (static export in `out/`) |
| Deploy rules only | `firebase deploy --only firestore:rules,storage` |
| Deploy indexes | `firebase deploy --only firestore:indexes` |
| Deploy functions | `firebase deploy --only functions` (needs Blaze; not shipped yet) |
| Rollback frontend | `firebase hosting:rollback`, or re-release a prior version from the Hosting console |
| Rollback functions | redeploy previous function version / `firebase functions:rollback` where available |
| Enable App Check | console + enforce per service (Layer 20) |
| Domain configuration | Hosting custom domain in the Firebase console (Layer 22) |

## 6. Pre-launch checklist (Layer 22)

- [ ] All four environments provisioned and isolated
- [ ] Rules + indexes + functions deploy cleanly per environment
- [ ] App Check enforced in staging + production
- [ ] CSP / CORS / security headers verified
- [ ] No secret in any client bundle or preview environment
- [ ] Rollback tested for frontend and functions
- [ ] CI green on `main`
