# Mastery — Testing Strategy

Every layer ships with the tests for the logic it introduces, and those tests stay green
for the rest of the build. The complete program is consolidated in **Layer 21**.

---

## 1. Test types

| Type | Scope | Tooling (finalized in Layer 1 / Layer 3) |
|---|---|---|
| Unit | pure functions, utils, reducers, formatters | Vitest |
| Schema | Zod schemas: valid/invalid/edge inputs | Vitest |
| Component | rendering, states, interaction, a11y roles | Vitest + Testing Library |
| Repository | user-scoping, pagination, audit fields, converters | Vitest + Firebase Emulator |
| Firestore rules | owner-only, role-immutability, cross-user denial | `@firebase/rules-unit-testing` + emulator |
| Storage rules | path scoping, type/size validation | rules-unit-testing + emulator |
| Cloud Function | auth checks, input/output validation, authorization scope | Vitest + Functions emulator |
| Integration | feature flows across service + repository + rules | emulator suite |
| End-to-end | critical user journeys in a real browser | Playwright |
| Accessibility | automated a11y assertions on key screens | axe + Testing Library / Playwright |
| Responsive | mobile / tablet / desktop layout behavior | Playwright viewports |

## 2. Commands

```
npm run typecheck
npm run lint
npm test               # unit + schema + component + repository (emulator-backed where needed)
npm run test:rules     # Firestore + Storage rules
npm run test:e2e       # Playwright
npm run build
```

CI runs all of them (see `DEPLOYMENT.md`).

## 3. Per-layer gate (definition of done, testing portion)

A layer is done only when: typecheck passes, lint passes, all relevant tests pass, the
production build passes, rules are tested where relevant, mobile behavior is verified, and
accessibility is checked. No layer is declared complete with a failing check.

## 4. Critical journeys

Each becomes an e2e (or integration) test owned by the layer that introduces the feature
and must remain green thereafter.

| # | Journey | Introduced by |
|---|---|---|
| 1 | Registration | Layer 4 |
| 2 | Login | Layer 4 |
| 3 | Google authentication | Layer 4 |
| 4 | Password recovery | Layer 4 |
| 5 | Profile creation | Layer 4 |
| 6 | Protected route access | Layer 4 |
| 7 | User isolation | Layer 4 |
| 8 | Goal creation | Layer 8D |
| 9 | Goal-to-project linkage | Layer 8E |
| 10 | Task creation and completion | Layer 10A |
| 11 | Habit logging | Layer 10B |
| 12 | Calendar event creation | Layer 9C |
| 13 | Pomodoro persistence | Layer 9A |
| 14 | KPI entry | Layer 12 |
| 15 | Dashboard aggregation | Layer 7 |
| 16 | Language persistence | Layer 18 |
| 17 | Theme persistence | Layer 18 |
| 18 | AI Coach authentication | Layer 13 |
| 19 | Weekly summary generation | Layer 14 |
| 20 | Recovery privacy gate | Layer 15A |
| 21 | Recovery record isolation | Layer 15B |
| 22 | Accountability permission enforcement | Layer 15F |
| 23 | Report generation | Layer 16 |
| 24 | PWA installation path | Layer 19 |

## 5. Conventions

- Test files colocated as `*.test.ts(x)`; rules tests in `tests/rules/`; e2e in `tests/e2e/`.
- Deterministic tests: fixed clock, seeded ids, emulator reset between suites.
- No network calls to real Firebase or real AI providers in tests — emulator + provider
  fakes only.
- Development fixtures are used only in a controlled development environment, never in
  test/staging/production data paths.
