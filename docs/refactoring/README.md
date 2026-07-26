# Production Refactoring Roadmap

This directory tracks behavior-preserving improvements for the production Expo
application. Complete phases in order. Use a separate pull request for each
phase and do not combine refactoring with features, redesigns, dependency
upgrades, or copy changes.

## Progress

| Phase | Scope | Status | Risk |
| --- | --- | --- | --- |
| [2](./phase-2.md) | Stats loading performance | Complete | Medium |
| [3](./phase-3.md) | Stats data orchestration | Complete | Medium |
| [4](./phase-4.md) | SQLite safety and query performance | Complete | High |
| [5](./phase-5.md) | Large component decomposition | Complete | Medium |
| [6](./phase-6.md) | Type and API contracts | Complete | Medium |
| [7](./phase-7.md) | Render and layout performance | Complete | Medium |
| [8](./phase-8.md) | Production hygiene and CI | Implementation complete; release gates open | Low–medium |

## Resume Protocol

1. Read `AGENTS.md`, this roadmap, and the current phase document.
2. Check `git status`; preserve unrelated and uncommitted work.
3. Record the starting branch/commit in the current phase.
4. Run `npm test`, `npm run typecheck`, and `npm run lint`.
5. Complete one unchecked subsection at a time.
6. Update checkboxes and verification evidence in the same change.
7. Stop if existing behavior is unclear or production data compatibility cannot
   be proven.

## Global Behavior Lock

- Preserve route names, navigation order, tab behavior, and deep links.
- Preserve SQLite filename, schema, stored values, timestamps, and offline data.
- Preserve RevenueCat keys, entitlement, offering, purchase, restore, and gating.
- Preserve environment variables, build profiles, UI copy, calculations,
  loading states, alerts, animations, and accessibility behavior.
- Keep each diff small and independently reversible.

## Required Gates

Every phase requires tests, typecheck, lint, `git diff --check`, targeted Android
smoke testing, and a documented rollback approach. Database and purchase work
also require production-like fixtures and explicit contract review.

## Open Release Gates

Implementation is complete locally. A store-distributed RevenueCat test, an
in-place upgrade from the current Play Store build, signed EAS production build,
and staged rollout remain release activities requiring credentials and the
published artifact. Track them in `docs/verification/`; they are deliberately
not represented as locally verified.
