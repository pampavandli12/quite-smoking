# Phase 4: SQLite Safety and Query Performance

Status: Complete  
Depends on: Phase 3 complete  
Starting branch/commit: `code-refactor` / `7a3ba6e`

## Goal

Improve startup and large-history query performance while protecting every
existing on-device database. This phase must use its own pull request.

## Behavior Lock

- [x] Preserve `quitSmoking.db`, all tables, columns, defaults, and row meaning.
- [x] Preserve integer, real, legacy text, invalid, and pre-2000 handling.
- [x] Preserve local-time buckets, ordering, errors, and exported return shapes.
- [x] Use isolated in-memory fixture copies for migration verification.

## Implementation Checklist

### P4.1 Fixture and query baseline

- [x] Build fresh, populated, legacy-text, mixed, invalid, and 10,000-row fixtures.
- [x] Characterize normalization, idempotence, index, and grouping results.
- [x] Capture `EXPLAIN QUERY PLAN` for the hot range predicate.
- [x] Verify migration behavior with foreign keys both enabled and disabled.

### P4.2 Migration discipline

- [x] Introduce `PRAGMA user_version = 1`.
- [x] Make timestamp normalization atomic and idempotent.
- [x] Run legacy conversion only when required, not every startup.
- [x] Verify forced failure rolls back data and the version marker.
- [x] Keep the legacy-compatible query expression and index.

### P4.3 Atomic writes

- [x] Wrap log-plus-trigger insertion in one transaction.
- [x] Wrap trigger-plus-log deletion in one transaction.
- [x] Preserve success/error result shapes and timestamp generation.
- [x] Exercise migration rollback and atomic device logging.

### P4.4 Query improvements

- [x] Confirm the normalized timestamp expression index is used.
- [x] Retain compatible predicates and prove index use with mixed fixtures.
- [x] Replace quadratic trigger grouping with a typed `Map`.
- [x] Split migration and grouping internals while preserving `@/db` exports.
- [x] Preserve all existing query APIs.

### P4.5 Verification

- [x] Run all automated gates and database fixture tests.
- [x] Run versioned migration against existing Android app data.
- [x] Verify restart, logging, trigger persistence, integrity, and stats.
- [x] Record query-plan and device evidence.

## Evidence

- Fixtures: fresh, ISO text, invalid text, integer, mixed, failure, and 10k rows.
- Query plan: `idx_smoking_log_timestamp_normalized` selected for range reads.
- Android: `user_version=1`, `integrity_check=ok`; existing count retained and a
  log with `coffee` trigger committed atomically.
- Rollback: revert code and retain the backward-compatible schema; never delete
  or recreate user databases during rollback.

## Completion Criteria

All fixtures retain identical results, writes are atomic, startup avoids repeated
legacy work, and measured hot queries improve without data loss.
