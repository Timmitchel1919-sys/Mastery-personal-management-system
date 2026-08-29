# Mastery — Security

Security is mandatory, not optional. This document defines the security model; layers that
touch rules, auth, functions, or storage must satisfy it and add emulator tests.

---

## 1. Identity & roles

- Firebase Authentication is the only identity source (email/password + Google).
- `users/{uid}.role` defaults to `user`. **Clients can never write `role`.** Elevation is
  only ever done server-side via Firebase custom claims, and any future admin capability
  must be gated on a verified server-issued claim + documented role-based authorization.
- No client-controlled admin roles. No authorization by hiding UI — every protected action
  is enforced server-side (rules or function).

## 2. Firestore rules

- All app data lives under `users/{uid}/**`. Baseline rule:
  `allow read, write: if request.auth != null && request.auth.uid == uid;`
- Deny by default at the root; grant per collection path.
- Enforce where practical: required fields present, field types valid, `role` unchanged on
  update, `createdBy`/`updatedBy == request.auth.uid`, immutable `createdAt`, monotonic
  `version`.
- Recovery collections: owner-only reads/writes **and** sensitive mutations (relapse
  logging edits, coach sessions, accountability config) routed through Cloud Functions;
  rules reject writes that must be server-mediated.
- Accountability partners get **no** direct read access to any Recovery document.

## 3. Storage rules

- Files only under user-specific paths, e.g. `users/{uid}/uploads/...`.
- `allow read, write: if request.auth.uid == uid` + validate `request.resource.size` and
  `request.resource.contentType` against an allowlist.
- No public download URLs for private files; use access-controlled or short-lived retrieval.
- Every stored file is referenced by an authorized Firestore record.

## 4. Cloud Functions

- All callable/HTTPS functions verify `context.auth` (or a verified ID token) first.
- Validate every request payload with Zod before logic; validate every response before
  returning.
- AI and Recovery endpoints additionally check authorization scope (owner of the target
  data; partner permission grants for accountability functions).
- Rate limiting, timeouts, structured request logging, error normalization, and audit
  records on sensitive operations.
- Secrets (AI provider keys, third-party keys) come from function config / secret manager —
  never from client, never committed.

## 5. App Check

- Enforce App Check on Firestore, Storage, and Functions in test/staging/production.
- Debug provider only in local development.

## 6. Transport & browser security

- Content-Security-Policy: restrict `script-src`, `connect-src` (Firebase + AI function
  origin only), `img-src`, `style-src`; no inline script except the pre-hydration theme
  setter with a nonce/hash.
- Secure CORS on HTTPS functions: explicit origin allowlist per environment.
- Secure cookies / headers: `Strict-Transport-Security`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`.

## 7. Environment separation

- Four environments: development, test, staging, production, each its own Firebase project
  (see `DEPLOYMENT.md`).
- No production secrets in preview or non-production environments.
- `.env.example` documents every variable; real `.env*` files are git-ignored.
- A single `env.ts` parses and validates environment variables at startup and fails fast.

## 8. Secret management

- Client env vars are limited to the public Firebase web config (`NEXT_PUBLIC_*`), which is
  not secret but is still environment-scoped.
- Server secrets: Firebase Functions secrets / Google Secret Manager.
- Never log secrets. Never echo secrets into build output or error messages.
- Service-account JSON files are git-ignored by pattern and must never be committed.

## 9. Rules & security testing

- `npm run test:rules` runs Firestore + Storage rules against the emulator.
- Required cross-user tests: user A cannot read/write user B's documents; user cannot set
  `role`; user cannot read another user's Recovery Center; accountability partner cannot
  query Recovery documents; sensitive writes fail unless via the function path.
- Any layer changing `firestore.rules` / `storage.rules` must add or update these tests and
  leave them green.

## 10. Layer checkpoints

| Layer | Security deliverable |
|---|---|
| 3 | safe Firebase init, emulator wiring, env separation scaffold, base deny-all rules |
| 4 | owner-only rules for `users/**`, role-immutability, rule tests for isolation |
| 6 | ✅ generic audit-field enforcement on every `users/{uid}/{collection}/**` write (`createdBy`/`updatedBy` = caller on create; `createdBy`/`createdAt` immutable, `updatedBy` = caller on update). Per-field domain-value validation is added by each domain layer (8–12). |
| 13 | AI endpoint auth + input/output validation + rate limits + audit |
| 15 | Recovery rules, privacy gate, function-mediated sensitive access, partner permission model |
| 20 | App Check enforcement, CSP, CORS, headers, secret audit, full rules-test sweep |
| 22 | environment isolation verified in CI/CD; no prod secrets in previews |
