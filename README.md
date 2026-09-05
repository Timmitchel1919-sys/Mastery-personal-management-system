# Mastery

[![CI](https://github.com/Timmitchel1919-sys/Mastery-personal-management-system/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Timmitchel1919-sys/Mastery-personal-management-system/actions/workflows/ci.yml)

**AI-Powered Personal Operating System** — Plan. Focus. Act. Grow.

Mastery is a secure, multi-user personal operating system that helps each authenticated
user convert long-term vision into measurable daily execution across three life pillars:
**Spiritual**, **Personal**, and **Societal**.

```
Vision → Five-Year → One-Year → Quarter → Month → Week → Day → Task
       → Execution → Measurement → Reflection → Improvement
```

Product loop: **Plan** (direction, plans, goals, projects, milestones) →
**Focus** (time, attention, energy, calendar) →
**Act** (tasks, habits, routines) →
**Grow** (journal, learning, reading, skills, AI coach, reflection).

## Status

Under active layered construction. See [`docs/BUILD_PROGRESS.md`](docs/BUILD_PROGRESS.md)
for the current layer, test status, and known limitations.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript (strict), React, Tailwind CSS, Mastery design system |
| Backend / infra | Firebase Authentication, Cloud Firestore, Firebase Storage, Cloud Functions, Cloud Messaging, App Check, Emulator Suite |
| Forms / validation | React Hook Form, Zod, @hookform/resolvers |
| Data viz | Recharts |
| i18n | next-intl (English, Dutch; Spanish architected-for) |
| Icons | Lucide React |
| Hosting / deploy | Firebase App Hosting (frontend) + Firebase (all backend services) |

## Documentation

| Doc | Purpose |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Engineering constitution — rules, conventions, definition of done |
| [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) | Consolidated product + build specification |
| [`docs/PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md) | Feature-level requirements per domain |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Structure, layering, patterns |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Mastery visual language and component inventory |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Firestore collections, records, converters, indexes |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Rules, App Check, CSP/CORS, secrets, environments |
| [`docs/AI_ARCHITECTURE.md`](docs/AI_ARCHITECTURE.md) | Server-side AI coach, endpoints, safety, cost controls |
| [`docs/RECOVERY_PRIVACY.md`](docs/RECOVERY_PRIVACY.md) | Recovery Center privacy architecture |
| [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md) | Test types, critical journeys, per-layer gate |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Environments, Firebase projects, CI/CD, rollback |
| [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) | Bundle budget, code splitting, Firestore/AI cost review, a11y, Core Web Vitals |
| [`docs/BUILD_PROGRESS.md`](docs/BUILD_PROGRESS.md) | Living build tracker |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architecture decision records |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Human-readable change history |

## Getting started

Application code arrives in **Layer 1 (Project Foundation)**. Until then this repository
contains governance and documentation only. Once Layer 1 lands:

```bash
npm install
npm run dev            # local development
npm run typecheck && npm run lint && npm test && npm run build
```

Firebase emulators and configuration arrive in **Layer 3 (Firebase Foundation)**.

## License

Proprietary — all rights reserved. Not for redistribution.
