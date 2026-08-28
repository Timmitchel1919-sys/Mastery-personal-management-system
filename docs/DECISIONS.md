# Mastery — Architecture Decision Records

Chronological log of decisions that deviate from the Final Master Prompt or that lock in a
choice future layers depend on. Newest at the bottom. Format: context → decision →
consequences.

---

## ADR-0001 — Fresh restart with no history backup
**Date:** 2026-08-27 · **Status:** accepted

**Context.** A prior build attempt reached Layers 0–8A on branch
`feature/layer-04-authentication`, but the working tree had been wiped and the history was
tangled. The owner wants a clean rebuild.

**Decision.** Delete the existing git history entirely (`rm -rf .git && git init`), keep no
backup branch, and rebuild from Layer 0. Non-code assets on disk (spec PDF, logo images)
are retained.

**Consequences.** All previous commits are unrecoverable. Every layer is re-implemented
against the current documentation. No migration concerns from the old code.

---

## ADR-0002 — Single `main` branch, push each layer directly
**Date:** 2026-08-27 · **Status:** accepted · **Deviates from:** Final Master Prompt §31 (Git Strategy)

**Context.** The prompt prescribes `main` + `develop` + `feature/layer-*` branches. This is
a solo, sequential, layer-by-layer build.

**Decision.** Use a single `main` branch. Each completed layer is committed with a
Conventional Commit message and pushed straight to `origin/main`. No `develop`, no feature
branches, unless the owner asks for one.

**Consequences.** Simpler flow, linear history, one commit (or a tight series) per layer.
CI runs on `main`. Loss of PR-based review gates is accepted for this project.

---

## ADR-0003 — Firebase App Hosting for the frontend (not Vercel)
**Date:** 2026-08-27 · **Status:** accepted · **Deviates from:** Final Master Prompt §3 and §27

**Context.** The prompt names Vercel for the Next.js frontend. The owner wants everything
hosted and deployed on Firebase.

**Decision.** Deploy the Next.js App Router frontend via **Firebase App Hosting**. All
backend services (Auth, Firestore, Storage, Functions, Messaging, App Check) are in the
same Firebase project per environment. GitHub remains source control.

**Consequences.** One provider to operate and bill. CI/CD (Layer 22) targets Firebase App
Hosting instead of Vercel. Any Vercel-specific references in the prompt are treated as
"the hosting platform" and mapped to App Hosting.

---

## ADR-0004 — Firebase project id slug `master-personal-manger`
**Date:** 2026-08-27 · **Status:** pending owner action

**Context.** The owner wants the project id to be "Master personal manger". Firebase
project ids must be lowercase, 6–30 chars, `a-z 0-9 -`, starting with a letter — spaces and
capitals are invalid.

**Decision.** The production project id will be the slug **`master-personal-manger`**
(preserving the owner's spelling). The owner creates the Firebase project(s) in the console
and confirms the exact id(s) — and per-environment ids — before Layer 3 begins. `DEPLOYMENT.md`
holds the environment↔id table.

**Consequences.** Layers 0–2 need no Firebase project. Layer 3 is blocked until the
project exists and the id is confirmed here.

---

## ADR-0005 — Launch languages English + Dutch; Spanish architected-for
**Date:** 2026-08-27 · **Status:** accepted · **Source:** Final Master Prompt §21

**Decision.** Ship English and Dutch locale content at launch. Build the i18n architecture
(next-intl, locale files, no hardcoded strings, locale-aware formatting) so Spanish can be
added later without structural change; no Spanish content required in the first release.

---

## ADR-0006 — 24-layer / 46-step build plan
**Date:** 2026-08-27 · **Status:** accepted · **Source:** Final Master Prompt §29

**Decision.** Adopt the prompt's build order verbatim: Layers 0–23, with Layer 8 (8A–8H),
Layer 9 (9A–9E), Layer 10 (10A–10D), Layer 11 (11A–11D), and Layer 15 (15A–15F) built as
sublayers — 46 discrete build steps in total. One layer/sublayer per work session; do not
start the next before the current one meets the definition of done.

---

## ADR-0007 — Radix UI primitives + CVA + lucide-react for the design system
**Date:** 2026-08-27 · **Status:** accepted · **Layer:** 2

**Context.** `docs/DESIGN_SYSTEM.md` requires accessible overlay/menu/listbox components
(Dialog, DropdownMenu, Tooltip, Select, Tabs, RadioGroup, Checkbox, Switch) with full
keyboard support, focus trapping, and correct WAI-ARIA semantics. `CLAUDE.md` §3 mandates
keyboard navigation and accessible focus/labels. Hand-rolling compliant versions of these
patterns is high-risk and high-maintenance. The Final Master Prompt's stack list does not
name a headless component library but does list Lucide, clsx, and tailwind-merge.

**Decision.** Add unstyled primitive dependencies:
- **`@radix-ui/react-*`** (avatar, checkbox, dialog, dropdown-menu, label, radio-group,
  select, separator, slot, switch, tabs, toggle-group, tooltip) — accessible behavior only;
  all styling is ours via Tailwind tokens.
- **`class-variance-authority`** — typed component style variants.
- **`lucide-react`** — icon set (already named in the prompt's stack).

Components live in `src/components/ui/` as thin styled wrappers; the rest of the app imports
from `@/components/ui`, never from Radix directly.

**Consequences.** ~13 small runtime deps added. Radix is React 19 compatible. If Radix is
ever replaced, the blast radius is limited to `src/components/ui/`. Deferred primitives
(Accordion, Popover, Toast, Combobox, Slider, DatePicker, Table/DataTable, Pagination,
CommandPalette) are added by the layers that first need them, following the same pattern.
