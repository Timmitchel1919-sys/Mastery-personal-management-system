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
users/{uid}/lifeVisions/{visionId}
users/{uid}/fiveYearPlans/{planId}
users/{uid}/yearPlans/{planId}
users/{uid}/quarterPlans/{planId}
users/{uid}/monthPlans/{planId}
users/{uid}/weekPlans/{planId}
users/{uid}/goals/{goalId}
users/{uid}/projects/{projectId}
users/{uid}/milestones/{milestoneId}
users/{uid}/roadmaps/{roadmapId}

# Focus
users/{uid}/events/{eventId}                   calendar events
users/{uid}/timeBlocks/{timeBlockId}
users/{uid}/focusSessions/{sessionId}          deep work
users/{uid}/pomodoroSessions/{sessionId}

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

## 3. Converters

`lib/firebase/converters.ts` provides `makeConverter(schema)`:

```ts
function makeConverter<T>(schema: ZodSchema<T>): FirestoreDataConverter<T> {
  return {
    toFirestore(model)  { /* strip id, set server timestamps, bump version */ },
    fromFirestore(snap) {
      const raw = snap.data();
      const normalized = normalizeTimestamps(raw);           // Timestamp -> ISO string
      return schema.parse({ ...normalized, id: snap.id });   // Zod validation
    },
  };
}
```

Repositories attach the converter with `.withConverter(...)`; no un-converted reads.

## 4. Linkage & traceability

Cross-entity links are stored as id references plus a denormalized label where useful for
lists:

- `goal.parentPlanId`, `project.goalId`, `milestone.goalId | milestone.projectId`,
  `task.goalId | projectId | milestoneId | parentTaskId`, `habit.goalId`, `kpi.goalId`,
  `event.goalId | projectId | taskId | timeBlockId`, `journalEntry.goalId`, etc.
- Each record also carries `pillarIds: string[]` (one or more of `spiritual` / `personal`
  / `societal`).
- The planning cascade (Layer 8H) walks these references to show a task's chain up to its
  originating vision. Missing links are allowed; the chain simply stops.

## 5. Indexing approach

- Common list queries: `where('status','==', ...)` + `orderBy('updatedAt','desc')` +
  `limit(pageSize)` with a cursor.
- Date-range queries (calendar, execution tracker, weekly summary):
  `where('start','>=',from)` + `where('start','<',to)` + `orderBy('start')`.
- Every composite query gets an entry in `firestore.indexes.json` (added in Layer 3,
  extended per domain) and a note in this file's index log below.
- No query without a bounded `limit`. No client-side full-collection scans.

### Index log

| Collection | Query shape | Added in |
|---|---|---|
| _(populated as domains land)_ | | |

## 6. Ownership & security summary

- Reads/writes allowed only when `request.auth.uid == uid` in the path.
- `role` is never writable by the client; only server (custom claims) can elevate.
- Recovery subcollections: owner-only, plus sensitive operations routed through Cloud
  Functions. Accountability partners never query Recovery documents directly.
- Full rules and tests: `SECURITY.md`, `RECOVERY_PRIVACY.md`, Layer 4 + Layer 15 + Layer 20.
