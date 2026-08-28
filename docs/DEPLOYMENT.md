# Mastery — Deployment

Mastery is hosted and deployed **entirely on Firebase**. Full deployment automation lands
in **Layer 22**; this document is the target and is filled in as infrastructure is created.

---

## 1. Environments

| Environment | Purpose | Firebase project id |
|---|---|---|
| development | local + shared dev | _TBD_ |
| test | automated test / emulator CI | _TBD_ (may be emulator-only) |
| staging | pre-production verification | _TBD_ |
| production | live | **`master-personal-manger`** _(pending: user to create the project and authorize the exact id — see ADR-0004)_ |

> The Firebase project is **not created yet**. Layer 3 (Firebase Foundation) is the first
> layer that needs it. Before starting Layer 3, the user creates the Firebase project(s)
> in the console and confirms the exact project id(s) here. A Firebase project id must be
> lowercase, 6–30 chars, `a-z 0-9 -`, starting with a letter — hence the `master-personal-manger`
> slug rather than "Master personal manger".

## 2. Hosting model

- **Frontend (Next.js App Router):** Firebase App Hosting. (The Final Master Prompt names
  Vercel; this project uses Firebase App Hosting instead — ADR-0003.)
- **Backend:** Firebase Authentication, Cloud Firestore, Firebase Storage, Cloud Functions,
  Cloud Messaging, App Check — same Firebase project per environment.
- **Source control:** GitHub — `https://github.com/Timmitchel1919-sys/Mastery-personal-management-system.git`,
  single `main` branch (ADR-0002).

## 3. CI/CD (Layer 22)

On every push to `main` and every pull request, CI runs:

1. Dependency installation (clean, locked)
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run test:rules` (emulator)
6. `npm run build` (production)
7. Security checks where supported (dependency audit, secret scan)

On `main`, after green CI: deploy Firestore rules + indexes, deploy Functions, deploy the
App Hosting build. Preview builds for pull requests where supported. **No production
secrets in preview environments.**

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
| Deploy everything | _Layer 22_ |
| Deploy rules only | `firebase deploy --only firestore:rules,storage` |
| Deploy indexes | `firebase deploy --only firestore:indexes` |
| Deploy functions | `firebase deploy --only functions` |
| Deploy frontend | App Hosting build from `main` |
| Rollback frontend | redeploy previous App Hosting release |
| Rollback functions | redeploy previous function version / `firebase functions:rollback` where available |
| Enable App Check | console + enforce per service (Layer 20) |
| Domain configuration | App Hosting custom domain (Layer 22) |

## 6. Pre-launch checklist (Layer 22)

- [ ] All four environments provisioned and isolated
- [ ] Rules + indexes + functions deploy cleanly per environment
- [ ] App Check enforced in staging + production
- [ ] CSP / CORS / security headers verified
- [ ] No secret in any client bundle or preview environment
- [ ] Rollback tested for frontend and functions
- [ ] CI green on `main`
