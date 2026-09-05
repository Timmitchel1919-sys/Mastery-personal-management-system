# Mastery — Recovery Center Privacy Architecture

The Recovery Center is a separate, private module for user self-identified behavioral
patterns (procrastination, chronic avoidance, compulsive digital behavior, or user-defined
patterns). Built in **Layer 15**; hardened again in **Layer 20**.

**It must not diagnose medical or psychological conditions and must not claim to replace a
licensed healthcare professional.**

---

## 1. Privacy requirements (stronger than any other module)

- Sensitive recovery details never appear on the standard dashboard.
- Recovery information never appears in global search.
- Recovery information never appears in ordinary notifications (recovery notifications are
  a separate, privacy-safe, separately-configurable channel).
- Recovery information is never exposed to other platform users.
- An **additional privacy gate** is required before opening the module — PIN protection
  first, architected for future biometric / WebAuthn.
- Recovery information is stored in **separately protected collections**.
- Recovery AI conversations are kept separate from general AI conversations; Recovery Coach
  context is never mixed into the general planning AI.
- Recovery data is never used for unrelated analytics or personalization.
- Data deletion controls are provided.
- All recovery-data access paths are documented (this file's §5).

## 2. Data model

```
users/{uid}/recoveryProfiles/{profileId}
users/{uid}/recoveryGoals/{goalId}
users/{uid}/recoveryGoals/{goalId}/checkIns/{checkInId}
users/{uid}/recoveryGoals/{goalId}/relapses/{relapseId}
users/{uid}/recoveryGoals/{goalId}/copingActions/{actionId}
users/{uid}/recoveryAccountabilityPartners/{partnerId}
users/{uid}/recoveryCoachSessions/{sessionId}
```

A recovery goal may contain: user-defined behavior, start date, motivation, triggers,
warning signs, coping strategies, support preferences, privacy settings, current status.

## 3. Access control

- **Rules:** owner-only (`request.auth.uid == uid`) on every recovery path, on top of the
  privacy gate enforced in the app.
- **Server-mediated writes:** relapse/setback records, coach sessions, and accountability
  configuration are written through Cloud Functions; rules reject direct client writes for
  those.
- **Accountability partners never receive direct Firestore access.** All partner reads go
  through an authenticated, authorized Cloud Function that returns only the explicitly
  granted projection.
- Recovery collections are excluded from every aggregation service, report builder, search
  index, and general-AI context builder by construction (allowlist, not denylist).

## 4. Features (Layer 15C–15F)

Recovery goals · daily check-ins · HALT check-in (Hungry / Angry / Lonely / Tired) ·
trigger identification · urge intensity · coping action selection · reflection · progress
tracking · streak tracking · relapse/setback logging · restart-after-setback flow · coping
toolkit (user-selected faith-based options + evidence-informed behavioral techniques) ·
Recovery Coach · optional accountability partner.

Language: growth-oriented and neutral. No shame-focused presentation. Emphasize long-term
progress over current streak length.

### Procrastination integration (Layer 15 / cross-links Layer 10D)

When a task is repeatedly cancelled, postponed, or left incomplete, the user may: record
the cause, identify a blocker, add a reflection, link the event to a recovery goal, and ask
the Recovery Coach for a non-judgmental next action. Ordinary task delays are **not**
automatically classified as a behavioral problem.

## 5. Recovery Coach (Layer 15E)

- Separate endpoint `recoveryCoachQuery`, separate system instruction, separate context
  builder, separate conversation storage.
- Supportive and non-judgmental; focuses on immediate safe next actions; uses user-selected
  faith-based encouragement only when enabled; avoids diagnosis; avoids coercive language;
  recommends professional or emergency assistance where appropriate.
- Recovery conversations stay isolated from general AI sessions.

## 6. Accountability partner (Layer 15F)

Opt-in only. The user controls: which recovery goal is shared, what information is shared,
how long access lasts, whether check-in reminders are sent, whether progress/setbacks are
visible, and when access is revoked.

Explicit permission scopes: `streak-only`, `status-only`, `check-in-completed`,
`selected-summary`, `custom-limited-access`.

Never exposed to a partner: full journal content, private AI conversations, trigger
details, sensitive notes, unapproved records.

## 7. Reports & offline

- Sensitive Recovery Center reports require an explicit, separate user action and are never
  included automatically in any other report.
- The Recovery Center receives additional scrutiny before **any** offline storage / PWA
  caching is enabled for its data (Layer 19).

## 8. Documented access-path list

| Path | Mechanism | Auth |
|---|---|---|
| User sets up / verifies / resets the Recovery Center PIN | client SDK read/write, `recoveryProfiles/{uid}` | auth + owner rule — **this is** the privacy gate, not behind it |
| User views own recovery data | client SDK read | auth + owner rule + privacy gate |
| User logs relapse / edits coach session / configures partner | Cloud Function | auth + owner check |
| Accountability partner views shared projection | Cloud Function | auth + active grant + scope filter |
| Recovery Coach retrieval | server context builder | auth + owner, isolated from general AI |
| Data deletion | Cloud Function | auth + owner + confirmation |

Any new access path must be added to this table in the same layer that introduces it.

> **Layer 15A status:** the privacy gate above (PIN setup/entry/reset,
> `src/features/recovery/`) is implemented and unit-tested. The PIN is a shield against
> casual/shoulder-surf access, not a security boundary against the account owner — real
> security is Firebase Auth + the owner-only rule on `recoveryProfiles`, same as any other
> collection.
>
> **Layer 15B status:** `recoveryGoals` (§2's behavioral model — behavior, motivation,
> triggers/warning-signs/coping-strategies, neutral `recoveryStatus`) is implemented,
> client-written under the generic owner-only rule, behind the PIN gate.
>
> **Layer 15C status:** daily **check-ins** (`recoveryGoals/{goalId}/checkIns`) are
> implemented and client-written under the owner-only rule; streaks/progress are derived on
> read. **Setback records** (`recoveryGoals/{goalId}/relapses`) are write-guarded per §3:
> `firestore.rules` refuses a direct client write, so the `recordRecoverySetback` Cloud
> Function (Admin SDK) is the only writer; the client reads them back directly. That
> function is written and unit-tested but **not yet deployed** (project is on the Spark
> plan) — logging a setback will fail in production until Cloud Functions are deployed.
> **Layer 15D status:** the **coping toolkit** (`recoveryGoals/{goalId}/copingActions`) is
> implemented — a per-goal list of coping actions (`title`, `category`, `howTo`),
> client-written under the owner-only rule, with reversible archive and a built-in
> suggestion library (evidence-informed behavioral prompts; faith-based options offered
> only when the goal opts in per ADR-0020). The prompts are short and non-clinical — the
> module still never diagnoses or claims to replace a professional.
>
> **Layer 15E status:** the **Recovery Coach** (`recoveryCoachQuery`) is implemented — a
> fully isolated AI Cloud Function with its own supportive, non-judgmental system prompt
> (recommends professional/emergency help on any sign of risk; never diagnoses), a context
> builder that reads only the caller's recovery data for one goal, and its own storage
> `users/{uid}/recoveryCoachSessions` (rules reject a direct client write — §3). It shares
> only the plain per-user AI spend counters and writes nothing to `coachExchanges` /
> `aiCallLogs`. Faith-based encouragement is used only when the goal opts in. Like the
> other Cloud Functions it is **written and unit-tested but not deployed** (Spark plan) —
> "Ask for a next step" fails in production until Cloud Functions ship.
>
> **Layer 15F status:** the **accountability partner** feature is implemented.
> `configureAccountabilityPartner` (op create / update / revoke) is the only writer of
> `users/{uid}/recoveryAccountabilityPartners/{id}` (rules reject a direct client write).
> `getAccountabilityProjection` is the only way a partner sees anything: it checks the
> caller's *verified* email against an active, unexpired, unrevoked grant and returns
> nothing but the scope's projection (a streak / a status word / whether they checked in
> today / a short summary / a custom field subset, optionally a bare setback count).
> Reflections, HALT, triggers, setback narratives, coping actions, journal, and coach
> conversations are never in a projection. The owner configures grants in the recovery goal
> detail view; the partner opens `/recovery/partner?owner=…&grant=…` (outside the PIN gate
> — the partner is not the owner). Reminder *delivery* (§6) is Layer 17 — 15F stores the
> `sendCheckInReminders` preference only. Both functions are **written and unit-tested but
> not deployed** (Spark plan) — configuring or viewing a shared projection fails in
> production until Cloud Functions ship.
>
> **Layer 15 (Recovery Center) is now complete: 15A–15F.**
