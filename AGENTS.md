# Agent guide

This repository is built in numbered layers (see `docs/MASTER_SPEC.md` §6). Before making
any change:

1. Read **`CLAUDE.md`** — the engineering constitution: rules, naming conventions, security
   and testing requirements, prohibited patterns, and the definition of done.
2. Read the relevant files in **`docs/`**, especially **`docs/BUILD_PROGRESS.md`** for the
   current layer and known limitations.
3. Implement **only the current layer or sublayer**. Do not pull work forward.
4. Finish with: verification commands green, `docs/BUILD_PROGRESS.md` + `docs/CHANGELOG.md`
   updated, changed files listed, manual test steps written, limitations stated.

## Commands

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # eslint (zero errors)
npm test            # vitest run
npm run build       # production build
npm run format      # prettier --write .
```

## Git

Single `main` branch. Conventional Commits (`feat(scope): …`, `docs: …`, `test: …`).
Commit and push once per completed layer.
