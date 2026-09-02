# Mastery — Data Model

Firestore collections, common record shape, converters, and indexing approach. Every
collection is owner-scoped under `users/{uid}`. Recovery collections have additional rules
in `RECOVERY_PRIVACY.md`.

Implemented in **Layer 6** (schemas, types, converters, repositories); individual domains
extend it in Layers 8–12.

---

## 1. Collection map

```
users/{uid}                                   profile, preferences, role

# Plan
users/{uid}/lifeVisions/{visionId}            typed vision items, pillar-linked (Layer 8A)
users/{uid}/fiveYearPlans/{planId}            shared "plan" shape (Layer 8B)
users/{uid}/yearPlans/{planId}                shared "plan" shape (Layer 8B)
users/{uid}/quarterPlans/{planId}            shared "plan" shape (Layer 8C)
users/{uid}/monthPlans/{planId}              shared "plan" shape (Layer 8C)
users/{uid}/weekPlans/{planId}               shared "plan" shape (Layer 8C)
users/{uid}/goals/{goalId}                    measurable goal, parentPlanId + pillars (Layer 8D)
users/{uid}/projects/{projectId}              delivery vehicle, goalId + pillars, deps/risks (Layer 8E)
users/{uid}/milestones/{milestoneId}         checkpoint, polymorphic parent (goal|project|none) + pillars (Layer 8F)
users/{uid}/roadmaps/{roadmapId}             timeline plan, kind + embedded phases[], optional goal/project links (Layer 8G)

# Focus
users/{uid}/events/{eventId}                   calendar events: timed (ISO+offset & IANA tz) or all-day, recurrence, reminders, goal/project link (Layer 9C)
users/{uid}/timeBlocks/{timeBlockId}          time allocation: category, zoned start/end instants, goal/project link, pillars, status; overlap detection is client-side (Layer 9D)
users/{uid}/focusSessions/{sessionId}          deep work: outcome, distraction log, energy/focus ratings, goal/project link (Layer 9B)
users/{uid}/pomodoroSessions/{sessionId}       terminal focus sessions (completed|abandoned), goal/project link (Layer 9A)
users/{uid}/priorityMatrixItems/{itemId}       Eisenhower matrix: one of 4 quadrants (do|schedule|delegate|eliminate), movable, goal/project link, pillars, completed flag (Layer 9E)

# Act
users/{uid}/tasks/{taskId}
users/{uid}/habits/{habitId}
users/{uid}/habitLogs/{logId}
users/{uid}/routines/{routineId}
users/{uid}/executionLogs/{logId}

# Grow
users/{uid}/journalEntries/{entryId}
users/{uid}/learningItems/{itemId}
users/{uid}/books/{bookId}
users/{uid}/skills/{skillId}

# Analytics
users/{uid}/kpis/{kpiId}
users/{uid}/kpiEntries/{entryId}
users/{uid}/lifeScoreEntries/{entryId}
users/{uid}/weeklySummaries/{summaryId}
users/{uid}/reports/{reportId}

# System
users/{uid}/notifications/{notificationId}
users/{uid}/quickNotes/{noteId}                 dashboard quick-capture notes (Layer 7)

# Recovery — separately protected (see RECOVERY_PRIVACY.md)
users/{uid}/recoveryProfiles/{profileId}
users/{uid}/recoveryGoals/{goalId}
users/{uid}/recoveryGoals/{goalId}/checkIns/{checkInId}
users/{uid}/recoveryGoals/{goalId}/relapses/{relapseId}
users/{uid}/recoveryGoals/{goalId}/copingActions/{actionId}
users/{uid}/recoveryAccountabilityPartners/{partnerId}
users/{uid}/recoveryCoachSessions/{sessionId}
```

## 2. Common record fields

Every domain record includes:

| Field | Type | Notes |
|---|---|---|
| `id` | string | document id, mirrored into the doc |
| `userId` | string | set when needed internally (server writes, partner functions) |
| `createdAt` | timestamp | server timestamp on create |
| `updatedAt` | timestamp | server timestamp on every write |
| `createdBy` | string (uid) | |
| `updatedBy` | string (uid) | |
| `status` | string union | domain-specific lifecycle, e.g. `active` / `archived` |
| `version` | number | incremented per write, for optimistic concurrency |
| `archivedAt` | timestamp \| null | where archival applies |

Timestamps are written as Firestore server timestamps and **normalized to ISO 8601 strings
on read** by the converter.

## 3. Converters & the repository layer (Layer 6)

`src/lib/firebase/converters.ts` provides `makeConverter(schema)` (Layer 3): `fromFirestore`
runs `normalizeTimestamps` (Firestore Timestamp → ISO string) then `schema.parse`, throwing
a normalized `AppError` on a bad document; `toFirestore` strips `id` and refreshes
`updatedAt`. All reads go through `.withConverter(...)`.

`src/lib/repository/` (Layer 6) builds on this:

- **`baseRecordSchema`** — the audit / lifecycle spine every record carries (`id`,
  `userId?`, `status`, `version`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`,
  `archivedAt`). Feature schemas: `defineRecordSchema({ ...featureFields })`.
- **`createFirestoreRepository({ collectionName, schema, createSchema, updateSchema })`** —
  a user-scoped repository with `list / get / create / update / archive / unarchive`.
  - The uid comes from the client auth state (`requireUid()`); callers never pass one.
  - `create` writes feature fields + `id` + `userId` + `buildCreateAudit(uid)`
    (`status:"active"`, `version:1`, `archivedAt:null`, server timestamps, `createdBy/By`),
    then reads back so the returned entity has real server timestamps.
  - `update` writes the patch + `buildUpdateAudit(uid)` (server `updatedAt`, `updatedBy`,
    `version` via `increment(1)`), then re-reads.
  - `list` is always bounded: fetches `limit + 1`, returns
    `{ items, nextCursor, hasMore }`; `nextCursor` is the last row's id, re-fetched as a
    `startAfter` snapshot on the next call. `limit` is clamped to `[1, 100]`.
- Audit-field integrity is also enforced in `firestore.rules` for every
  `users/{uid}/{collection}/{document=**}` (Layer 6 §): `createdBy/updatedBy == uid` on
  create; `createdBy` / `createdAt` immutable and `updatedBy == uid` on update.

## 4. Linkage & traceability

Cross-entity links are stored as id references plus a denormalized label where useful for
lists:

- `plan.parentId` (a plan one tier up — five-year ← one-year ← quarter ← month ← week;
  wired in the plan form in Layer 8H), `goal.parentPlanId`, `project.goalId`,
  `milestone.parentType + milestone.parentId` (goal | project | none),
  `roadmap.linkedGoalId | roadmap.linkedProjectId`,
  `task.goalId | projectId | milestoneId | parentTaskId`, `habit.goalId`, `kpi.goalId`,
  `event.goalId | projectId | taskId | timeBlockId`, `journalEntry.goalId`, etc.
- Each record also carries `pillarIds: string[]` (one or more of `spiritual` / `personal`
  / `societal`).
- The planning cascade (Layer 8H) walks these references to show each record's chain up to
  its originating plan. Missing links are allowed; the chain simply stops and the record is
  listed under "not yet linked". `src/features/cascade/build-cascade.ts` is the pure
  builder; it is a **read-only derived view** — it never creates or mutates records.

## 5. Indexing approach

- Common list queries: `where('status','==', ...)` + `orderBy('updatedAt','desc')` +
  `limit(pageSize)` with a cursor.
- Date-range queries (calendar, execution tracker, weekly summary):
  `where('start','>=',from)` + `where('start','<',to)` + `orderBy('start')`.
- Every composite query gets an entry in `firestore.indexes.json` (added in Layer 3,
  extended per domain) and a note in this file's index log below.
- No query without a bounded `limit`. No client-side full-collection scans.

The generic repository's default `list` orders by a single field (`updatedAt desc`), which
needs **no composite index**. As soon as a domain calls `list({ filters, orderBy })` with a
`where` + a different `orderBy`, that pair needs a composite index in
`firestore.indexes.json` and a row in the log below.

### Index log

| Collection | Query shape | Added in |
|---|---|---|
| _(none yet — no composite queries in Layers 0–6)_ | | |

## 6. Ownership & security summary

- Reads/writes allowed only when `request.auth.uid == uid` in the path.
- `role` is never writable by the client; only server (custom claims) can elevate.
- Recovery subcollections: owner-only, plus sensitive operations routed through Cloud
  Functions. Accountability partners never query Recovery documents directly.
- Full rules and tests: `SECURITY.md`, `RECOVERY_PRIVACY.md`, Layer 4 + Layer 15 + Layer 20.
