# Mastery — Product Requirements

Feature-level requirements per domain. Each layer implements the slice named in
`MASTER_SPEC.md` §6. "Must support" lists are the acceptance surface for that feature.

---

## 1. Authentication & profile (Layer 4)

- Email/password registration and login; Google authentication; logout; forgot-password
  flow; authentication persistence.
- Protected routes; authenticated redirects; unauthenticated redirects; session loading
  state; user menu; authentication error normalization.
- `AuthProvider`, `useAuth` hook, authentication service, login page, registration page,
  forgot-password page, protected layout.
- On registration create `users/{uid}` with: `id`, `displayName`, `email`, `photoURL`,
  `role` (default `user`), `language`, `theme`, `timezone`, `accentColorPreference`
  (if the design system supports it), `onboardingCompleted`, `createdAt`, `updatedAt`.
- Preferences persist in the user profile and restore across devices.

## 2. Plan domain (Layer 8)

### 8A Life Vision
Define: personal mission, core values, life purpose, desired legacy, spiritual direction,
personal direction, societal direction, long-term vision statements, future-self
descriptions, non-negotiable principles. Each vision item links to one or more life pillars.

### 8B Five-Year & One-Year Plans
Support: one-year plans, five-year plans, life-pillar assignments, objectives, desired
outcomes, key measures, start/end dates, status, progress, review notes.

### 8C Quarterly / Monthly / Weekly Planning
Quarter → Month → Week planning tiers with objectives, priorities, status, progress, review
notes; each tier links up to its parent tier.

### 8H Planning Cascade
Controlled cascade Vision → Five-Year → One-Year → Quarter → Month → Week → Day → Task with
parent-child traceability (a daily task traces to its originating goal/project/plan/vision
when such a link exists). Do not auto-create excessive records without user confirmation.
Provide assisted recommendations; keep the user in control.

### 8D Goals
Title, description, life pillar, parent plan, start date, target date, status, priority,
progress, measurement type, target value, current value, unit, milestones, projects, tasks,
habits, KPIs, review frequency, notes, archive state.

### 8E Projects
Goal linkage, life-pillar linkage, project status, owner, dates, priority, description,
expected outcome, milestones, tasks, dependencies, risks, progress, review notes.

### 8F Milestones
Goal or project linkage, due date, completion state, progress, dependencies, evidence/notes.

### 8G Roadmaps
Timeline-oriented roadmaps for goals, projects, skill development, learning plans, personal
transformation programs.

## 3. Focus domain (Layer 9)

### 9A Pomodoro
Configurable work / short break / long break; session cycles; pause / resume / cancel /
complete; **persistent session state**; task/goal/project linkage; focus statistics;
historical sessions.

### 9B Deep Work
Session creation, intended outcome, task/project linkage, start/end time, distraction log,
energy level, focus quality, completion notes, session score.

### 9C Calendar
Internal functional calendar: day/week/month views; event create/edit/delete; recurring
events; all-day events; reminders; goal/project/task/time-block linkage; drag-and-drop
where stable; timezone handling. Build behind an **adapter interface** so Google/Outlook/
CalDAV sync can be added later without rewriting the internal event model. No external
sync until the internal calendar is stable.

### 9D Time Blocking
Allocate time to tasks, habits, goals, projects, deep work, learning, spiritual activities,
recovery activities, personal commitments. Detect and warn on obvious scheduling conflicts.

### 9E Priority Matrix
Four quadrants (urgent+important, important-not-urgent, urgent-not-important, neither);
tasks movable between quadrants.

## 4. Act domain (Layer 10)

### 10A Tasks
Title, description, status, priority, due date, start date, life pillar, goal/project/
milestone linkage, parent task, subtasks, recurrence, estimated duration, actual duration,
energy requirement, context, tags, notes, completion timestamp, cancellation/postponement
reason.

### 10B Habits
Life-pillar linkage, goal linkage, frequency, schedule, target, unit, reminder, streak,
longest streak, completion logs, missed logs, pause state, restart state, progress history.
Streak tracker suited to spiritual disciplines, health habits, learning, routines.

### 10C Daily Routine
Morning / work-or-study / evening / custom routines; ordered steps; time estimates; habit
linkage; completion tracking; reusable templates.

### 10D Execution Tracker
Compare planned vs completed vs delayed vs cancelled vs rescheduled work; time estimated vs
time spent; focus quality; energy; reasons for non-completion. Neutral, non-shaming
language.

## 5. Grow domain (Layer 11)

### 11A Journal
Free-form entries, guided reflection, daily/weekly reflection, gratitude, lessons learned,
decision journal, goal/life-pillar linkage, mood & energy metadata, tags, search, privacy
controls.

### 11B Learning
Courses, study plans, lessons, notes, learning goals, completion tracking, study sessions,
assessments, resources, goal & skill linkage.

### 11C Reading
Reading list, currently reading, completed books, reading progress, notes, user-entered
highlights, lessons, action items, goal linkage. Never reproduce copyrighted book content
the user did not supply.

### 11D Skills
Skill inventory, current proficiency, target proficiency, skill categories, practice plans,
evidence, learning resources, related goals, review dates, progress history.

## 6. Dashboard (Layer 7)

Aggregation service prevents per-widget uncontrolled reads; all data scoped to the
authenticated user. Widgets may include: personalized greeting, current date, Life Score,
today's focus/priorities/schedule, habit streaks, energy check-in, focus hours, completed
tasks, goal/project/weekly progress, KPI overview, AI Coach preview, habit preview, focus
timer, quick notes, upcoming milestones, planning alignment, recovery check-in shortcut
(no sensitive detail), notifications. No hardcoded user name. Real data when available;
clear empty states otherwise.

## 7. KPI, analytics & Life Score (Layer 12)

KPI definitions & entries; life-pillar & goal linkage; manual and system-calculated
entries; time-series visualization; trends; comparisons; reporting periods; targets;
thresholds; notes. Categories span the three pillars (e.g. spiritual discipline
consistency, sleep, financial progress, work performance, community contribution).

**Life Score:** documented, configurable formula. Must use defined KPIs, show contributing
factors and weighting, avoid presenting itself as a judgment of human worth, let the user
see how it was calculated, preserve historical entries, handle missing data fairly. Never
generate an unexplained score.

## 8. General AI Coach (Layer 13) — see `AI_ARCHITECTURE.md`

All AI runs through authenticated server-side Cloud Functions; provider keys never in
client code. Primary endpoint `masteryCoachQuery`; supporting endpoints
`generateWeeklySummary`, `generatePlanningRecommendations`, `generateGoalBreakdown`,
`generateReflectionQuestions`, `analyzeExecutionPatterns`, `recoveryCoachQuery` (separate).
The coach retrieves only necessary user-authorized context, provides structured
recommendations, explains influencing information, identifies assumptions, never invents
records, never makes irreversible changes automatically, and lets the user accept/edit/
reject suggestions.

## 9. Weekly AI Summary (Layer 14)

Scheduled system evaluating the previous 7 days: accomplishments, completed goals/
milestones/tasks, habit consistency, focus time, planning accuracy, delays, cancelled/
postponed tasks, execution patterns, KPI movement, lessons, suggested priorities for next
week. Stored under the user's records; user notified; user can review, archive, delete.

## 10. Recovery Center (Layer 15) — see `RECOVERY_PRIVACY.md`

Separate private module for self-identified behavioral patterns (procrastination, chronic
avoidance, compulsive digital behavior, user-defined). Must not diagnose or claim to
replace a licensed professional. Stronger privacy than any other module: privacy gate (PIN
first, WebAuthn-ready), separate collections, isolated AI, never on dashboard/search/
notifications, opt-in accountability partner via Cloud Function only. Features: recovery
goals, daily check-ins, HALT check-in, trigger identification, urge intensity, coping
action selection, reflection, progress & streak tracking, relapse logging, restart flow,
coping toolkit (faith-based options + evidence-informed techniques), Recovery Coach.
Growth-oriented neutral language; emphasize long-term progress over current streak length.

## 11. Reports & PDF export (Layer 16)

Weekly / monthly / quarterly / annual / goal / habit / focus / KPI / planning-vs-execution
reports. Server-controlled PDF where practical. Reports use authenticated user data,
include selected periods, explain metrics, handle missing data, never leak Recovery Center
information, let the user choose sections, use Mastery branding, produce a downloadable
record, store export metadata where appropriate. Sensitive Recovery reports require
explicit separate action and are never auto-included.

## 12. Notifications (Layer 17)

In-app + Firebase Cloud Messaging. Task / event / habit / routine / milestone reminders;
weekly-summary notifications; planning-review reminders; KPI-entry reminders.
User-controlled preferences, quiet hours, timezone awareness, category controls, read/
unread states, safe deep links, permission handling, token lifecycle, duplicate
prevention. Recovery notifications use privacy-safe wording and are separately
configurable.

> **Layer 17 status.** The in-app notification centre (`/notifications`), preferences
> (category toggles, quiet hours, timezone, milestone-lead / KPI-stale windows), read/unread
> state, safe deep links, the topbar unread badge, and an **idempotent client-side reminder
> scan** (task-due, milestone-due, habit-due, kpi-stale, planning-review — `dedupeKey`
> prevents duplicates) are implemented. `weekly-summary` rows still come from the Layer 14
> function. **FCM push** (service worker, VAPID key, token lifecycle, a server send/sweep
> function) and `event-today` reminders (recurrence-aware) are **deferred** (ADR-0026) — the
> `pushEnabled` preference is stored but inert. Recovery Center notifications remain out of
> this centre by construction.

## 13. Internationalization (Layer 18)

next-intl; translations in locale files; no hardcoded user-facing strings; translate
navigation, forms, validation messages, empty states, notifications, reports, AI response
wrappers. Detect browser language on first login when no preference exists; change from
settings; persist in Firestore; restore across sessions/devices; locale-aware dates/
numbers/times; stored domain values language-neutral where possible.

## 14. Theme (Layer 18)

Dark / light / system. Use the retained Mastery design system (never the Compass palette
or Compass UI spec). Store preference in the user profile; respect system preference when
system mode is selected; restore after login; no flash of incorrect theme; accessible
contrast in all themes.

## 15. PWA & mobile (Layer 19)

Installable PWA: web app manifest, app name, short name, icons, theme metadata, mobile
viewport, installability, service worker, offline app shell, safe static-asset caching,
update handling, touch support, safe-area support, responsive layouts, keyboard support,
minimum practical touch targets. Offline behavior explicit; never imply uncached cloud
data is available offline; avoid unsafe caching of private/sensitive data; Recovery Center
gets additional scrutiny before any offline storage.
