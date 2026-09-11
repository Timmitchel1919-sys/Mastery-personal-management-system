# Changelog

All notable changes to Mastery are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project builds in numbered
layers; each entry maps to a layer.

## [Unreleased]

### Layer U — Predictive Personal Operating System — 2026-09-11

**Added**
- `src/features/foresight/foresight-model.ts` — a synthesis and horizon layer, not a new
  prediction engine: it reuses Layer J's deterministic `PredictiveSignal`s, Layer O's
  strategy scenarios, Layer Q's digital-twin capacity + historical calibration, and Layer
  S's project/plan health, folding them into one horizon-bucketed (today / next-7-days /
  next-30-days / next-90-days / long-term), kind-labelled `Forecast[]`. Every forecast is
  explicitly `OBSERVED_FACT | PREDICTION | PROJECTION | RECOMMENDATION` — never merged —
  with a `recommendation` field kept visually and structurally separate from the
  `statement`. `refreshForecastStatus` marks forecasts `stale`/`expired` rather than
  silently reusing them. `buildEarlyWarnings` (6 warning kinds, capped, only
  meaningful-impact/confidence forecasts — never one per insignificant event) and
  `buildFutureTimeline` (ACTUAL confirmed dates vs PREDICTED/PROJECTED forecasts, kept
  semantically distinct) round out the model. `summarizeCalibration` computes accuracy
  only from user-confirmed outcomes — never fabricated, `null` until something is
  evaluated.
- `src/features/foresight/foresight-model.test.ts` — 23 cases across type/kind/horizon
  mapping, deduplication, sort ordering, staleness/expiry, warning filtering + capping,
  timeline bucketing + ACTUAL/PREDICTED separation, and calibration honesty.
- `src/features/foresight/calibration-store.ts` (+ `.test.ts`, 3 cases) — a per-viewer
  localStorage calibration log: forecasts are recorded once (idempotent), outcomes are
  user-confirmed (`CORRECT | PARTIALLY_CORRECT | INCORRECT | UNRESOLVED`) since no
  automated ground truth exists for most forecast types — honest rather than invented.
- `src/features/foresight/use-foresight.ts` — composes `useAdaptation` (which already
  composes Strategy/Twin/Context/Decisions/Autonomy), `usePredictions`, and one small
  extra read (goals/tasks with real dates, for the timeline's ACTUAL side).
- `src/features/foresight/components/ForesightView.tsx` (+ `.test.tsx`, 5 cases) — the
  `/predictions` screen: early warnings, future timeline, forecast cards (what / based on
  what / confidence / assumptions / separate recommendation, with View details / Simulate
  / Review), and a calibration summary.
- `src/features/foresight/components/ForesightSignalsPanel.tsx` (+ `.test.tsx`, 3 cases) —
  compact Command Center surface (top warning + forecast count).
- `PREDICTIONS_ITEM` in the sidebar below Adaptation; the Command Center gets the
  foresight-signals strip.
- `src/features/command/command-router.ts` gains 5 predictive phrases ("what is likely to
  happen this week", "which goals are at risk", "will I finish this project on time",
  "what should I prepare for" → Predictions; "what happens if I postpone this" →
  Simulation, not Predictions) + 2 new router tests.

**Changed**
- Nothing removed. No duplicate predictive infrastructure — Layer J's `prediction-model.ts`
  is unchanged and remains the single source of deterministic signal generation.

**Safety / grounding**
- Predictions are never presented as guaranteed outcomes: every forecast carries
  confidence, evidence, and assumptions, and strategic/long-horizon forecasts get lower
  confidence than short-horizon operational ones by construction (scenario `limited-data`
  horizon and low sample-size calibration both map to `low` confidence).
- Calibration accuracy is `null` — not zero, not fabricated — until the user confirms an
  outcome; it never feeds back into `buildForecasts` automatically ("never blindly
  increase confidence").

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer T — Personal Command & Experience Intelligence — 2026-09-11

**Added**
- `src/features/command/command-router.ts` (+ `.test.ts`, 10 cases) — a deterministic,
  navigation-only Personal Command Layer. `COMMAND_CATALOG` maps the spec's canonical
  phrases ("show my priorities", "plan my day", "review my goals", "simulate this
  change", "start a focus session", "show my weekly performance", …) to existing routes;
  `matchCommand` scores exact / prefix / substring / word-overlap matches (no AI model);
  `resolveCommand` returns the single best match above a confidence floor;
  `isNavigationSafe` makes the safety property checkable — every command resolves to an
  internal route, never an external URL. Every built-in command is `intent: "VIEW"`-class
  navigation; nothing here validates, simulates, approves, or executes — a future intent
  that changes data must go through Layer R's policy engine, not this router.
- `src/features/command/components/SystemStatus.tsx` (+ `.test.tsx`, 4 cases) — a
  lightweight, always-on status indicator (All systems normal / AI limited / Sync issue /
  Automation paused) reusing Autonomy's pause flag and Intelligence's status — two
  already-loaded hooks, no new fetch. Wired into the Topbar.
- `src/features/command/components/ModuleContextStrip.tsx` (+ `.test.tsx`, 4 cases) —
  scoped contextual intelligence: the single most relevant Adaptation signal for the
  module currently open (Goals sees GOAL/PROGRESS signals, Focus sees FOCUS/CAPACITY,
  etc.), linking into `/adaptation`. Renders nothing when no signal applies — a targeted
  risk line, not a second insight panel. Wired into `ModuleEnvironment`, alongside the
  existing module-scoped `IntelligencePanel`.
- The Command Palette (`Ctrl/Cmd+K`, pre-existing) gains an "Ask MASTERY" group built from
  `COMMAND_CATALOG`, searchable by the same phrases a user would type or say.

**Changed**
- Nothing removed, no rewrite of the Brain Hub / module-orbit navigation, no new global
  state store. The Command Palette's existing "Navigate" group already covered every
  Layer N–S route via `ALL_NAV_ITEMS` (each layer registered its `NavItem` there when it
  shipped) — Layer T's job was to add the phrase-level command layer and scoped context on
  top, not rebuild search or navigation.

**Safety / grounding**
- The command router is structurally incapable of mutating data — its only output is a
  route. Natural-language interpretation, when it exists, still has to pass through
  validation → policy → simulation-if-needed → approval, per the layer's own contract; this
  layer does not add an execution path.
- `SystemStatus` and `ModuleContextStrip` never expose infrastructure detail beyond the
  four documented states / the signal's own statement and evidence.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer S — Continuous Adaptation & Personal Operating Intelligence — 2026-09-11

**Added**
- `src/features/adaptation/adaptation-model.ts` — a pure synthesis layer that closes the
  loop (observe → interpret → evaluate → recommend) over Layers J/K/L/O/P/Q/R's own output
  — it never re-derives what they already compute. `buildSignals` turns Strategy's drift /
  goal health / bottlenecks, raw Predictions, the Digital Twin's capacity + historical
  calibration, and Knowledge context conflicts into a deduplicated, severity-ranked
  `Signal[]` (11 types, 5 severities, every one traceable to real evidence).
  `buildPlanHealth` / `buildProjectHealth` / `buildFocusHealth` / `buildSystemHealth` are
  new indicator models (goal health is reused as-is from Strategy — no competing score).
  `buildAdaptationProposals` turns significant signals (HIGH/CRITICAL, or MEDIUM with
  evidence — never one insignificant event) into evidence-backed, always-`requiresApproval`
  proposals across 11 adaptation types, each with confidence / evidence / assumptions /
  limitations. `isProposalStale` (signal no longer holds, or past a 24h validity window),
  `detectProposalConflicts` (opposing adaptation types are surfaced, never both applied),
  and `prioritizeProposals` (a documented severity × confidence formula, not arbitrary
  order) round out the proposal pipeline. `buildNotifications` (capped at 5, only
  HIGH/CRITICAL signals and pending proposals — never one per minor signal) and
  `buildDailyBrief` (priorities / deadlines / conflicts / risks / recommended actions)
  complete the digest layer; weekly/monthly review stays Strategy's `buildStrategicReview`,
  reused rather than duplicated.
- `src/features/adaptation/adaptation-model.test.ts` — 25 cases across signal synthesis +
  dedupe + severity ordering, the four health models, proposal generation/structure,
  staleness, conflicts, prioritisation, notification capping, and the daily brief.
- `src/features/adaptation/use-adaptation.ts` — composes Strategy / Predictions / the
  Digital Twin / Knowledge context / Decisions / Autonomy's pause flag + one batched plan
  read into the signal → health → proposal → digest pipeline.
- `src/features/adaptation/components/AdaptationCenterView.tsx` (+ `.test.tsx`, 6 cases) —
  the `/adaptation` screen: today's brief, conflicting-adaptations alert, proposal review
  cards (what changed / why / evidence / expected impact / risks / alternatives /
  confidence, with Approve → Trust Center / Simulate first / Dismiss), the signal feed, and
  a system-vs-user state overview.
- `src/features/adaptation/components/AdaptationSignalsPanel.tsx` (+ `.test.tsx`, 3 cases) —
  a deliberately small Command Center surface (top signal + proposal count); renders
  nothing when there is nothing worth surfacing.
- `src/app/(app)/adaptation/page.tsx`; `ADAPTATION_ITEM` in the sidebar below Trust Center.
- Command Center gets the adaptation-signals strip.

**Changed**
- Nothing removed. No new orchestration layer; Approve routes a proposal into the existing
  Layer R policy → approval → execution pipeline as a `PREPARE_PLAN_DRAFT` (always
  approval-eligible; nothing executes automatically) rather than inventing a parallel
  execution path.

**Safety / grounding**
- Adaptation only ever touches adaptive operations (schedules, allocation, priorities,
  workflow) — it never proposes changing a goal's identity, a stable value, or the user's
  vision; `MODIFY_STRATEGIC_GOAL`-class changes stay out of the automatable set.
- Every proposal is reviewable and `requiresApproval: true`; nothing is ever auto-applied.
  Confidence is `high | medium | low`, never fabricated precision.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer R — Autonomous Personal Operations — 2026-09-10

**Added**
- `src/features/autonomy/autonomy-model.ts` — a deterministic policy + lifecycle + safety
  engine. Six bounded autonomy levels (OBSERVE → PROHIBITED); an 18-type action catalog
  tagging risk / required capability / reversibility / whether it is internally
  executable, with money / deletion / security / legal / medical actions permanently
  `prohibited`; `evaluatePolicy` (ALLOW / DENY / REQUIRE_APPROVAL — hard denials first,
  least-privilege capability check, high-risk always needs approval, low-risk auto-execute
  only when explicitly allow-listed at level ≥ 3); a 12-state lifecycle
  (PROPOSED → … → COMPLETED, with REJECTED/CANCELLED/FAILED/EXPIRED/ROLLED_BACK) via a pure
  state machine; `checkAutomationSafety` (circular-dependency detection, chain-depth limit,
  idempotency-key duplicate rejection, per-hour rate limit, prerequisite-failure blocking);
  `runOpsAction` + `verifyOpsAction` (only the 7 safe internal action types actually run —
  summarise / brief / prepare-draft / reminder / recalc-analytics / classify — and nothing
  is ever assumed successful without a checkable verified state); `evaluateAutomationRule`
  (WHEN/THEN rules that can never propose a strategic-goal change or a prohibited action);
  `minimizeContextForExecutor` (per-action-type allow-list, never the whole context);
  `summarizeTelemetry` (honest execution/approval/automation/rollback rates).
- `src/features/autonomy/autonomy-model.test.ts` — 34 cases across classification, policy
  decisions, lifecycle transitions, safety guards, execution + verification, retry policy,
  automation rules, context minimisation, telemetry.
- `src/features/autonomy/use-autonomy.ts` (+ `.test.ts`, 9 cases) — the runtime: policy +
  rules + emergency-stop flag + queue + history in localStorage; `enqueue` runs the safety
  check then the policy engine before anything is queued; `execute` refuses to run while
  paused, runs + verifies, and records history; `approve` / `reject` / `cancel` / `rollback`
  drive the same state machine.
- `src/features/autonomy/components/ApprovalCard.tsx` (+ `.test.tsx`) — the standardised
  approval gate: action / why / affected data / expected result / risk / reversibility /
  executor, with explicit Approve / Reject / Edit.
- `src/features/autonomy/components/TrustCenterView.tsx` (+ `.test.tsx`) — the `/operations`
  screen: autonomy-level picker, per-action-type permission matrix (allow / approval /
  block — prohibited and non-internal types can't be set to allow), a global
  pause-all-automations control, pending approvals, the execution queue (run / cancel /
  roll back), automation rules (add / toggle / delete), and execution history.
- `src/features/autonomy/components/PendingApprovalsPanel.tsx` — a compact Command Center
  strip (pending / running / failed counts + a Trust Center link); renders nothing when
  there is no autonomous activity.
- `src/app/(app)/operations/page.tsx`; `OPERATIONS_ITEM` in the sidebar below Simulation.
- Command Center gets the pending-approvals strip.

**Changed**
- Nothing removed. No new orchestration layer, no new AI Workforce/agent runtime — the
  engine reuses the existing `@/features/actions` `ActionSource` type and slots into the
  documented Strategy → Simulation → Policy → Approval → Execution flow.

**Safety / grounding**
- Money movement, deletions, security/authentication changes, legal commitments and
  medical decisions are hard-coded `prohibited` — the policy engine denies them
  unconditionally, at every autonomy level, regardless of user configuration.
- AI/automation can propose; it can never authorize its own action — every action passes
  through the deterministic policy engine, and execution never runs while automations are
  paused (emergency stop).
- Execution results are verified, not assumed; failures never silently retry.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer Q — Personal Digital Twin & Simulation Engine — 2026-09-10

**Added**
- `src/features/twin/digital-twin.ts` — a pure, deterministic sandbox. `buildBaseline`
  derives the user's operational state (active goals/projects, planned focus hours,
  upcoming deadlines, blocked items, open decisions, capacity) by reference and tags every
  headline number FACT / ESTIMATE / PROJECTION / ASSUMPTION. `runSimulation` applies
  scenario changes (ADD / REMOVE / DEFER / ACCELERATE / REDUCE / RESCHEDULE / REPRIORITIZE
  / PAUSE / COMPLETE) to a copy of the metric set and returns the full contract — baseline,
  projected, changes, affected areas, outcomes, risks, trade-offs, assumptions, confidence,
  limitations — with every projected value tagged `projection` and "Insufficient data for
  reliable simulation." when the baseline is empty. `calibrateFromHistory` compares done
  tasks' actual vs estimated minutes (never concludes *why*); `defaultAssumptions` seeds
  the estimate-to-actual factor from it but keeps it editable (an explicit assumption still
  wins). `compareScenarios` builds a delta table; `buildApplyPreview` produces the
  confirmation summary — it does not mutate anything.
- `src/features/twin/digital-twin.test.ts` — 19 cases: baseline representation + kind
  tagging, over-commitment, historical calibration, projection bounding, deadline easing,
  risk flagging, insufficient-data confidence, assumption precedence, comparison deltas,
  apply-preview.
- `src/features/twin/scenario-store.ts` (+ `.test.ts`, 4 cases) — per-viewer localStorage
  scenario library: create (DRAFT / v1), update, status transitions, duplicate as next
  version (no overwrite), delete.
- `src/features/twin/use-digital-twin.ts` — composes the domain hooks + one batched plan
  read; memoised `simulate` / `compare` / `applyPreview`; nothing mutates real data.
- `src/features/twin/components/SimulationView.tsx` (+ `.test.tsx`, 6 cases) — the
  `/simulation` screen: a persistent SIMULATION-mode banner, baseline panel, scenario
  editor (changes + editable assumptions + horizon), result panel (baseline vs projected,
  outcomes / risks / trade-offs / limitations), scenario library (simulate / compare /
  duplicate / archive / apply), a comparison table, and an apply confirmation dialog that
  records status APPLIED for the audit trail without touching real records.
- `src/app/(app)/simulation/page.tsx`; `SIMULATION_ITEM` in the sidebar below Knowledge Hub.
- Cross-links: the Command Center's strategy-signals line and the Strategy view's review
  section now link into `/simulation`.

**Changed**
- Nothing removed. No new prediction / decision / learning engine; no Monte Carlo (the data
  does not justify it). The twin references existing entities, never copies them.

**Safety / grounding**
- All simulation is user-scoped and deterministic. Projections are labelled as model
  output, never predictions. Applying a scenario is a separate, explicit, confirmed step;
  in this build it records an APPLIED status for auditability and the underlying
  goal/plan/task changes are still made in their own modules with the existing forms and
  authorization.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer P — Knowledge & Personal Context Engine — 2026-09-10

**Added**
- `src/features/context/context-model.ts` — a pure, reference-based context index over the
  user's own MASTERY history plus their explicit notes. `buildContextIndex` normalises
  goals / plans / tasks / decisions / journal / explicit notes into `ContextItem`s that
  point at records rather than copying them; `deriveRelationships` connects them by their
  existing IDs (task→goal, goal→plan, decision→goal, reflection→goal, note→anything);
  `queryContext` scores relevance deterministically (DIRECT / HIGH / MEDIUM / LOW, explicit
  user context outranks inferred, temporal windows current/today/recent/historical) with a
  plain reason on every result; `detectContextConflicts` reports (never resolves)
  disagreements such as an explicit constraint date vs a goal's target; `assembleAiContext`
  returns the *minimum necessary* bundle (direct/high only, capped by item and char count)
  and says "No relevant history found." rather than letting a caller fabricate history.
  The engine infers nothing sensitive — only functional application context.
- `src/features/context/context-model.test.ts` — 16 cases: indexing by reference,
  archival/confidence, irrelevant exclusion, relationship derivation, relevance ranking,
  explicit priority, temporal windows, deterministic search, conflict detection (report
  only), AI assembly minimisation + hallucination protection, relevance explanation.
- `src/features/context/user-context-store.ts` (+ `.test.ts`, 4 cases) — per-viewer
  localStorage store for explicit notes (add / edit / archive / delete / link / unlink) and
  "mark irrelevant" markers the engine honours.
- `src/features/context/use-context.ts` — `useKnowledgeContext` composes the existing
  domain hooks + one batched plan read and exposes `{ index, relationships, conflicts,
  query, assembleForAi, userContext, reload }`.
- `src/features/context/components/RelevantContextPanel.tsx` (+ `.test.tsx`, 4 cases) — a
  reusable scoped "what history is relevant here" panel: relevance badge, a why-am-I-seeing-
  this line, an open-source link, and a mark-not-relevant control; renders "No relevant
  history found." when empty. A `compact` variant for dense surfaces.
- `src/features/context/components/KnowledgeHubView.tsx` (+ `.test.tsx`, 4 cases) — the
  `/knowledge` screen: deterministic search, conflict alerts, an explicit-context editor,
  Lessons, Reflections, Project history, and a restore list for hidden records.
- `src/app/(app)/knowledge/page.tsx`; `KNOWLEDGE_ITEM` in `src/config/navigation.ts` wired
  into the sidebar below Strategy.
- Command Center gets a compact `RelevantContextPanel`; the Strategy view gets a scoped one
  for the strategic review.

**Changed**
- Nothing removed. No vector database, no new search engine — deterministic search reuses
  the existing journal-search pattern; semantic search stays an unbuilt enhancement, not a
  dependency.

**Safety / grounding**
- All context is user-scoped by construction (the engine only sees data the caller already
  loaded for the signed-in user). No cross-user retrieval, search, or learning.
- Minimum-necessary context to AI; explicit user context always outranks inferred;
  conflicts are surfaced, never auto-resolved; the user can correct, unlink, hide, archive,
  or delete any context.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer O — Adaptive Personal Strategy Engine — 2026-09-10

**Added**
- `src/features/strategy/strategy-engine.ts` — a pure, deterministic, strictly advisory
  analysis over already-derived state (goals, plans, intelligence, predictions, decisions,
  brain-system-state). `buildStrategy` produces a strategic context, per-goal alignment,
  strategic-drift signals (neutral language), goal health (from signals, not scores),
  bottlenecks, evidence-backed opportunities, trade-offs, the five scenarios
  (current-course / accelerate / defer / reduce / restructure) with horizon downgrade when
  predictions are absent, strategic debt (aged), change detection, resource-allocation
  notes, a portfolio view, and structured recommendations
  (title / observation / evidence / option / benefit / downside / confidence / userAction —
  always REVIEW, never auto-APPLY). `analyzeWhatIf` keeps FACT / ESTIMATE / ASSUMPTION
  separate; `buildStrategicReview` produces weekly / monthly (KEEP·CHANGE·STOP·START) /
  quarterly (strategic questions) summaries with hedged causal language.
- `src/features/strategy/strategy-engine.test.ts` — 21 cases across context, alignment,
  drift, goal health, bottlenecks, opportunities, trade-offs, scenarios, what-if,
  recommendation structure, strategic debt, change detection, graceful degradation, and
  the three review cadences.
- `src/features/strategy/use-strategy.ts` — composes the existing hooks + one batched plan
  read; exposes `{ status, state, review, whatIf, reload }`.
- `src/features/strategy/components/StrategyView.tsx` + `.test.tsx` — the `/strategy` screen:
  context strip, recommendations, alignment, drift, goal health, bottlenecks,
  opportunities, trade-offs, scenarios, interactive what-if, strategic review
  (weekly/monthly/quarterly), and progressive-disclosure portfolio / strategic debt /
  changes / allocation.
- `src/features/strategy/components/StrategySignalsPanel.tsx` — a deliberately small
  Command Center surface: the single most relevant strategic signal + a link into
  `/strategy`; renders nothing when there is no high-relevance item.
- `src/app/(app)/strategy/page.tsx`; `STRATEGY_ITEM` in `src/config/navigation.ts` wired
  into the sidebar below Command Center; the signals panel added to `CommandCenterView`.

**Changed**
- Nothing removed. No new prediction, decision, or learning engine — Layer O consumes
  Layers J / K / L output. No repository access from presentation.

**Safety / grounding**
- Strictly advisory: never changes a goal, deletes a plan, re-prioritises an objective, or
  executes anything. Every recommendation's `userAction` is `REVIEW`.
- Confidence is `high | medium | low | insufficient-data` — no fake precision; the engine
  says "insufficient data" rather than guessing, and scenario horizons downgrade to
  `limited-data` without predictions.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer N — Personal Command Center — 2026-09-10

**Added**
- `src/features/command-center/command-center-state.ts` — a pure, deterministic reducer
  (`buildCommandCenter`) that folds already-derived state (intelligence, predictions,
  brain-system-state, decisions) into one cockpit view: Now context, Today, a
  severity-ordered attention queue, a decision queue, an aggregated risk center, reused
  progress metrics, strategic-alignment chains, and a grounded executive brief. It issues
  no queries and fabricates no facts.
- `src/features/command-center/command-center-state.test.ts` — 10 cases: no-data mode,
  attention ordering + insight/prediction dedupe, decision-queue filtering + overdue
  ordering, risk aggregation, predictions-disabled handling, progress reuse (no composite
  score), alignment from real relationships only, deterministic brief fallback, full
  graceful degradation, Now promotion.
- `src/features/command-center/use-command-center.ts` — composes the existing derived-state
  hooks and exposes `{ status, state, brainState, reload }`; a failing source degrades the
  cockpit rather than breaking it.
- `src/features/command-center/components/CommandCenterView.tsx` + `.test.tsx` — the primary
  screen: executive brief, Now + brain orientation, attention queue, Today, decision queue,
  risk center, and progressive-disclosure Progress / Strategic-alignment sections, plus
  navigational quick actions. Loading / empty / degraded / AI-failure states covered.
- `src/app/(app)/command/page.tsx` — the `/command` route.
- `COMMAND_CENTER_ITEM` in `src/config/navigation.ts`, wired into the sidebar below Brain
  Hub (expanded + collapsed rails).

**Changed**
- Nothing removed. The six modules, dashboard, Brain Hub, and every intelligence layer are
  untouched; the Command Center only reads their derived output.

**Safety / grounding**
- No new data model, no LLM dependency, no direct repository access from presentation.
- Severity is functional, not decorative; decisions are never auto-resolved; quick actions
  navigate to the module that owns the form rather than duplicating it.
- The executive brief is `source: "deterministic"` and `grounded: true`; every field is a
  projection of current MASTERY data.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Decision workspace — 2026-09-10

**Added**
- A decision-support workspace under `/decisions` with weighted criteria, option comparison, and a transparent recommendation model.
- `src/features/decisions/schema.ts` for typed decision domain shapes and validation-compatible data contracts.
- `src/features/decisions/decision-model.ts` for scoring, reversibility assessment, and evidence-grounded recommendation logic.
- `src/features/decisions/use-decisions.ts` for client-side decision state, persistence, and option selection handling.
- `src/features/decisions/DecisionWorkspace.tsx` for a lightweight UI that compares options against real goal and prediction context.

**Changed**
- Added the decision route to the application navigation and app shell routing.
- Kept the decision model explicitly non-executing and advisory: it informs human choice but does not auto-apply actions.

**Safety / grounding**
- The recommendation is based on weighted criteria, not fabricated certainty.
- Evidence and uncertainty remain visible in the interface.
- The decision layer is informational-only and does not mutate tasks, plans, or other execution records without explicit user approval.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer L — Outcome-learning loop & transparent adaptation — 2026-09-10

**Added**
- `src/features/learning/learning-engine.ts` for outcome-based learning, confidence,
  pattern detection, recommendation feedback, prediction/decision tracking, and user-led
  reset/correction flows.
- `src/features/learning/learning-engine.test.ts` covering expected-vs-actual variance,
  low-data handling, confidence thresholds, feedback capture, and reset/correction behavior.
- `src/features/learning/components/LearningImprovementPanel.tsx` to surface transparent,
  non-autonomous improvement guidance with honest empty-state messaging.

**Changed**
- Integrated the learning panel into `LearningView` without auto-executing recommendations or
  silently changing the underlying user plan state.
- Kept the learning logic strict and explicit: every output is evidence-backed, user-visible,
  and safely bounded when history is insufficient.

**Safety / grounding**
- The learning tool only records outcomes and surfaces inferred patterns; it never learns a
  hidden user profile or auto-applies actions.
- Reset, dismiss, and correction actions are explicit and reversible.

**Verified**
- `npm run typecheck`
- `npm test -- --run src/features/learning/learning-engine.test.ts`

### Layer J — Predictive intelligence & proactive guidance — 2026-09-10

**Added**
- `src/features/predictions/prediction-model.ts` for deterministic, evidence-based forward
  signals across goal trajectory, deadline risk, overload, stalled goals, and habit trend
  deterioration.
- `src/features/predictions/use-predictions.ts` for composing actual historical signal data
  from goals, tasks, time blocks, and habits, filtered through user personalization settings.
- `src/features/predictions/components/PredictionCard.tsx` for hedged user-facing forecast
  cards with evidence, recommendation, confidence labels, and dismissal feedback.
- `src/features/predictions/prediction-model.test.ts` and
  `src/features/predictions/components/PredictionCard.test.tsx` for the predictive layer’s
  deterministic acceptance coverage.

**Changed**
- Kept the predictive layer presentation-only and non-autonomous: no prediction triggers
  execution, and all guidance remains explicit and evidence-backed.
- Reused the existing intelligence framework without overriding the deterministic fact base.

**Safety / grounding**
- All predictions are hedged language based on recorded history and sufficiency thresholds.
- Confidence is qualitative only and intentionally limited when data is sparse.
- User-facing recommendations are informational, never imperative, and never auto-applied.
- No fabricated percentages or unavailable guarantees are introduced.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Layer H — AI personal insights — 2026-09-10

**Added**
- Client-side Layer H AI contracts/context/hooks:
  `ai-personal-insight-schema.ts`, `ai-personal-insight-context.ts`,
  `ai-personal-insight-client.ts`, and `use-ai-personal-insight.ts`.
- New authenticated callable endpoint:
  `functions/src/ai/generate-personal-insight.ts`.
- Server-side Layer H contracts + handler:
  `functions/src/ai/personal-insight/contracts.ts` and
  `functions/src/ai/personal-insight/handler.ts`.
- Layer H tests:
  `ai-personal-insight-schema.test.ts`, `ai-personal-insight-context.test.ts`,
  `use-ai-personal-insight.test.ts`, and `functions/tests/ai/personal-insight-handler.test.ts`.

**Changed**
- `IntelligencePanel` now includes an optional full-mode **MASTERY Insight** AI card
  generation flow (explicit user trigger, loading/error states, and deterministic fallback).
- `functions/src/index.ts` now exports `generatePersonalInsight`.
- `src/features/intelligence/index.ts` now exports Layer H AI hook/schemas.

**Safety / grounding**
- AI remains interpretation-only; no AI pathway writes user domain data.
- AI context is minimized to validated deterministic-insight summaries/facts.
- Model output is strictly structured and validated before rendering.
- Unsupported fact references are rejected.
- Unsupported numeric claims are rejected via grounding checks.
- On AI failure, deterministic intelligence remains the source of truth.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test` (160 files, 853 tests)
- `npm run build` (50 static routes)
- `npm --prefix functions run typecheck`
- `npm --prefix functions run lint`
- `npm --prefix functions run test` (17 files, 103 tests)

### Layer G — Advanced intelligence UX — 2026-09-09

**Added**
- Rebuilt intelligence engine (`src/features/intelligence/mastery-intelligence.ts`) with a
  richer deterministic model: typed insight kinds, severity/confidence/signal, grouped
  outputs, and per-module attention summaries.
- Added a data-aggregation intelligence hook (`src/features/intelligence/use-intelligence.ts`)
  that composes analytics + real repository snapshots (goals, plans, tasks, deep-work,
  journal, learning) and exposes module-scoped views.

**Changed**
- `IntelligencePanel` now renders sectioned intelligence (`Today`, `Progress`, `Attention`,
  `Patterns`, `Recommendations`), supports module-scoped compact mode, and keeps an honest
  insufficient-data state.
- Analytics now embeds the full intelligence panel (`AnalyticsView`).
- Module environments now embed compact module intelligence (`ModuleEnvironment`).
- Brain Hub view now overlays intelligence attention signals onto module status at the
  state-integration layer (`BrainHubView`), preserving renderer-only presentation concerns.
- Intelligence and brain-hub tests were updated to the new model and isolated from
  auth-provider coupling where needed.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test` (157 files, 845 tests)
- `npm run build` (50 static routes)

### Layer F — 3D system polish & intelligence integration — 2026-09-09

**Added**
- `src/features/brain-hub/brain-state.ts` — centralized brain-state model and derivation
  utilities (`module -> visual state`, `overall activity`, neutral unavailable fallback).
- `src/features/brain-hub/use-brain-system-state.ts` — app-state adapter that derives
  Brain Hub signals from real bounded repository reads and emits one-shot module pulses on
  signal change.
- `src/features/brain-hub/brain-state.test.ts` — coverage for derivation priority,
  overall-activity calculation, progress clamping, and neutral fallback.
- `src/components/marketing/LandingBrainExperience.test.tsx` — validates landing brain
  exploration/open behavior against existing auth routes.

**Changed**
- `BrainHub` now accepts a full `systemState` model, not just a narrow status map; renderer
  still remains state-consumer only.
- `BrainHubView` now wires live brain-state signals and exposes refresh/availability hints.
- `BrainScene` now responds to module statuses + global activity with subtle connector,
  relationship-link, and core-lighting shifts.
- `BrainNode` now supports visual states: `active`, `attention`, `progress`, `completed`,
  `unavailable`, plus optional progress strip and one-shot real-event pulse.
- `BrainFallbackList` now mirrors module status text for non-spatial accessibility paths.
- `BrainModulePreview` now surfaces module status/progress/attention metadata.
- Global styles (`globals.css`) gained brain system-link styling, activity lighting tiers,
  status-specific node variants, and reduced-motion-safe event pulse animation.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test` (157 files, 845 tests)
- `npm run build` (50 static routes)

### Layer E — Landing experience & interactive product preview — 2026-09-09

**Added**
- `src/components/marketing/LandingBrainExperience.tsx` to host the real Brain Hub
  interaction model in landing preview mode.

**Changed**
- Landing hero now uses the interactive Brain Hub as the primary visual and updates CTAs to
  Get Started / Explore MASTERY.
- Navigation and footer anchors now map to the new section flow:
  Experience, Systems, How it works, Preview.
- The six-system explanation was redesigned from a generic grid into a spatial,
  brain-connected composition.
- The operating cycle now communicates
  Define→Plan→Focus→Act→Grow→Analyze→Improve.
- Personal Operating System section now emphasizes decision intelligence and shared context.
- Product preview is now interactive and data-driven from the real module registry, with
  explicit read-only labeling and real auth/app routes for CTAs.
- `src/components/marketing/marketing-modules.ts` now exposes richer module definitions
  (short + long descriptions, preview bullets, submodule slices, CTA routes) derived from
  existing app metadata.
- Landing metadata updated with Open Graph copy reflecting the interactive product preview.

**Verified**
- `npm run typecheck`
- `npm run lint`
- `npm test` (155 files, 840 tests)
- `npm run build` (50 static routes)

### Brand pivot — Gold/Obsidian/Ivory/Slate design system — 2026-09-06

### Maintenance UI patch — 2026-09-07

**Added**
- `src/components/layout/theme-video-background.tsx` to render `public/mastery video.mp4`
  as a dark-theme-only background layer.
- `src/components/pwa/install-app-button.tsx` for browser-native PWA installation prompts
  with a fallback message path.

**Changed**
- Auth pages now render the dark-theme video background.
- App shell topbar is fixed, opaque, and edge-to-edge; shell content now offsets below it.
- Sidebar branding now uses the `M` logo image; in collapsed mode the collapse control is
  hidden and clicking the logo expands the full module sidebar.
- Landing page top bar now spans full width and includes Download app; the secondary CTA is
  no longer an account-start button.
- Light theme background/surface/border token values are slightly darker to reduce
  brightness.

**Added**
- Full owner-specified color token system in `globals.css` (light primary, dark
  counterpart) replacing the Layer 2 indigo palette — Mastery Gold `#C9972B` as the sole
  brand accent, obsidian/ivory/slate neutrals, restrained glassmorphism. Two tokens were
  raised for WCAG contrast (`--border-strong`, `--ring`); every accent/semantic fill pairs
  with dark obsidian text, never white. New `--gold-subtle` and `--glass-fill`/
  `--glass-border-color` tokens; `.mastery-glass` (generalized `.mastery-glass-card`) with
  an opaque no-`backdrop-filter` fallback.
- New shared components: `Logo` (the real `public/brand/` PNG assets, never redrawn),
  `GlassPanel`/`GlassCard`, `PasswordInput`, `ProgressRing`, `SectionHeader`.
- A real public landing page at `/` (`src/components/marketing/`) — nav, hero, product
  preview, value props, the Plan→Focus→Act→Grow loop, the Spiritual/Personal/Societal
  framework diagram, an AI section, a CTA band, footer. Fully static, no data dependency.

**Changed**
- `AuthCard`/login/register/forgot-password — glass variant, real logo, owner-specified
  copy, generous radius/spacing.
- `Sidebar` — the real logo asset (mark when collapsed, full lockup when expanded)
  replaces the text wordmark.
- `public/manifest.webmanifest`, `layout.tsx`'s `themeColor` — updated to the new palette.

**Verified:** live-rendered via headless Chromium — landing (desktop + mobile), login,
register, and the authenticated dashboard/sidebar (temporary local auth bypass, reverted
before commit) — no console errors, no leftover indigo. `typecheck`/`lint`/`test`
(139 files, 735 passed + 1 skipped)/`build`/`analyze`/`format` all green.

**Known limitation:** `docs/DESIGN_SYSTEM.md` still documents the old indigo palette; a
docs catch-up is owed (ADR-0033). Sign-up keeps a single `Name` field (not First/Last —
a data-model change, out of scope for a UI rebuild). See ADR-0033 for the full rationale,
including its relationship to the separate green dark-theme design canvas from earlier
the same day (not implemented; reference only).

### Sidebar navigation — 2026-09-06

**Changed**
- `SidebarNav` — Plan / Focus / Act / Grow / Analytics are now collapsible dropdowns: a
  header button (icon + label + chevron, `aria-expanded`/`aria-controls`) toggles a
  tree-style list of that section's routes (a connecting vertical line + a short tick per
  item, no per-item icons). A section opens by default when the current route is inside
  it; any explicit click overrides that default for the rest of the session. Recovery
  Center stays a single direct link — intentionally not tucked behind a toggle
  (`docs/RECOVERY_PRIVACY.md`: visible, never an extra click deeper than necessary). The
  collapsed icon-rail sidebar is unchanged (no room for a tree; still a flat icon list).
- `Topbar` — removed the light/dark theme toggle from the bar. Theme still lives on
  **Settings** (`ThemeToggle`, unchanged) and in the command palette (⌘K).

**Tests:** `sidebar-nav.test.tsx` gained 3 cases (active section open by default / others
collapsed, click-to-toggle open and closed, Recovery Center never gets a toggle button);
the 3 existing cases needed no changes (the mocked active route already exercises the new
default-open behavior).

**Verified:** live-rendered via a headless-Chromium screenshot of the real app shell
(light + dark, collapsed and expanded) — no console errors.

### Branding — 2026-09-06

**Added**
- `public/brand/mastery-mark.png` (512×199) and `public/brand/mastery-logo.png`
  (960×332) — the gold "M" mark and the full "MASTERY" wordmark lockup, cropped and
  downscaled with `sharp` from the owner-supplied 4K source (originals not committed;
  transparent PNG, palette-optimized, 25–44 KiB each).
- `.mastery-glass-card` / `.mastery-auth-backdrop` utilities in `globals.css` — a
  frosted-glass card look (`color-mix` over `--color-surface-raised` + `backdrop-filter:
  blur`) and a soft two-blob radial-gradient backdrop (`color-mix` over
  `--color-primary`), both theme-aware.

**Changed**
- `Sidebar` — the mark now sits to the left of the "Mastery" wordmark at the top of the
  expanded sidebar (`next/image`, decorative — `alt=""`, the adjacent text is the
  accessible name).
- `AuthCard` — new optional `logo` slot (centered above the title) and `variant:
  "default" | "glass"` prop; existing callers (register, forgot-password) are
  unaffected (default variant, no logo).
- `/login` — passes the full lockup as `logo` and `variant="glass"`; `(auth)/layout.tsx`
  gets the decorative backdrop (applies to all three auth pages, purely decorative).
- `tests/unit/bundle-budget.test.ts` — the build-verification case gets an explicit
  15s timeout (gzip-ing a full static export is real I/O; it occasionally exceeded
  vitest's 5s default under load — a pre-existing flake, not a budget regression).

**Verified:** live-rendered via a headless Chromium screenshot against `next dev`
(light + dark) — glass card, gradient backdrop, and both logos render correctly with no
console errors. `next/image` (first use in the app; `images.unoptimized` per ADR-0015
makes it a zero-cost swap for a plain `<img>` that also satisfies
`@next/next/no-img-element`). Bundle budget still comfortably clear (~818 KiB / 900 KiB
total JS gzip).

### Post-build-order — 2026-09-06

**Changed**
- Merged the worktree branch (Layers 9D→23, 29 commits) to `main` via fast-forward — the
  build order now lives on `main`.
- **i18n backlog — shared page chrome** (ADR-0027 follow-up): `SearchTrigger`,
  `ModulePlaceholder`, and `SectionLanding` now go through `next-intl` (new `chrome.*`
  keys in `messages/en.json` + `messages/nl.json`; section/module labels reuse the
  `navMessageKey` `t.has()` fallback pattern). None is rendered by a test — no test files
  changed.

**Still on the i18n backlog:** breadcrumbs (`BreadcrumbTrail` is rendered by 30
feature-view tests with no intl provider), the `EmptyState` / `ErrorState` /
`LoadingState` default strings, and the per-domain feature-view copy. All three share the
same blocker — ~30 view-test files would need `renderWithIntl` in one commit — deferred by
the owner.

### Layer 23 — Performance, Cost & Accessibility — 2026-09-05

**Added**
- `scripts/analyze-bundle.mjs` + `npm run analyze` / `npm run build:analyze` — reports
  every `out/_next/static` JS/CSS asset by gzip size and **fails on a budget breach**
  (total JS 900 KiB gzip / 3200 KiB raw, largest chunk 240 KiB gzip — a ratchet ~10–25%
  above today). Wired into the CI `app` job after `npm run build`.
- `docs/PERFORMANCE.md` — the standing review: bundle budget, code-splitting inventory,
  Firestore read-discipline audit (no listeners; pagination enforced), Cloud Function
  cold-start / token-cost review, Core Web Vitals plan, accessibility status.
- `tests/unit/bundle-budget.test.ts` (script logic + "real build within budget");
  `tests/unit/ci-workflow.test.ts` now asserts the CI `analyze` step.
- Two `src/test/a11y.test.tsx` cases — `FormField` label/description/error wiring and the
  `Sparkline` accessible name.

**Changed**
- `src/components/layout/app-shell.tsx` — the command palette (`cmdk`) now loads through
  `next/dynamic`, mounted only after the first ⌘K, so it is a separate chunk most sessions
  never fetch. The keyboard shortcut (in `ShellProvider`) is unaffected.
- `eslint.config.mjs` — `no-console` off for `scripts/**/*.mjs` (Node CLI tooling).
  `docs/ARCHITECTURE.md` §10, `README.md` doc index, `docs/DECISIONS.md` — ADR-0032.

**Known limitation:** no user-visible change and no deploy content. Core Web Vitals are
still not collected in production (needs a Blaze callable to POST to — deferred);
colour-contrast is checked by Lighthouse/eye, not in CI (jsdom limitation); deferring
`firebase/functions`/`firebase/storage` out of the eager client singleton is left as an
open recommendation (`docs/PERFORMANCE.md` §3).

### Layer 22 — Deployment & CI/CD — 2026-09-05

**Added**
- `.github/workflows/ci.yml` — GitHub Actions pipeline on push/PR to `main`: `app`
  (typecheck → lint → format:check → test:coverage → prod build), `functions`
  (typecheck / lint / test / build), `emulator` (`test:rules` + `test:integration` under
  `firebase emulators:exec`), `e2e` (Playwright + emulator), then `deploy` — `needs` all
  four, gated to `push` on `main`, runs `firebase deploy --only
  hosting,firestore:rules,firestore:indexes,storage` via a service-account secret to the
  `production` GitHub Environment. `functions` is deliberately absent from the `--only`
  list (Spark plan).
- `.github/workflows/pr-preview.yml` — same-repo PRs get a `firebase
  hosting:channel:deploy pr-<n> --expires 7d` preview URL; forks skipped.
- `.github/dependabot.yml` — weekly npm (root + `functions/`) and github-actions updates.
- `.nvmrc` (`24`); `tests/unit/ci-workflow.test.ts` — parses `ci.yml` and asserts the job
  graph, the full verification gate, and that the deploy step never ships `functions`.
- `README.md` CI badge.

**Changed**
- `docs/DEPLOYMENT.md` — §3 rewritten (job table, required repository secrets, preview
  workflow), §5 runbook and §6 pre-launch checklist updated. `docs/DECISIONS.md` —
  ADR-0031. `package.json` — `yaml` devDependency (workflow test).

**Known limitation:** no runtime change and no deploy content — CI config, one workflow
test, and docs only; the live site is unchanged from Layer 20. The `deploy` / `pr-preview`
jobs need the owner to add the repository secrets in `docs/DEPLOYMENT.md` §3 before they
can run; a dedicated `staging` project is still deferred (ADR-0008); `functions` joins the
deploy `--only` list at the Blaze move. GitHub Actions itself cannot execute in this
sandbox — the workflows are authored and YAML-/graph-verified only.

### Layer 21 — Complete Testing Program — 2026-09-05

**Added**
- Playwright e2e (`@playwright/test`): `playwright.config.ts` (chromium-desktop +
  mobile-safari, `webServer` on the dev server with the emulator flag) and `tests/e2e/` —
  `auth`, `settings`, `goal`, `recovery-gate`, `pwa` specs (22 runs) covering the
  browser-shaped critical journeys.
- Accessibility: `src/test/a11y.ts` `expectNoAxeViolations` + `src/test/a11y.test.tsx`
  (axe-core over the shared states, offline banner, sidebar nav, and a report document) —
  runs as part of `npm test`.
- Coverage: `@vitest/coverage-v8`, a `coverage` block in `vitest.config.mts` with
  thresholds pinned at the current baseline, and a `test:coverage` script.
- `package.json` — `test:coverage`, `test:e2e`, `test:e2e:ui`, `test:e2e:install`.

**Changed**
- `docs/TESTING_STRATEGY.md` — the 24-journey table gains a "Covered by" column (every
  journey has a named automated owner); new e2e / a11y / coverage sections.
  `docs/DECISIONS.md` — ADR-0030.

**Known limitation:** no runtime change and no deploy. `test:e2e` / `test:rules` /
`test:integration` run in CI — Playwright browsers and the Firebase emulator can't run in
the current sandbox (unchanged since Layer 9); all are written and parse-verified. The
coverage floor (~54%) is a ratchet, not a target.

### Layer 20 — Security Hardening — 2026-09-05

**Added**
- `firebase.json` — a `"source": "**"` header block on every Hosting response:
  **`Content-Security-Policy`** (`default-src 'self'`, `object-src`/`frame-ancestors`
  `'none'`, `base-uri`/`form-action` `'self'`, a Firebase- and Google-sign-in-shaped
  `script-src` / `connect-src` / `frame-src` allowlist, `upgrade-insecure-requests`),
  **`Strict-Transport-Security`** (2y, `includeSubDomains; preload`),
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Cross-Origin-Opener-Policy: same-origin-allow-popups`,
  `Cross-Origin-Resource-Policy: same-origin`, a deny-all `Permissions-Policy`,
  `X-DNS-Prefetch-Control: off`.
- `src/lib/firebase/app-check.ts` — `ensureAppCheck(app)`, called right after
  `initializeApp`: initializes Firebase App Check (`ReCaptchaV3Provider`, dynamic import)
  **only when `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` is set**, never on the emulator.
  A no-op today; the owner adds the key and enables enforcement in the Firebase console.
- `src/lib/env.ts` + `.env.example` — the optional `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`.

**Changed**
- `firestore.rules` — the profile `email` is now frozen on update (owned by Firebase Auth).
- `storage.rules` — comment updated after review (no change to the rule — owner-only +
  image/PDF + 10 MB is the whole surface).
- `docs/SECURITY.md` §5 / §6 / §10; `docs/DECISIONS.md` — ADR-0029.

**Tests:** `tests/unit/security-headers.test.ts` (6), `src/lib/firebase/app-check.test.ts`
(3), and an "email frozen on update" rules case (written, not executed in-session).

**Known limitation:** `script-src` uses `'unsafe-inline'` — a static export can't mint a
per-request nonce and Next's inline hydration scripts can't be hashed (ADR-0029). App Check
does nothing until the owner configures the key + enforcement; `npm audit` reports 6
moderate advisories, all in the dev-only `firebase-admin` dependency tree (not shipped).

### Layer 19 — PWA & Mobile Readiness — 2026-09-05

**Added**
- `public/manifest.webmanifest` + generated icons (`icon-192/512`, `icon-maskable-512`,
  `apple-touch-icon` — an indigo "M" monogram) linked from root `metadata`.
- `public/sw.js` — a hand-rolled service worker (no Workbox / no PWA plugin, ADR-0028):
  navigations network-first → cached URL → `/offline`; `/_next/static/**` + icons +
  manifest cache-first; cross-origin never intercepted; **`/recovery*` navigations never
  cached and never served from cache** (fail-closed offline).
- `src/app/offline/page.tsx` — the SW navigation fallback (explicit that cloud data isn't
  available offline).
- `src/components/pwa/` — `ServiceWorkerRegister` (registers `/sw.js`, not on `localhost`,
  auto-updates), `useOnlineStatus` + `OfflineBanner` (mounted in `Providers`),
  `useInstallPrompt` + `InstallButton` (in Settings — no banner).

**Changed**
- `src/app/layout.tsx` — `manifest` / `appleWebApp` / `icons` metadata.
- `firebase.json` — headers for `/sw.js` (`no-store`, `Service-Worker-Allowed: /`) and
  `/manifest.webmanifest` (`application/manifest+json`).
- `SettingsView` gains an "Install" section (i18n `settings.install*`, en + nl).
- `docs/ARCHITECTURE.md` §9a; `docs/DECISIONS.md` — ADR-0028.

**Tests:** `components/pwa/*` (online status, install prompt, offline banner, install
button) and `tests/unit/manifest.test.ts`.

**Known limitation:** offline support is an **app-shell + static-asset cache only** — not
Firestore data; the offline page/banner say so. Icons are generated placeholders; iOS
install is manual (`beforeinstallprompt` is Chromium-only).

### Layer 18 — Internationalization & Theme — 2026-09-05

**Added**
- `next-intl@^4` and `src/i18n/` — a **client-side** i18n architecture (static export, no
  middleware / `[locale]` route / plugin): `locales.ts`, a `useSyncExternalStore`
  `localeStore` (localStorage + `<html lang>` sync + cross-tab), `messagesFor`,
  `I18nProvider` (now the outermost provider), `useActiveLocale`. English + Dutch
  catalogues in `messages/en.json` / `messages/nl.json`.
- `src/features/settings/` — the `/settings` page: a **Language** picker (en/nl), the
  existing **Theme** toggle, a read-only profile, and a link to notification preferences.
- `src/test/intl.tsx` — `renderWithIntl` / `IntlWrapper` test helpers.

**Changed**
- `src/config/navigation.ts` — `navMessageKey` / `navSectionMessageKey`; sidebar & bottom
  navigation resolve labels via `useTranslations()` with an English fallback.
- The **Notifications** feature (`NotificationsView`, `NotificationPreferences`) is fully
  migrated to `useTranslations`, including the `{count}` plural on "Unread".
- `src/app/(app)/settings/page.tsx` — `ModulePlaceholder` → `<SettingsView />`.
- `docs/ARCHITECTURE.md` §9, `docs/PRODUCT_REQUIREMENTS.md` §13; `docs/DECISIONS.md` —
  ADR-0027.

**Tests:** `i18n/locales` (locale list, storage fallback chain, en/nl key parity),
`SettingsView` (4). Nav + notifications component tests updated to `renderWithIntl` (no
assertion changes).

**Known limitation:** only navigation, Settings, and Notifications use `useTranslations` —
the rest of the app's copy is English literals, tracked as an incremental per-domain
migration backlog (ADR-0027). Locale persists to `localStorage`, not Firestore.

### Layer 17 — Notifications — 2026-09-05

**Added**
- `src/features/notifications/` — the in-app notification centre:
  - `notification-schema.ts` — 7 notification types + 5 preference categories + a
    type→category map, the `notifications` record (`dedupeKey` default `""`),
    `notificationHref` (safe deep link per type), the `notificationPreferences` singleton
    (category toggles, quiet hours, timezone, `pushEnabled`, milestone-lead / KPI-stale
    windows), `defaultNotificationPreferences`, `isWithinQuietHours`.
  - `reminder-scan.ts` — pure `computeDueReminders`: task due-today/overdue, milestone in
    the lead window, habit not logged after its reminder time, KPI stale, goal review
    overdue. Every seed carries `dedupeKey = <type>:<relatedId>:<localDay>`.
  - `notification-repository.ts` + `use-notifications.ts` + `use-unread-count.ts` — the
    `notifications` repo (generic owner-only) with mark-read / mark-all / archive /
    create-if-absent, a `notificationPreferences` singleton upsert, the page hook (runs the
    scan idempotently on mount), and a light unread count for the topbar.
  - `NotificationsView` (unread / earlier split, deep links, read toggle, dismiss,
    mark-all-read), `NotificationPreferences` (category switches, quiet hours, timezone,
    lead/stale numbers, an inert push toggle), `NotificationBell` (topbar unread badge).

**Changed**
- `src/app/(app)/notifications/page.tsx` — `ModulePlaceholder` → `<NotificationsView />`.
- `src/components/layout/topbar.tsx` — the plain Bell link → `<NotificationBell />`.
- `docs/DATA_MODEL.md` (`notifications` expanded, `notificationPreferences` added),
  `docs/ARCHITECTURE.md` §5, `docs/PRODUCT_REQUIREMENTS.md` §12; `docs/DECISIONS.md` —
  ADR-0026.

**Tests:** `notification-schema` (schema + defaults + `notificationHref` +
`isWithinQuietHours`), `reminder-scan` (6), `NotificationsView` (5),
`NotificationPreferences` (2), and a notifications integration test (written, not executed
in-session).

**Known limitation:** no background delivery / FCM push — reminders refresh only while the
app is open and the notifications page is visited. Push (service worker, VAPID, token
lifecycle, a server send/sweep) and `event-today` reminders are deferred (ADR-0026);
`pushEnabled` is stored but inert.

### Layer 16 — Reports & PDF Export — 2026-09-05

**Added**
- `src/features/reports/` — compose a report for any period (`weekly` / `monthly` /
  `quarterly` / `annual` / `custom`) from a chosen set of sections (`summary`, `goals`,
  `habits`, `focus`, `kpis`, `planning`):
  - `report-data.ts` — `buildReportData(range, sections)`, an aggregation service: one
    `Promise.all` over the goal / milestone / task / habit / habitLog / focusSession / kpi /
    kpiEntry repositories (only those a requested section needs), filtered to the range. It
    **never reads a Recovery Center collection**, so a report can't leak recovery data.
  - `report-schema.ts` / `report-repository.ts` / `use-reports.ts` — the stored
    metadata record (`users/{uid}/reports/{id}` — title, period, range, sections, `format`,
    `generatedAt`; client-written, owner-only), the generate form, and the hook.
  - `ReportDocument` — a branded, fixed-light "paper" page with a stat grid / table per
    section, per-section empty handling, and a "Recovery Center data is never included"
    footer. `ReportsView` at `/analytics/reports` — the generate form + a "Download PDF"
    action (`window.print()`) + a history list.
- `src/app/globals.css` — an `@media print` block isolates `[data-report-print]` and hides
  `[data-print-hide]` app chrome so "Save as PDF" produces a clean report.

**Changed**
- `src/app/(app)/analytics/reports/page.tsx` — `ModulePlaceholder` → `<ReportsView />`.
- `docs/DATA_MODEL.md` describes `reports/{reportId}`; `docs/ARCHITECTURE.md` §1/§5;
  `docs/DECISIONS.md` — ADR-0025.

**Tests:** `report-schema` (form + `resolvePeriodRange` + title + record), `report-data` (8
— section/repo selection, period filtering, habit consistency, focus sums, KPI first-vs-last,
task on-time/late/cancelled/overdue), `ReportDocument` (3), `ReportsView` (4), and a report
metadata integration test (written, not executed in-session).

**Known limitation:** the PDF is the browser's "Save as PDF" — no server-rendered PDF (a
`generateReportPdf` Cloud Function is documented but not built; needs Blaze). Reads are
capped at one repository page per collection, and "completed in period" is approximated
from `updatedAt`.

### Layer 15F — Accountability Partner — 2026-09-05

The final Recovery Center sublayer — **Layer 15 (15A–15F) is complete.**

**Added**
- `functions/src/recovery/configure-accountability-partner.ts` —
  `configureAccountabilityPartner` (`op: "create" | "update" | "revoke"`), the only writer
  of `users/{uid}/recoveryAccountabilityPartners/{id}` (rules reject a direct client write).
- `functions/src/recovery/get-accountability-projection.ts` + `accountability-projection.ts`
  — `getAccountabilityProjection`: the only way a partner sees anything. Requires the
  caller's verified email to match an active, unexpired, unrevoked grant; returns nothing
  but the scope's projection (streak / status / checked-in-today / a short summary / a
  custom field subset, optionally a bare setback count). Never reflections, HALT, triggers,
  setback narratives, coping actions, or coach sessions. Both written and unit-tested;
  **not deployed** (Spark plan).
- `src/features/recovery/recovery-accountability-schema.ts` / `-client.ts` /
  `use-recovery-accountability.ts` / `use-accountability-projection.ts`.
- `AccountabilitySection` (in the goal detail view) with `AccountabilityPartnerDialog` —
  the owner shares a narrow slice of one goal under a permission scope, with an optional
  expiry and revoke; `PartnerProjectionView` + `/recovery/partner` route — the
  partner-facing card, outside the PIN gate.

**Changed**
- `firestore.rules` — `isServerMediatedRecoveryWrite` now also refuses a direct client
  write to the top-level `recoveryAccountabilityPartners` collection.
- `RecoveryHomeView`'s "Coming next" block is removed (Layer 15 is done).
- `functions/tests/ai/fakes.ts` — the fake Firestore doc ref gained `update()`.
- `docs/DATA_MODEL.md`, `docs/RECOVERY_PRIVACY.md` §6; `docs/DECISIONS.md` — ADR-0024.

**Tests:** `configure-accountability-partner` (7), `get-accountability-projection` (9),
`accountability-projection` (3), recovery-accountability schema, `AccountabilitySection`
(5), `PartnerProjectionView` (2), a Layer 15F rules block, and a grant integration test —
the last two written, not executed in-session (emulator restriction).

**Known limitation:** neither Cloud Function is deployed, so configuring a partner or
viewing a shared projection fails in production until Blaze; the partner must already be a
Mastery user with a verified email; reminder delivery is Layer 17.

### Layer 15E — Recovery Coach — 2026-09-05

**Added**
- `functions/src/recovery/recovery-coach-query.ts` + `recovery-coach-context.ts` —
  `recoveryCoachQuery`, a fully isolated AI Cloud Function: its own `RECOVERY_COACH_SYSTEM`
  prompt (supportive, non-judgmental, immediate safe next step, crisis→professional/emergency
  help, no diagnosis), its own context builder that reads **only** the caller's recovery
  data for one goal (goal + check-ins + setbacks + coping toolkit), and its own storage
  `users/{uid}/recoveryCoachSessions/{id}`. Shares only the per-user AI spend counters via
  the new `bumpUsageCounters` (extracted from `recordUsage`); writes nothing to
  `coachExchanges` / `aiCallLogs`. Faith-based encouragement is gated on the goal's opt-in.
  Written and unit-tested; **not deployed** (Spark plan).
- `src/features/recovery/recovery-coach-schema.ts` / `recovery-coach-client.ts` /
  `use-recovery-coach.ts` — client side: `askRecoveryCoach` calls the callable,
  `listRecoveryCoachSessions` reads history back (sessions are Cloud-Function-only).
- `RecoveryCoachPanel` — a goal-scoped section in the recovery goal detail view: a message
  box, "Ask for a next step", and the recent replies with their suggested steps and
  disclaimers.

**Changed**
- `firestore.rules` — `isServerMediatedRecoveryWrite` gained a `collection` parameter and
  now also refuses a direct client write to the top-level `recoveryCoachSessions`
  collection (reads unchanged).
- `functions/src/ai/shared/quota.ts` — `bumpUsageCounters` extracted from `recordUsage`
  (behavior identical; the general endpoints still write their `aiCallLogs` record).
- `RecoveryHomeView`'s "Coming next" list drops to just the accountability partner (15F).
- `docs/AI_ARCHITECTURE.md` §7, `docs/DATA_MODEL.md`, `docs/RECOVERY_PRIVACY.md` updated;
  `docs/DECISIONS.md` — ADR-0023.

**Tests:** `recovery-coach-query` function tests (8), `recovery-coach-context` tests (3),
`bumpUsageCounters` tests (3), recovery-coach schema tests, `RecoveryCoachPanel` component
tests, plus a Layer 15E rules block and a coach integration test (both written, not
executed in-session — emulator restriction).

**Known limitation:** `recoveryCoachQuery` is not deployed, so "Ask for a next step" fails
in production until the owner upgrades to Blaze; the coach is goal-scoped only.

### Layer 15D — Coping Toolkit — 2026-09-05

**Added**
- `src/features/recovery/recovery-coping-schema.ts` / `recovery-coping-repository.ts` /
  `use-recovery-coping.ts` — a per-goal coping toolkit
  (`users/{uid}/recoveryGoals/{goalId}/copingActions`): coping actions with `title`,
  `category` (grounding / physical / social / cognitive / faith / other) and a short
  `howTo`. Client-written under the generic owner-only rule; removal is a reversible
  archive. Includes `COPING_SUGGESTIONS`, an 11-item starter library of evidence-informed
  behavioral prompts (3 faith-based).
- `CopingToolkitSection` in the recovery goal detail view — lists saved coping actions,
  an "Add your own" dialog (`CopingActionDialog`), and a "Quick add" chip row of unused
  suggestions; faith-based suggestions appear only when the goal opts in.

**Changed**
- `RecoveryGoalDetailView` mounts the toolkit between check-ins and setbacks;
  `RecoveryHomeView`'s "Coming next" list drops to Recovery Coach (15E) and accountability
  partner (15F).
- `docs/DATA_MODEL.md` describes `copingActions`; `docs/DECISIONS.md` — ADR-0022;
  `docs/RECOVERY_PRIVACY.md` — Layer 15D status.

**Tests:** recovery-coping schema tests, `CopingToolkitSection` component tests, a coping
emulator integration test, and a Layer 15D rules block (owner create/read/archive; cross-user
denied) — the last two written, not executed in-session (emulator restriction).

**Known limitation:** no Cloud Function and no `firestore.rules` change this layer; hard
delete of coping actions is still deferred, and the suggestion library is English-only
until i18n (Layer 18).

### Layer 15C — Check-ins & Tracking — 2026-09-05

**Added**
- `src/features/recovery/recovery-checkin-schema.ts` / `recovery-checkin-repository.ts` /
  `recovery-progress.ts` / `use-recovery-checkins.ts` — daily recovery check-ins under a
  goal (`date`, `stayedOnTrack`, `urgeIntensity` 0-10, HALT booleans, `triggersToday` /
  `copingUsed`, `reflection`), upserted one-per-day; a bespoke nested repository; and pure
  `summarizeRecoveryProgress` (current / longest streak, days on track, average urge —
  derived on read, never stored).
- `src/features/recovery/recovery-relapse-schema.ts` / `recovery-relapse-client.ts` /
  `use-recovery-relapses.ts` — setback records read by the client but written **only** by
  the `recordRecoverySetback` Cloud Function.
- `functions/src/recovery/record-recovery-setback.ts` — the onCall that validates the
  request, checks the goal exists, and writes `recoveryGoals/{goalId}/relapses/{id}` via
  the Admin SDK. Written and unit-tested; **not deployed** (Spark plan — as with the Layer
  13/14 AI functions).
- `RecoveryGoalDetailView` with a progress grid, recent check-ins, and setbacks list;
  `CheckInDialog` and `RelapseLogDialog` (framed as "restart from here", never failure).
  `RecoveryGoalCard` gains an "Open" button; `RecoveryHomeView` routes to the detail view.
- Tests: `record-recovery-setback` function tests (6), recovery-progress /
  recovery-checkin-schema / recovery-relapse-schema unit tests, `RecoveryGoalDetailView`
  component tests, a check-ins emulator integration test, and a Layer 15C rules block
  (direct relapse client write rejected) — the last two written, not executed in-session.

**Changed**
- `firestore.rules` — the recursive-wildcard owner-only rule now refuses a direct client
  write to `.../relapses/{id}` (`isServerMediatedRecoveryWrite`), making the Cloud Function
  the only writer. Reads unchanged.
- `docs/DATA_MODEL.md` describes `checkIns` and `relapses`; `docs/DECISIONS.md` — ADR-0021.

**Known limitation:** `recordRecoverySetback` is not deployed, so "Log a setback" fails in
production until the owner upgrades to Blaze; check-ins are fully functional (client-only).
Hard delete of recovery data is still deferred.

### Layer 15B — Recovery Data Model — 2026-09-08

**Added**
- `src/features/recovery/recovery-goal-schema.ts` / `recovery-goal-repository.ts` /
  `use-recovery-goals.ts` — the `recoveryGoals` collection: one record per self-identified
  behavior with `behavior`, `motivation`, `startDate`, `triggers`/`warningSigns`/
  `copingStrategies` lists, `supportNotes`, `faithBasedEncouragement` (opt-in), and a
  neutral `recoveryStatus` (`active`/`going-well`/`challenging`/`paused` — no
  shame-framed state). Client-written under the existing owner-only rule.
- `RecoveryGoalForm` / `RecoveryGoalDialog` / `RecoveryGoalCard`, and the Recovery Center
  home now shows the goals list (create / edit / archive) behind the Layer 15A PIN gate,
  with a calm "not medical or psychological advice" disclaimer.
- Tests: recovery-goal schema unit tests; `RecoveryHomeView` rewritten for the goals list;
  a `recoveryGoals` block in the rules regression test; a create/update/archive emulator
  integration test (written; not executed in-session).

**Changed**
- `docs/DATA_MODEL.md` annotates `recoveryGoals` and marks the still-reserved
  subcollections with their planned sublayer.
- `docs/DECISIONS.md` — ADR-0020.

**Known limitation:** archive only — hard deletion of a recovery goal (cascading its
future subcollections) is a dedicated Cloud Function to be built with Layer 15C.

### Layer 15A — Recovery Center Privacy Architecture — 2026-09-08

**Added**
- `src/features/recovery/` — the Recovery Center's privacy gate: a client-side salted
  SHA-256 PIN (`pin-crypto.ts`, Web Crypto, no new dependency), a singleton
  `recoveryProfiles/{uid}` lock config (`lockMethod` extensible for a future WebAuthn
  method, `pinHash`/`pinSalt`, client-tracked failed-attempt lockout), session-scoped
  "unlocked" state (`sessionStorage`, 15-minute TTL, cleared on tab close), and a
  "forgot PIN" reset flow. `RecoveryGate` wraps the entire `/recovery` route so nothing
  behind it renders until unlocked; `RecoveryHomeView` shows the privacy assurances and an
  honest "coming in 15B–15F" list rather than fabricated feature content.
- `/recovery` renders the real gate + home (was a placeholder).
- Tests: pin-crypto/schema unit tests; `RecoveryGate`/`RecoveryHomeView` component tests;
  a dedicated `tests/rules/recovery.rules.test.ts` regression suite for `recoveryProfiles`
  specifically; a lock-flow emulator integration test (written; not executed in-session).

**Changed**
- `firestore.rules` — comment-only: flags that a later sublayer adding a
  Cloud-Function-only-write recovery collection must restructure the generic owner-only
  wildcard rule to exclude it (Firestore ORs every matching rule together, so a narrower
  block alongside it cannot restrict anything on its own).
- `docs/RECOVERY_PRIVACY.md` — added the PIN gate's own access-path row to §8's table and
  a Layer 15A status note.
- `docs/DATA_MODEL.md` annotates `recoveryProfiles`.
- `docs/DECISIONS.md` — ADR-0019.

**Known limitation:** the PIN protects against casual access, not the account owner —
documented explicitly as a privacy shield, not encryption. No behavioral tracking data
(`recoveryGoals`, check-ins, coping toolkit, Recovery Coach, accountability partner)
exists yet — that's Layer 15B onward.

### Layer 14 — Weekly AI Summary — 2026-09-04 — scheduled Cloud Function written and unit-tested, not yet deployed

**Added**
- `functions/src/scheduled/generate-weekly-summary.ts` — a daily `onSchedule` function
  that, for every active user whose local calendar day is Monday (via each user's own
  stored `timezone`) and who hasn't opted out, evaluates their past 7 local days and
  stores a Weekly AI Summary: computed facts (goals/milestones completed, task
  completion/cancellation/overdue, habit consistency, focus time, KPI movement) plus
  AI-generated `lessons`/`suggestedPriorities` grounded only in those facts. Idempotent
  against a rerun for the same week. Also writes the app's first `notifications` document.
- `src/features/auth/schema.ts` — `userProfileSchema` gains `weeklySummaryEnabled`
  (default `true`), the opt-in this layer's scheduler respects.
- `src/features/weekly-summaries/` — reads the summary history and lets the user archive
  or delete an entry (the Cloud Function is the sole writer); surfaced as a new "Weekly
  Summaries" tab on the existing AI Coach page rather than a new nav item.
- Tests: `functions/tests/scheduled/` (25 new tests covering timezone-aware scheduling,
  paginated user listing, fact collection, generation + idempotency, and batch error
  isolation); `weekly-summaries` schema/view unit tests; a read/archive/delete emulator
  integration test (written; not executed in-session).

**Changed**
- `functions/tests/ai/fakes.ts` — the shared fake Firestore now really implements
  `orderBy`/`startAfter` (was a documented no-op) and an `.empty` flag, both needed by
  this layer's tests.
- `docs/DATA_MODEL.md` annotates `weeklySummaries` and `notifications`.
- `docs/DECISIONS.md` — ADR-0018.

**Known limitation:** not deployed this layer — same Spark-plan situation as Layer 13
(ADR-0017); no summary is generated until the owner upgrades to Blaze and deploys.

### Layer 13 — General AI Architecture — 2026-09-04 — Cloud Functions written and unit-tested, not yet deployed

**Added**
- `functions/src/ai/` — five authenticated Cloud Functions (`masteryCoachQuery`,
  `generatePlanningRecommendations`, `generateGoalBreakdown`,
  `generateReflectionQuestions`, `analyzeExecutionPatterns`) sharing one flow: auth,
  request validation, a per-user daily/monthly quota, a minimal per-intent context (own
  data only, bounded reads), a provider call, structured-JSON-output validation, usage/
  audit logging, and a persisted exchange — returning the documented `answer` /
  `assumptions` / `suggestedActions` / `disclaimers` / `influencedBy` contract.
  `influencedBy` is always attached server-side from the context actually loaded, never
  produced by the model. An `AiProvider` interface keeps the vendor swappable; the
  concrete implementation calls Anthropic Claude via the new `@anthropic-ai/sdk`
  dependency, with its key bound as a Functions secret.
- `src/features/ai-coach/` — calls the five callables and reads back the resulting
  `coachExchanges` history (write access is Admin-SDK-only); `AiCoachView` with an intent
  picker and exchange history.
- `src/lib/firebase/client.ts` gains a Functions client instance — the app's first
  Cloud-Function-calling feature.
- `/grow/ai-coach` renders the real feature (was a placeholder).
- Tests: `functions/tests/ai/` (28 new tests against an in-memory Firestore/provider fake
  — quota thresholds, context building, and the full handler orchestration, including
  quota-blocked and malformed-model-output paths); `ai-coach` schema/view unit tests; a
  read-path emulator integration test (written; not executed in-session).

**Changed**
- `docs/DATA_MODEL.md` annotates `coachExchanges`, `aiUsageDaily`, `aiUsageMonthly`,
  `aiCallLogs`.
- `docs/DECISIONS.md` — ADR-0017: Anthropic as the provider, and the owner's explicit
  choice to write/test this layer's Cloud Functions now and deploy them later (the Spark
  plan stays; deploying needs a Blaze upgrade, which remains the owner's call).

**Known limitation:** Cloud Functions are not deployed this layer — the AI Coach page is
live but calls will fail with a normalized error until they are (two owner actions:
upgrade to Blaze, then `firebase deploy --only functions` after setting the
`ANTHROPIC_API_KEY` secret).

### Layer 12 — KPI, Analytics & Life Score — 2026-09-04

**Added**
- `src/features/kpis/` — KPI definitions over `users/{uid}/kpis` with a free-text category,
  0–3 pillars, unit, `direction` (higher/lower-is-better), nullable target, a
  user-configurable `weight` (1–5) for the Life Score, and goal link; pure
  `kpiAttainment(kpi, value)` (0–100 toward the target, `null` with no target set); a
  separate append-only `kpiEntries` time series (the KPI never stores a "current value");
  `kpiRepository`/`listActiveKpis`, `kpiEntryRepository`/`listRecentKpiEntries`;
  `summarizeKpis`; `useKpis`; UI (`KpisView`, `KpiForm`, `KpiDialog`, `AddKpiEntryDialog`,
  `KpiCard` with an attainment badge, progress bar, and a sparkline of recent entries).
- `src/features/life-score/` — a documented, configurable Life Score: `computeLifeScore`
  (pure) is the weight-average of every scorable KPI's attainment, excluding KPIs with no
  target or no entry rather than scoring them 0, and always returning the contributing
  `factors` so the score is never unexplained; `lifeScoreEntries` preserves saved snapshots
  as history (`saveToday` upserts by date); UI (`LifeScoreView` with the score, its
  contributing factors, and a history sparkline; `SaveScoreDialog`).
- `src/features/trends/` — a metric picker (Life Score or any KPI) over a `Sparkline` with
  min/max/average/latest/change stats (`summarizeTrend`, pure).
- `src/components/shared/Sparkline.tsx` — a small dependency-free SVG line chart (optional
  dashed target line, accessible `role="img"`) — no charting library existed yet, and this
  covers every "trend over time" need this layer introduces.
- `/analytics/kpis`, `/analytics/life-score`, `/analytics/trends` render the real features
  (were placeholders). `/analytics/reports` stays a placeholder (Layer 16).
- Tests: schema/stats/pure-formula unit tests across all three features; `KpisView`,
  `LifeScoreView`, `TrendsView`, `Sparkline` (mocked hooks / direct render); KPI and Life
  Score emulator integration tests (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `kpis`, `kpiEntries`, `lifeScoreEntries`.

### Layer 11D — Skills — 2026-09-04 — closes the Grow domain (11A–11D)

**Added**
- `src/features/skills/` — a skill inventory over `users/{uid}/skills`: `skillSchema` +
  create/update/form + `skillInputFromForm` (category, starting/target proficiency 1-5,
  practice plan, `evidence`/`resources`, goal/pillar links, next review date); separate
  `skillReviewSchema` family (append-only progress-history log); pure `currentProficiency`
  (latest review, else starting proficiency) and `progressToTarget` (0-100, clamped) —
  proficiency is derived, never duplicated onto the skill; `skillRepository` +
  `listActiveSkills`/`listSkillOptions`, `skillReviewRepository` +
  `listRecentSkillReviews`; `useSkills` (`logReview`/`removeReview`), `useSkillOptions`; UI
  (`SkillsView`, `SkillForm`, `SkillDialog`, `LogReviewDialog`, `SkillCard` with a
  current→target badge, overdue review indicator, and recent-reviews list).
- `/grow/skills` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `SkillsView` (mocked hook); a skills emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `src/features/learning/` — wired up the `skillId` link deferred in Layer 11B: a Skill
  picker on the learning item form, a linked-skill chip on the card, and
  `learningItemInputFromForm` now maps the form's skill selection instead of hardcoding
  `null`.
- `docs/DATA_MODEL.md` annotation for `skills` + `skillReviews`.

### Layer 11C — Reading — 2026-09-02

**Added**
- `src/features/reading/` — a reading list over `users/{uid}/books`, grouped into
  Currently reading / Want to read / Completed / Abandoned: `bookSchema` + create/update/
  form + `bookInputFromForm` (page-based progress, user-entered `highlights`/`lessons`/
  `actionItems`, goal/pillar links); `emptyHighlight` / `emptyActionItem` /
  `readingProgressPercent` (pure); `summarizeReading` (pure); `bookRepository` +
  `listActiveBooks`; `useReading` (`toggleActionItem`); UI (`ReadingView` split into
  status sections, `BookForm` with two `useFieldArray` editors, `BookDialog`, `BookCard`
  with a progress bar, styled highlight quotes, and a live action-item checklist).
  **No book metadata lookup** — every field is user-entered, per the spec's constraint
  against reproducing copyrighted book content.
- `/grow/reading` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `ReadingView` (mocked hook); a reading emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `books`.

### Layer 11B — Learning — 2026-09-02

**Added**
- `src/features/learning/` — courses / study plans / book studies / certification tracks
  over `users/{uid}/learningItems`: `learningItemSchema` + create/update/form +
  `learningItemInputFromForm` (type, status, provider, target date, embedded ordered
  `lessons` checklist, `resources`, assessment notes, goal/pillar links, `skillId` reserved
  for Layer 11D); `emptyLesson` / `lessonProgress` (pure); separate `studySessionSchema`
  family (append-only time log, analogous to Deep Work sessions); `summarizeLearning` +
  `studyMinutesForItem` (pure — study time is derived, never duplicated onto the item);
  `learningItemRepository` + `listActiveLearningItems`, `studySessionRepository` +
  `listRecentStudySessions`; `useLearning` (`toggleLesson`, `logSession`,
  `removeSession`); UI (`LearningView` with item grid + a recent-sessions section,
  `LearningItemForm` with a `useFieldArray` lesson editor, `LearningItemDialog`,
  `LearningItemCard` with a live lesson checklist and linked resources, `LogSessionDialog`,
  `RecentSessionsList`).
- `/grow/learning` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `LearningView` (mocked hook); a learning emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `learningItems` + `studySessions`.

### Layer 11A — Journal — 2026-09-02 — opens the Grow domain

**Added**
- `src/features/journal/` — one entry shape over `users/{uid}/journalEntries` covering
  free-form / guided-reflection / daily-reflection / weekly-reflection / gratitude /
  lessons-learned / decision entries: `journalEntrySchema` + create/update/form +
  `journalEntryInputFromForm` (entry type drives a content placeholder + a gratitude-items
  field; mood/energy 1–5, goal/pillar links, tags, a display-only `isPrivate` flag);
  `filterJournalEntries` (pure client-side search + type filter); `summarizeJournal`
  (pure); `journalRepository` + `listRecentJournalEntries`; `useJournal`; UI (`JournalView`
  with a search box + type filter, `JournalEntryForm`, `JournalEntryDialog`,
  `JournalEntryCard` with a private-entry collapse/reveal toggle).
- `/grow/journal` renders the real feature (was a placeholder).
- Tests: schema, search, stats unit tests; `JournalView` (mocked hook); a journal emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `journalEntries`.

### Layer 10D — Execution Tracker — 2026-09-02 — closes the Act domain

**Added**
- `src/features/execution-tracker/` — a read-only aggregation view (no new collection,
  ADR-0016) comparing planned vs completed vs delayed vs cancelled work over `Today` /
  `This week`: `periodRange`, `classifyTasks` (on-time/later completion, cancelled,
  overdue/upcoming, estimated vs actual minutes, non-completion notes from
  `resolutionReason`), `summarizeHabitsForPeriod`, `summarizeRoutinesForPeriod`,
  `averageEnergyLevel` (all pure); `useExecutionTracker` (composes the existing
  `useTasks` / `useHabits` / `useRoutines` / `useDeepWork` hooks); `ExecutionTrackerView`
  (period selector + Tasks / Habits / Routines / Focus & energy sections). Copy is
  neutral and non-shaming per spec.
- `/act/execution` renders the real feature (was a placeholder).
- Tests: pure-function unit tests; `ExecutionTrackerView` (mocked hook). No new
  integration test — this layer introduces no collection (ADR-0016).

**Changed**
- `src/features/routines/use-routines.ts` now also returns the raw `logs` array.
- `docs/DATA_MODEL.md` retires the placeholder `executionLogs` line (see ADR-0016).

### Layer 10C — Daily Routine — 2026-09-02

**Added**
- `src/features/routines/` — ordered checklists over `users/{uid}/routines` +
  `users/{uid}/routineLogs`: `routineSchema` + create/update/form + `routineInputFromForm`
  (routine type, embedded ordered steps with a stable id / title / minutes / optional habit
  link, `isTemplate` flag); `routineLogSchema` family (one `completedStepIds[]` log per
  routine per day); `computeRoutineProgress` (pure); `summarizeRoutines` (pure);
  `routineRepository` + `listActiveRoutines`, `routineLogRepository` +
  `listRecentRoutineLogs`; `useRoutines` (`toggleStep` upserts today's log,
  `duplicateTemplate` clones a template with fresh step ids); UI (`RoutinesView` split
  into "Your routines" / "Templates" sections, `RoutineForm` with a `useFieldArray` step
  editor, `RoutineDialog`, `RoutineCard` with a progress bar and a live checklist).
- `src/features/habits/` — `listHabitOptions` / `HabitOption` + `useHabitOptions`, for the
  routine step editor's habit picker.
- `/act/routine` renders the real feature (was a placeholder).
- Tests: schema, progress, stats unit tests; `RoutinesView` (mocked hooks); a routines
  emulator integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `routines` + `routineLogs`.

### Layer 10B — Habits — 2026-09-02

**Added**
- `src/features/habits/` — a streak tracker over `users/{uid}/habits` +
  `users/{uid}/habitLogs`: `habitSchema` + create/update/form + `habitInputFromForm`
  (required pillars, goal link, daily/weekly/monthly schedule, target/unit, reminder time,
  active/paused status); `habitLogSchema` family (one completed/missed log per habit per
  day); `isExpectedOn` / `expectedDatesInRange` (pure schedule math); `computeHabitStreaks`
  / `recentDayStates` (pure — streaks are **computed from logs, never stored**, like the
  Deep Work session score in Layer 9B); `summarizeHabits` (pure); `habitRepository` +
  `listActiveHabits`, `habitLogRepository` + `listRecentHabitLogs`; `useHabits`
  (`setDayStatus` upserts the day's log); UI (`HabitsView` stats + grid, `HabitForm` with a
  frequency-conditional schedule editor, `HabitDialog`, `HabitCard` with a 7-day dot strip
  and Done-today/Missed quick-log buttons).
- `/act/habits` renders the real feature (was a placeholder).
- Tests: schedule, streak, stats, schema unit tests; `HabitsView` (mocked hooks); a habits
  emulator integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `habits` + `habitLogs`.

### Layer 10A — Tasks — 2026-09-02 — opens the Act domain

**Added**
- `src/features/tasks/` — the unit of daily execution over `users/{uid}/tasks`:
  `taskSchema` + create/update/form + `taskInputFromForm` (status, priority, start/due
  dates, pillars, goal/project/milestone/parent-task links, `{ frequency, interval }`
  recurrence marker, estimate/actual minutes, energy, context, tags, `completedAt`,
  resolution reason); `isClosed` / `daysOverdue` helpers; `summarizeTasks` +
  `subtaskProgressByParent` (pure); `taskRepository` + `listActiveTasks` (work-list sort)
  + `listTaskOptions`; `useTasks` (`setStatusFor` moves `completedAt` with status);
  UI (`TasksView` stats + sorted list, `TaskForm`, `TaskDialog`, `TaskCard` with a done
  checkbox, overdue badge, subtask count and link chips).
- `src/features/milestones/` — `listMilestoneOptions` / `MilestoneOption` +
  `useMilestoneOptions`, for the task form's milestone picker.
- `/act/tasks` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `TasksView` (mocked hooks); a tasks emulator
  integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `tasks`.

### Layer 9E — Priority Matrix — 2026-09-02 — closes the Focus domain

**Added**
- `src/features/priority-matrix/` — an Eisenhower matrix over
  `users/{uid}/priorityMatrixItems`: `matrixItemSchema` + create/update/form +
  `matrixItemInputFromForm` (title, one of four quadrants [do / schedule / delegate /
  eliminate], goal/project link, 0–3 life pillars, completed flag); `summarizeMatrix`
  (pure — total / completed / open-per-quadrant); `priorityMatrixRepository` +
  `listActiveMatrixItems`; `usePriorityMatrix` (memoized `byQuadrant` + `stats`, `move`
  and `toggleComplete` helpers); UI (`PriorityMatrixView` — 2×2 quadrant grid with
  per-quadrant add, open/completed counts; `MatrixItemForm`, `MatrixItemDialog`,
  `MatrixItemCard` with a move-to-quadrant dropdown + completion checkbox).
- `/focus/priority-matrix` renders the real feature (was a placeholder).
- Tests: schema, stats unit tests; `PriorityMatrixView` (mocked hooks); a priority-matrix
  emulator integration test (written; not executed in-session — Firestore emulator).

**Changed**
- `docs/DATA_MODEL.md` annotation for `priorityMatrixItems`.

### Layer 9D — Time Blocking — 2026-09-02

**Added**
- `src/features/time-blocking/` — allocate time to an activity over `users/{uid}/timeBlocks`:
  `timeBlockSchema` + create/update/form + `timeBlockInputFromForm` (title, category
  [deep-work / task / habit / goal / project / learning / spiritual / recovery / personal /
  admin / break / other], zoned `startDateTime` / `endDateTime`, goal/project link, 0–3 life
  pillars, status [planned / done / skipped], notes) reusing the Layer 9C `zoned-time` model;
  `detect-conflicts.ts` (`detectConflicts` — pure pairwise instant-overlap detection,
  timezone-correct, `skipped` excluded); `time-block-stats.ts` (`summarizeTimeBlocks` — pure);
  `timeBlockRepository` + `listActiveTimeBlocks`; `useTimeBlocking` (memoized conflicts +
  stats); UI (`TimeBlockView` with a day-grouped list + a conflict warning banner and
  per-card **Overlap** flags, `TimeBlockForm`, `TimeBlockDialog`, `TimeBlockCard`,
  `TimeBlockStats`).
- `/focus/time-blocking` renders the real feature (was a placeholder).
- Tests: schema, conflict-detection, stats unit tests; `TimeBlockView` (mocked hooks); a
  time-blocking emulator integration test (written; not executed in-session — the Firestore
  emulator does not start in this environment).

**Changed**
- `docs/DATA_MODEL.md` annotation for `timeBlocks`.
- `CLAUDE.md` §10.1 + §11.17 and `docs/DEPLOYMENT.md` §2a — mandatory end-of-session
  commit + push + deploy to `https://mastery-personal-mgmt-system.web.app/`.
- **Deploy pipeline wired (ADR-0015):** `next.config.ts` `output: "export"` +
  `images.unoptimized`; `/api/health` route `force-static`; `firebase.json` `hosting`
  block (`public: "out"`, `cleanUrls`); `.claude/` added to `.gitignore` / `.prettierignore`.
  ADR-0003 (App Hosting) marked superseded-for-now. **First live deploy** — static export
  → Firebase Hosting on the Spark plan.

### Layer 9C — Calendar — 2026-08-31

**Added**
- `src/features/calendar/` — an internal calendar over `users/{uid}/events`:
  `eventSchema` + create/update/form + `eventInputFromForm` (timed / all-day, recurrence,
  reminders, goal/project links, IANA `timeZone`); `zoned-time.ts` (`Intl`-based, DST-aware
  wall-clock ↔ instant helpers); `recurrence.ts` (`expandEvents` — daily/weekly/monthly/
  yearly with interval, weekdays, count/until; pure, bounded); `calendar-range.ts`
  (`monthMatrix`, `weekDates`, `periodLabel`, `occurrencesByDay`, `layoutDay` overlap
  columns); `calendarEventRepository` + `listActiveEvents`; `CalendarProvider` adapter
  interface + `internalCalendarProvider` + `getCalendarProvider` (seam for future
  Google/Outlook/CalDAV sync); `useCalendar`; UI (`CalendarView`, `MonthGrid`, `TimeGrid`,
  `EventForm`, `EventDialog`) with day / week / month views.
- `/focus/calendar` renders the real feature.
- Tests: zoned-time, recurrence, calendar-range, schema unit tests; `CalendarView` (mocked
  hook); calendar emulator integration test through the provider.

**Changed**
- `docs/DATA_MODEL.md` annotation for `events`.

### Layer 9B — Deep Work — 2026-08-31

**Added**
- `src/features/deep-work/` — a logbook of focused sessions: `deepWorkSessionSchema` +
  create/update/form + `deepWorkInputFromForm` (intended outcome, goal/project link,
  start/end time, distraction log, energy & focus-quality ratings, completion notes,
  status); `computeSessionScore` (pure, derived 0–100); `summarizeDeepWork` (pure stats);
  `deepWorkRepository` (collection `focusSessions`) + `listRecentDeepWork`; `useDeepWork`;
  UI (`DeepWorkView`, `DeepWorkForm`, `DeepWorkDialog`, `DeepWorkCard`, `DeepWorkStats`).
- `/focus/deep-work` renders the real feature.
- Tests: schema, score, stats unit tests, `DeepWorkView` (mocked hooks), and a deep-work
  emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `focusSessions`.

### Layer 9A — Pomodoro — 2026-08-31 — opens the Focus domain

**Added**
- `src/features/pomodoro/` — a persistent pomodoro timer: `pomodoro-store.ts` (external
  store for `useSyncExternalStore`, wall-clock countdown, `localStorage` mirror, cross-tab
  sync, `createPomodoroStore` factory); `pomodoroSessionSchema` + create/update +
  `pomodoroConfigSchema` + `pomodoroLiveStateSchema`; `pomodoroSessionRepository` +
  `listRecentSessions`; `summarizeSessions` (pure stats); `usePomodoro`,
  `usePomodoroHistory`; UI (`PomodoroView`, `PomodoroTimer` with a setup form,
  `PomodoroStats`, `PomodoroHistoryList`).
- `/focus/pomodoro` renders the real feature. Only a terminal session (completed / ended
  early) is written to Firestore — never a per-tick document.
- Tests: store state-machine unit tests, schema + stats unit tests, `PomodoroView`
  (mocked hooks), and a pomodoro emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `pomodoroSessions`.

### Layer 8H — Planning Cascade — 2026-08-31 — closes the Plan domain

**Added**
- `src/features/cascade/` — `buildCascade()` (pure, read-only) walks `plan.parentId`,
  `goal.parentPlanId`, `project.goalId`, `milestone.parentType/parentId`,
  `roadmap.linkedGoalId/linkedProjectId` into one tree with a "not yet linked" list and
  per-kind counts; `useCascade()` (loads all plan-domain `listActive*` in parallel) and the
  UI (`CascadeView`, recursive `CascadeNodeRow`).
- `/plan/cascade` route + **Planning Cascade** nav item.
- `PLAN_PARENT_HORIZON` map and `usePlanTierOptions()` in `src/features/plans/`.
- Tests: `buildCascade` unit tests, `CascadeView` (mocked hook), and a cascade emulator
  integration test.

**Changed**
- Plan form now has a **Parent {tier}** picker; `planFormSchema` gains `parentId` and
  `planInputFromForm` reads it (2-arg signature removed).
- `docs/DATA_MODEL.md` §4 linkage list.

### Layer 8G — Roadmaps — 2026-08-31

**Added**
- `src/features/roadmaps/` — `roadmapSchema` / `roadmapCreateSchema` /
  `roadmapUpdateSchema` / `roadmapFormSchema` + `roadmapInputFromForm` (roadmap kind,
  optional goal & project links, horizon, manual progress, an ordered list of embedded
  `phases` each with name / date range / status, pillars); `roadmapRepository`,
  `useRoadmaps()`, and the UI (`RoadmapsView`, `RoadmapForm` with a `useFieldArray` phases
  editor, `RoadmapDialog`, `RoadmapCard`).
- `/plan/roadmaps` renders the real feature.
- Tests: roadmap schemas + phase date ordering + `roadmapInputFromForm`, `RoadmapsView`
  (mocked hooks), and a roadmaps emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `roadmaps`.

### Layer 8F — Milestones — 2026-08-30

**Added**
- `src/features/milestones/` — `milestoneSchema` / `milestoneCreateSchema` /
  `milestoneUpdateSchema` / `milestoneFormSchema` + `milestoneInputFromForm` (polymorphic
  parent goal/project/none, due date, completion state, manual progress, free-text
  dependencies, evidence/notes, pillars); `milestoneRepository`, `useMilestones()`, and the
  UI (`MilestonesView`, `MilestoneForm`, `MilestoneDialog`, `MilestoneCard`).
- `listProjectOptions()` / `ProjectOption` + `useProjectOptions()` in
  `src/features/projects/` — active projects for the milestone's parent picker.
- `/plan/milestones` renders the real feature.
- Tests: milestone schemas + parent-consistency refine + `milestoneInputFromForm`,
  `MilestonesView` (mocked hooks), and a milestones emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `milestones`.

### Layer 8E — Projects — 2026-08-30

**Added**
- `src/features/projects/` — `projectSchema` / `projectCreateSchema` /
  `projectUpdateSchema` / `projectFormSchema` + `projectInputFromForm` (status, priority,
  owner, start/end dates, manual progress, free-text dependencies / risks lists, goal link,
  pillars); `projectRepository`, `useProjects()`, and the UI (`ProjectsView`, `ProjectForm`,
  `ProjectDialog`, `ProjectCard`).
- `listGoalOptions()` / `GoalOption` + `useGoalOptions()` in `src/features/goals/` — active
  goals for the project's goal picker.
- `/plan/projects` renders the real feature.
- Tests: project schemas + `projectInputFromForm`, `ProjectsView` (mocked hooks), and a
  projects emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `projects`.

### Layer 8D — Goals — 2026-08-29

**Added**
- `src/features/goals/` — `goalSchema` / `goalCreateSchema` / `goalUpdateSchema` /
  `goalFormSchema` + `goalInputFromForm` (priority, measurement type / current / target /
  unit, review frequency, parent-plan link, pillars); `goalRepository`, `useGoals()`, and
  the UI (`GoalsView`, `GoalForm`, `GoalDialog`, `GoalCard`).
- `listAllPlanOptions()` + `usePlanOptions()` in `src/features/plans/` — active plans
  across every tier for the goal's parent-plan picker.
- `/plan/goals` renders the real feature.
- Tests: goal schemas + `goalInputFromForm`, `GoalsView` (mocked hooks), and a goals
  emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotation for `goals`.

### Layer 8C — Quarterly / Monthly / Weekly Planning — 2026-08-29

**Added**
- `/plan/quarterly`, `/plan/monthly`, `/plan/weekly` render the shared `PlansView` — full
  plan CRUD for the three shorter tiers.

**Changed**
- `PLAN_REPOSITORIES` is now a complete `Record<PlanHorizon, PlanRepository>` (adds
  `quarter` / `month` / `week`).
- `tests/integration/plans.test.ts` covers all five tiers; `PlansView` test adds a
  `horizon="week"` case.

### Layer 8B — Five-Year & One-Year Plans — 2026-08-29

**Added**
- `src/features/plans/` — one shared plan model (`planSchema` / `planCreateSchema` /
  `planUpdateSchema` / `planFormSchema` + `planInputFromForm`), a `PlanRepository` per
  tier collection (`PLAN_REPOSITORIES` wired for `five-year` / `one-year`), `usePlans(horizon)`,
  and the UI (`PlansView`, `PlanForm`, `PlanDialog`, `PlanCard`).
- `src/components/ui/progress.tsx` — hand-rolled `Progress` bar (no new dependency).
- `isoDateSchema` (`YYYY-MM-DD`) in `src/lib/validation`.
- `/plan/five-year` and `/plan/one-year` render the real feature.
- Tests: plan schemas + `planInputFromForm`, `PlansView` (mocked hook), `Progress`, and a
  plans emulator integration test.

**Changed**
- `docs/DATA_MODEL.md` annotations; ADR-0014 (one plan shape across five tier collections;
  transform-free create schemas).

### Layer 8A — Life Vision — 2026-08-29

**Added**
- `src/features/vision/` — Life Vision as a typed, pillar-linked collection
  (`users/{uid}/lifeVisions`): `lifeVisionSchema` (10 categories + metadata),
  `lifeVisionRepository` via `createFirestoreRepository`, `useLifeVision()` hook, and the
  UI (`LifeVisionView`, `VisionItemForm`, `VisionItemDialog`, `VisionItemCard`).
- `src/components/shared/PillarSelect` + `PillarBadges` — reusable life-pillar picker and
  badges (for 8B–8G and Layer 12).
- `/plan/vision` now renders the real feature (was a placeholder).
- Tests: vision schema, `LifeVisionView` (mocked hook), `PillarSelect`, and a life-vision
  emulator integration test.

**Changed**
- `vitest.setup.ts` — jsdom polyfills (`ResizeObserver`, pointer capture, `scrollIntoView`)
  for Radix `Select` in component tests.
- `docs/DATA_MODEL.md`, `docs/SECURITY.md`; ADR-0013 (vision modeling + deferring
  per-collection rule validation to Layer 20).

### Layer 7 — Dashboard MVP — 2026-08-28

**Added**
- `src/features/dashboard/` — `loadDashboardAggregate()` (one batched user-scoped read;
  widgets never read Firestore themselves), `DashboardAggregate` type, greeting/date
  helpers, `useDashboard()` hook, and widgets: `GreetingWidget`, `StatTile`,
  `QuickNotesWidget`, `PlaceholderWidget`, `RecoveryShortcut`, `DashboardView`.
- **Quick Notes** — `users/{uid}/quickNotes` via `createFirestoreRepository`, with
  add / inline-edit / archive in the UI. First end-to-end use of the Layer 6 repository.
- `src/hooks/use-mounted.ts` — hydration-safe client-only flag.
- Tests: greeting/date helpers, quick-note schemas, `DashboardView` (mocked hook), and a
  dashboard aggregate emulator integration test.

**Changed**
- `src/app/(app)/dashboard/page.tsx` renders the real `<DashboardView />`.
- `docs/DATA_MODEL.md` adds `quickNotes`; ADR-0012 records the MVP scoping.

### Layer 6 — Core Data Model & Repository Layer — 2026-08-28

**Added**
- `src/lib/validation/domain.ts` — life-pillar / priority / record-status / measurement
  vocabularies (schemas + types).
- `src/lib/repository/` — `baseRecordSchema` + `defineRecordSchema`, pagination types
  (`ListOptions`, `Page`, `pageQuerySchema`, `clampLimit`), audit builders, and
  `createFirestoreRepository()` — a user-scoped Firestore repository factory with
  `list / get / create / update / archive / unarchive`, internal uid resolution,
  audit-field stamping, server-timestamp read-back, and cursor pagination.
- `src/types/index.ts` re-exports the shared domain + data-access types.
- Tests: domain primitives, base record, pagination, audit builders (unit) and a full
  repository lifecycle suite against the Auth + Firestore emulators.

**Changed**
- `firestore.rules` — generic audit-field enforcement on every `users/{uid}/{collection}/**`
  write (`createdBy`/`updatedBy` = caller on create; `createdBy`/`createdAt` immutable,
  `updatedBy` = caller on update); rules tests updated to match.
- `docs/DATA_MODEL.md`, `docs/SECURITY.md` (Layer 6 checkpoint), ADR-0011.
- `CLAUDE.md` §10 restored to commit-and-push per layer (`2b5b5ac`).

### Layer 5 — Application Shell & Navigation — 2026-08-28 (committed `257ce03`, pushed)

**Added**
- `src/config/navigation.ts` — the navigation tree that drives the sidebar, drawer, bottom
  nav, breadcrumbs, and command palette, plus `isNavItemActive` / `navLabelForHref`.
- Responsive shell (`src/components/layout/`): `AppShell` + `ShellProvider`/`useShell`,
  `Sidebar` (collapsible), `SidebarNav`, `Topbar`, `BottomNav`, `NavDrawer`,
  `CommandPalette` (cmdk), `SearchTrigger`, `BreadcrumbTrail` + `buildBreadcrumbs`,
  `ModulePlaceholder`, `SectionLanding`.
- `src/components/ui/sheet.tsx` — Radix-Dialog-based side sheet primitive.
- 37 placeholder module routes under `src/app/(app)/` (Plan / Focus / Act / Grow /
  Analytics section landings + items, Recovery Center, Notifications, Settings) plus
  `(app)/loading.tsx` and `(app)/error.tsx`.
- Tests: navigation config integrity, `buildBreadcrumbs`, `BottomNav`, `SidebarNav`.
- Dependency: `cmdk`.

**Changed**
- `src/app/(app)/layout.tsx` now renders `<AppShell>` in place of the Layer 4 stopgap header.

### Layer 4 — Authentication & User Isolation — 2026-08-28 (committed `cf8df1b`, pushed)

**Added**
- `src/features/auth/`: form + profile schemas, `authService` (email + Google + reset +
  persistence, normalized errors), `auth-errors` message mapping, `userProfileRepository`
  (`ensure` / `get` / `update`, `buildDefaultProfile` — `role` always `user`), and
  components `AuthCard`, `SignInForm`, `SignUpForm`, `ForgotPasswordForm`,
  `GoogleSignInButton`, `UserMenu`.
- `AuthProvider` + `useAuth` (`src/providers/auth-provider.tsx`); wired into `Providers`.
- Routes: `(auth)/{login,register,forgot-password}` with a redirect-if-signed-in layout;
  `(app)/dashboard` behind a client-side auth guard layout.
- Owner-only `firestore.rules` (field-validated `users/{uid}`, immutable `role`, no client
  delete, subcollection owner-only) and `storage.rules` (owner-only `users/{uid}/**`,
  image/PDF, < 10 MB).
- Tests: auth schema / error / profile unit tests, `SignInForm` component test, expanded
  Firestore + Storage rules tests, and an Auth+Firestore emulator integration suite
  (`npm run test:integration`, `vitest.integration.config.mts`).
- Dependencies: `react-hook-form`, `@hookform/resolvers`, `@testing-library/user-event`.

**Changed**
- `src/app/page.tsx` gains Sign in / Create account entry buttons.
- `vitest.setup.ts` registers Testing Library `cleanup()` (`globals: false`).
- ADR-0009 records the client-side route-protection choice.
- `CLAUDE.md` §10 (by the owner): no automatic commits/pushes — changes stay local until
  explicitly approved.

### Layer 3 — Firebase Foundation — 2026-08-28

**Added**
- Firebase project `mastery-personal-mgmt-system` (created via CLI, Web app registered —
  ADR-0008). Config in `.env.local`; keys documented in `.env.example`.
- `firebase.json` (Emulator Suite: auth/firestore/storage/functions/ui), `.firebaserc`,
  `firestore.rules` + `storage.rules` (deny-all baseline), `firestore.indexes.json`.
- `src/lib/firebase/`: `config`, `client` (browser SDK singleton + emulator connect),
  `admin` (`server-only` Admin SDK singleton), `timestamps` (`normalizeTimestamps`),
  `converters` (`makeConverter` — Zod-validated, timestamp-normalizing Firestore converter).
- `src/lib/errors/firebase-error.ts` — `mapFirebaseError` / `mapFunctionsError`.
- `functions/` package: `healthCheck` HTTP function, shared `errors` / `validation` /
  `auth` / `firebase-admin` helpers, region config, per-domain placeholder folders, tests.
- Security-rule test harness: `tests/rules/**`, `vitest.rules.config.mts`, and the
  `test:rules` / `emulators` / `functions:build` / `functions:test` npm scripts.
- Dependencies: `firebase`, `firebase-admin`, `server-only`, `@firebase/rules-unit-testing`,
  `firebase-tools`.

**Changed**
- `src/lib/env.ts` gains `NEXT_PUBLIC_FIREBASE_*` (optional) + `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`;
  empty-string env values are treated as unset.
- Root `tsconfig.json`, `eslint.config.mjs`, `.prettierignore` exclude `functions/`.
- ADR-0004 superseded by ADR-0008; `docs/DEPLOYMENT.md` environment↔project-id table filled in.

### Layer 2 — Mastery Design System — 2026-08-27

**Added**
- Design token layer in `globals.css` — semantic `--color-*` roles + `--font-*`, full
  light/dark palettes, Tailwind v4 `@theme inline` exposure, reduced-motion base reset.
- Theme system: `src/lib/theme.ts` (+ `themeStore`), pre-hydration no-flash `ThemeScript`,
  `ThemeProvider` / `useTheme` (`useSyncExternalStore`), and a `ThemeToggle`
  (light / dark / system, persisted to `localStorage`).
- Reusable component library under `src/components/ui/`: Button, IconButton, Spinner,
  Badge, Card, Skeleton, Separator, VisuallyHidden, Kbd, Avatar, Label, Input, Textarea,
  FormField, Checkbox, Switch, RadioGroup, Select, Tabs, Dialog, DropdownMenu, Tooltip,
  Alert, SegmentedControl.
- Layout helpers: `PageContainer`, `PageHeader`, `Breadcrumbs`.
- `/design-system` showcase route.
- Dependencies: `@radix-ui/react-*` primitives, `class-variance-authority`, `lucide-react`
  (ADR-0007).
- Tests for Button, FormField, Badge, and theme logic (suite now 9 files / 38 tests).

**Changed**
- `LoadingState` now renders the shared `Spinner`.
- Root layout injects the theme script and sets `suppressHydrationWarning`.

### Layer 1 — Project Foundation — 2026-08-27

**Added**
- Next.js 16 App Router application scaffold with TypeScript (strict), Tailwind CSS 4,
  ESLint 9 (flat config) + Prettier, and the `@/*` → `src/*` path alias.
- `src/lib/env.ts` — Zod-validated environment configuration (`parseEnv` + frozen `env`).
- `src/lib/errors/` — normalized `AppError`, `ErrorCode` union, `normalizeError`.
- `src/lib/validation/` — shared Zod primitives; `src/lib/utils/cn.ts`.
- Route-level `loading` / `error` / `global-error` / `not-found` and shared
  `LoadingState` / `EmptyState` / `ErrorState` components.
- `GET /api/health` liveness probe; passthrough `Providers` wrapper.
- Vitest 4 + Testing Library test setup; 23 tests across 5 files.
- `.env.example`, `AGENTS.md`, and the `src/` repository directory skeleton.
- npm scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `format`.

**Notes**
- Toolchain versions are significantly newer than earlier planning assumed (Next 16,
  Tailwind 4, ESLint 9 flat, Zod 4, Vitest 4). No Firebase yet — that is Layer 3.
- `next lint` and `next.config`'s `eslint` key were removed in Next 16; lint runs as
  `eslint .`.

### Layer 0 — Project Constitution — 2026-08-27

**Added**
- Engineering constitution (`CLAUDE.md`): repository, architecture, naming, security, and
  testing rules; layer-by-layer procedure; prohibited patterns; verification commands;
  single-branch git workflow; definition of done.
- Project documentation set under `docs/`: `MASTER_SPEC`, `PRODUCT_REQUIREMENTS`,
  `ARCHITECTURE`, `DESIGN_SYSTEM`, `DATA_MODEL`, `SECURITY`, `AI_ARCHITECTURE`,
  `RECOVERY_PRIVACY`, `TESTING_STRATEGY`, `DEPLOYMENT`, `BUILD_PROGRESS`, `DECISIONS`,
  `CHANGELOG`.
- `README.md` with project overview, stack, and documentation index.
- `.gitignore` for Node / Next.js / Firebase / secrets / test artifacts.
- Architecture decision records ADR-0001 … ADR-0006.

**Changed**
- Repository history reset to a fresh `main`; `origin` repointed to
  `Timmitchel1919-sys/Mastery-personal-management-system`.

**Notes**
- No application code, dependencies, or build tooling in this layer by design.
- Frontend hosting target set to Firebase App Hosting (ADR-0003); Firebase project not yet
  created (needed at Layer 3, ADR-0004).
