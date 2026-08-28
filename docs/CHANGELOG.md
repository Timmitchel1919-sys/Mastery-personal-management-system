# Changelog

All notable changes to Mastery are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project builds in numbered
layers; each entry maps to a layer.

## [Unreleased]

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
