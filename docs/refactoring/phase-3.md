# Phase 3: Stats Data Orchestration

Status: Complete  
Depends on: Phase 2 Android smoke test  
Starting branch/commit: `code-refactor` / `7a3ba6e`

## Goal

Reduce overlapping stats reads and clarify data ownership without caching,
changing refresh timing, or changing any displayed value.

## Behavior Lock

- [x] Record current Week/Month/Year behavior from populated Android data and
      empty calculation fixtures.
- [x] Preserve local-time date boundaries, labels, rounding, and fallback values.
- [x] Preserve initial focus, period switch, and tab-refocus refresh behavior.
- [x] Preserve every exported function from `@/db`.

## Implementation Checklist

### P3.1 Characterize orchestration

- [x] List reads issued by the screen and chart.
- [x] Add tests for period ranges, bucket totals, and timeline result shapes.
- [x] Record development load timings and query counts from Phase 2.

### P3.2 Define internal snapshots

- [x] Add typed weekly detail and timeline snapshot result types.
- [x] Move period range construction to shared statistics helpers.
- [x] Centralize labels and period metadata without changing text.
- [x] Keep existing database query exports as compatibility wrappers.

### P3.3 Consolidate reads

- [x] Preserve independent weekly total, chart-bucket, and detail fallbacks.
- [x] Let the stats screen coordinate data; keep chart rendering presentational.
- [x] Preserve request sequencing, settings refresh, and focus invalidation.
- [x] Confirm no new global cache or state manager is introduced.

### P3.4 Verification

- [x] Run tests, typecheck, lint, and `git diff --check`.
- [x] Compare before/after query ownership and counts.
- [x] Smoke-test all periods, populated data, logging, and tab refocus.
- [x] Cover empty snapshots with unit tests.

## Evidence

- Before: two owners plus duplicate initial effects could issue up to 17 reads on
  the initial Week render.
- After: one screen owner issues 8 independent Week reads per focus, plus the
  original mount-only settings read. Chart and detail failures remain isolated.
- Tests/manual device: timeline snapshot tests and Android period/refocus smoke
  passed without React Native errors.
- Rollback: revert the Phase 3 orchestration PR; public DB APIs stay compatible.

## Completion Criteria

One owner coordinates stats loading, overlapping reads are measurably reduced,
and all displayed results and refresh triggers match the baseline.
