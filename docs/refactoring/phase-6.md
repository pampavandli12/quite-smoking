# Phase 6: Type and API Contracts

Status: Complete  
Depends on: Phase 5 complete  
Starting branch/commit: `code-refactor` / `7a3ba6e`

## Goal

Make internal contracts explicit and remove unsafe types without changing
runtime values, public exports, error handling, or persisted data.

## Behavior Lock

- [x] Inventory changed DB, purchase, and component boundaries.
- [x] Preserve result shapes, optional fields, and error fallbacks.
- [x] Preserve RevenueCat cancellation detection and mock-mode behavior.
- [x] Preserve timestamp compatibility and settings storage units.

## Implementation Checklist

### P6.1 Database types

- [x] Add explicit mutation and row result types.
- [x] Type grouped trigger rows; remove reducer `any`.
- [x] Preserve millisecond writes while accepting legacy timestamp values.
- [x] Preserve existing inconsistent public unions for compatibility.

### P6.2 Purchase types

- [x] Replace purchase `any` errors with `unknown` and narrow type guards.
- [x] Add one explicit purchase/restore operation result.
- [x] Keep entitlement ID, SDK calls, mock returns, and caller behavior stable.
- [x] Test entitlement, offering, purchase success/cancel/failure, restore
      success/failure, and unknown error narrowing.

### P6.3 Application contracts

- [x] Keep stable route/config values unchanged rather than moving them.
- [x] Type extracted component props and callback results precisely.
- [x] Leave package-version metadata behavior unchanged.
- [x] Add no production casts merely to silence TypeScript.

### P6.4 Verification

- [x] Run all automated gates.
- [x] Search production code for `any`, broad casts, and non-null assertions.
- [x] Re-run database fixture and RevenueCat error-contract tests.
- [x] Smoke-test startup, logging, stats, and settings; real restore remains a
      store-distributed release gate.

## Evidence

- Contract inventory: DB mutation results, grouped logs, timeline snapshots,
  presentational props, and purchase operation/error boundaries.
- Remaining intentional unsafe types: none in production code; `db/example.tsx`
  remains an unused example outside the application path.
- Rollback: revert internal typing commits; no persisted/public shape is renamed.

## Completion Criteria

Sensitive boundaries are explicitly typed, unsafe errors and rows are narrowed,
and runtime/API compatibility is verified.
