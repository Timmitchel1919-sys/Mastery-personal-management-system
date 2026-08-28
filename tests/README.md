# tests/

Cross-cutting test suites that do not colocate with a single source file.

| Directory | Contents | Introduced by |
|---|---|---|
| `tests/unit/` | standalone unit specs (most unit tests colocate as `*.test.ts` next to the source) | Layer 1 |
| `tests/rules/` | Firestore & Storage security-rule tests against the emulator | Layer 4 |
| `tests/e2e/` | Playwright end-to-end critical-journey specs | later layer |

Colocated `*.test.ts(x)` files under `src/` are the default; use this folder only when a
test spans modules or needs the emulator / a browser.
