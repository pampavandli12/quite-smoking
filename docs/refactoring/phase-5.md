# Phase 5: Component Decomposition

Status: Complete  
Depends on: Phase 4 complete  
Starting branch/commit: `code-refactor` / `7a3ba6e`

## Goal

Split large screens into typed, local presentational components while leaving
data flow, navigation, side effects, copy, layout, and interaction unchanged.

## Behavior Lock

- [x] Capture Stats and Settings in light/dark mode and all stats periods.
- [x] Preserve existing labels, button states, alerts, and modal behavior.
- [x] Preserve screen/controller ownership of navigation, DB, and purchases.
- [x] Preserve public component props and route contracts.

## Implementation Checklist

### P5.1 Paywall

- [x] Extract static feature and benefit rows into `PaywallDetails`.
- [x] Keep settings check, entitlement check, purchase, and restore in the screen.
- [x] Preserve offering selection, price text, alerts, and button timing.

### P5.2 Statistics

- [x] Keep chart summaries together and extract trigger/daily list sections.
- [x] Use explicit typed props and stable trigger/date keys.
- [x] Preserve chart dimensions, period selector, colors, and calculations.

### P5.3 Setup and home

- [x] Extract only repeated or clearly bounded presentational sections.
- [x] Remove proven-unused styles without changing rendered values.
- [x] Avoid abstractions used by only one trivial element.

### P5.4 Verification

- [x] Run all automated gates after each screen.
- [x] Compare light/dark screen output and all chart periods.
- [x] Keep purchase side effects untouched; store scenarios remain a release gate.
- [x] Verify trigger selection and persistence on Android.

## Evidence

- Screenshot comparison: no layout, copy, theme, or chart regression observed.
- Purchase checks: error/cancellation contracts are unit tested in Phase 6; real
  billing and restore are tracked in `docs/verification/purchase-smoke-test.md`.
- Rollback: revert each screen extraction independently.

## Completion Criteria

Large files have clear controller/presentation boundaries, props are typed, and
visual, navigation, purchase, database, and interaction behavior is unchanged.
