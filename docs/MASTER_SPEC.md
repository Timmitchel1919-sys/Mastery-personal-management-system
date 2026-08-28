# Mastery — Master Specification

Consolidated specification derived from the Mastery Final Master Prompt. This is the
scope north-star. Feature detail lives in `PRODUCT_REQUIREMENTS.md`; this document fixes
the shape of the product and the order of construction.

---

## 1. Product definition

**Mastery** — an AI-Powered Personal Operating System and personal management platform.
Tagline: *Plan. Focus. Act. Grow.*

Primary objective: a secure, production-ready, multi-user system that helps each
authenticated user plan, organize, execute, evaluate, and improve their life across three
life pillars.

### Life pillars

| Pillar | Domains |
|---|---|
| **Spiritual** | Faith, Character, Spiritual disciplines, Service, Purpose |
| **Personal** | Health, Personal growth, Finances, Relationships, Learning, Habits, Skills |
| **Societal** | Work, Career, Business, Leadership, Community, Social impact |

### Central workflow

```
Vision → Five-Year Plan → One-Year Plan → Quarterly Objectives → Monthly Objectives
      → Weekly Priorities → Daily Actions → Execution → Measurement → Reflection → Improvement
```

### Execution loop

- **Plan** — direction, plans, goals, projects, milestones, priorities.
- **Focus** — allocate time, attention, energy, calendar capacity.
- **Act** — execute tasks, routines, habits, commitments.
- **Grow** — reflect, learn, measure progress, develop skills, improve next cycle.

The final product must not feel like disconnected productivity tools. Every module connects
back to the loop: long-term direction → daily execution → measurable progress → reflection →
better next plan.

---

## 2. Technology stack

**Frontend:** Next.js App Router, TypeScript (strict), React, Tailwind CSS, Mastery design
system.

**Backend / infrastructure:** Firebase Authentication, Cloud Firestore, Firebase Storage,
Firebase Cloud Functions, Firebase Cloud Messaging, Firebase App Check, Firebase Emulator
Suite.

**Forms & validation:** React Hook Form, Zod, @hookform/resolvers.
**Data visualization:** Recharts. **i18n:** next-intl. **Icons:** Lucide React.
**Utilities:** clsx, tailwind-merge.

**Hosting & deployment:** Firebase App Hosting for the Next.js frontend; Firebase for all
backend services; GitHub for source control; CI/CD for validation and preview deploys.
(The Final Master Prompt names Vercel for the frontend; this project uses Firebase App
Hosting instead — see `DECISIONS.md` ADR-0003.)

Use stable versions compatible with the repo. No dependency upgrades without a documented
reason.

---

## 3. Application navigation

```
DASHBOARD

PLAN      Life Vision · Five-Year Plans · One-Year Plans · Quarterly Plans ·
          Monthly Plans · Weekly Plans · Goals · Projects · Milestones · Roadmaps

FOCUS     Deep Work · Pomodoro · Priority Matrix · Calendar · Time Blocking · Focus Sessions

ACT       Tasks · Habits · Daily Routine · Execution Tracker

GROW      Journal · Learning · Reading · Skills · AI Coach

ANALYTICS KPIs · Life Score · Reports · Trends

PRIVATE   Recovery Center      (privacy-gated)

SYSTEM    Notifications · Settings
```

Responsive shell: desktop = fixed left sidebar + sticky topbar + scrollable main +
optional right panel; tablet = collapsible sidebar + compact topbar; mobile = navigation
drawer + fixed bottom nav (Dashboard/Plan/Focus/Act/Grow) + safe-area + touch targets.
Global: search shell, notification control, user menu, command palette, breadcrumbs,
active-nav states, loading states, error boundaries.

---

## 4. Domain summary

| Domain | Core entities |
|---|---|
| **Plan** | lifeVisions, fiveYearPlans, yearPlans, quarterPlans, monthPlans, weekPlans, goals, projects, milestones, roadmaps + planning cascade with parent-child traceability |
| **Focus** | pomodoroSessions, focusSessions (deep work), events (calendar), timeBlocks, priority matrix (4 quadrants) |
| **Act** | tasks (+ subtasks, recurrence), habits + habitLogs, routines, executionLogs |
| **Grow** | journalEntries, learningItems, books, skills |
| **Analytics** | kpis, kpiEntries, lifeScoreEntries, reports, weeklySummaries |
| **AI** | server-side Cloud Functions only; general coach + supporting endpoints |
| **Recovery** | recoveryProfiles, recoveryGoals (+ checkIns, relapses, copingActions), recoveryAccountabilityPartners, recoveryCoachSessions — separately protected |
| **System** | users/{uid} profile, notifications, settings, i18n, theme |

Data model detail: `DATA_MODEL.md`. Recovery detail: `RECOVERY_PRIVACY.md`.

---

## 5. Cross-cutting requirements

- **Multi-user isolation:** owner-scoped Firestore paths `users/{uid}/**`; no user can read
  another user's private data; no client-controlled admin roles.
- **Authentication:** email/password, Google, logout, forgot-password, persistence,
  protected routes, redirects, session loading, profile creation, user menu, error
  normalization.
- **i18n:** English + Dutch at launch, Spanish architected-for; no hardcoded strings;
  preference stored in the user profile and restored across devices.
- **Theme:** dark / light / system; stored in profile; no theme flash on load.
- **PWA:** installable; manifest, icons, service worker, offline app shell, safe caching,
  update handling; explicit offline behavior; no unsafe caching of private data.
- **Accessibility:** semantic HTML, keyboard nav, reduced motion, accessible labels /
  focus / errors, contrast in all themes.
- **Performance:** route + feature code splitting, pagination, aggregation, controlled
  subscriptions, no startup bulk loads, bundle analysis, cold-start review, AI cost review.
- **Security:** owner-only rules, App Check, CSP, secure CORS, secret management,
  environment separation, emulator rule tests. See `SECURITY.md`.

---

## 6. Build order

24 layers, 46 discrete steps counting sublayers. Each layer follows the procedure in
`CLAUDE.md` §7 and the definition of done in `CLAUDE.md` §11.

| # | Layer | Sublayers |
|---|---|---|
| 0 | Project Constitution | governance + docs only |
| 1 | Project Foundation | Next.js, TS, Tailwind, lint, aliases, validation, env, errors, loading, structure |
| 2 | Mastery Design System | retained design language + reusable components |
| 3 | Firebase Foundation | safe init, emulators, converters, env separation, Functions structure, error normalization |
| 4 | Authentication & User Isolation | auth, profiles, protected routes, security rules, rule tests |
| 5 | Application Shell & Navigation | responsive protected layouts, placeholder module routes |
| 6 | Core Data Model & Repository Layer | schemas, types, converters, repositories, pagination, ownership, audit fields |
| 7 | Dashboard MVP | aggregation service, real user-scoped widgets |
| 8 | Plan Domain | 8A Life Vision · 8B Five-Year & One-Year · 8C Quarterly/Monthly/Weekly · 8D Goals · 8E Projects · 8F Milestones · 8G Roadmaps · 8H Planning Cascade |
| 9 | Focus Domain | 9A Pomodoro · 9B Deep Work · 9C Calendar · 9D Time Blocking · 9E Priority Matrix |
| 10 | Act Domain | 10A Tasks · 10B Habits · 10C Daily Routine · 10D Execution Tracker |
| 11 | Grow Domain | 11A Journal · 11B Learning · 11C Reading · 11D Skills |
| 12 | KPI, Analytics & Life Score | — |
| 13 | General AI Architecture | — |
| 14 | Weekly AI Summary | — |
| 15 | Recovery Center | 15A Privacy Architecture · 15B Recovery Data Model · 15C Check-ins & Tracking · 15D Coping Toolkit · 15E Recovery Coach · 15F Accountability Partner |
| 16 | Reports & PDF Export | — |
| 17 | Notifications | — |
| 18 | Internationalization & Theme | — |
| 19 | PWA & Mobile Readiness | — |
| 20 | Security Hardening | — |
| 21 | Complete Testing Program | — |
| 22 | Deployment & CI/CD | — |
| 23 | Performance, Cost & Accessibility Optimization | — |

**Sequencing rule:** do not begin AI, Recovery Center, reports, push notifications, or
external integrations before authentication, planning, tasks, habits, calendar, and KPI
foundations are stable.

---

## 7. Final product standard

Mastery must be: secure, private, modular, maintainable, scalable, mobile-first,
installable as a PWA, accessible, multi-user, internationalized, AI-assisted,
user-controlled, transparent in its calculations, careful with sensitive information, and
suitable for continuous development.
