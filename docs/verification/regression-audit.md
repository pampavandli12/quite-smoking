# Refactoring Regression Audit

Audit baseline: `HEAD` at `7a3ba6e`  
Scope: every tracked and untracked refactoring change on `code-refactor`

## Behavior Contracts Reviewed

- Expo Router stack, tabs, redirects, setup gate, and paywall bypass.
- RevenueCat Android key, entitlement, offering, purchase, cancellation, restore,
  active-subscription, and error-result contracts.
- SQLite filename, tables, columns, defaults, timestamp compatibility, query
  exports, migrations, transactions, settings units, and trigger grouping.
- Home totals, setup validation, all Stats periods, savings, comparisons,
  insights, labels, chart configuration, and empty/error fallbacks.
- Paywall and Stats copy, order, styles, keys, theme behavior, and interactions.

## Audit Corrections

The audit found and corrected three parity risks:

1. Restored `REVENUE_CAT_KEYS.android`; the Test Store key cannot ship in a
   production or closed-test build.
2. Restored mount-only smoking-settings loading on Stats.
3. Restored independent weekly-total, chart, detail, and insight error
   boundaries. A failure in one area no longer prevents successful updates in
   another.

## Verification Evidence

- Clean dependency install and Android export.
- Jest: 45 tests across calculations, setup parsing, timeline snapshots,
  RevenueCat contracts, migrations, large/mixed histories, rollback, indexes,
  foreign-key modes, and trigger grouping.
- TypeScript, Expo ESLint, and `git diff --check`.
- Android `emulator-5554`: startup, Home, Week/Month/Year, rapid switching, tab
  refocus, Settings, light/dark themes, and retained data.
- Device database: `user_version=1`, `integrity_check=ok`, 25 logs, 24 triggers,
  zero orphan triggers, and retained baseline `7 / 2000`.
- No React Native or fatal errors during tab, stats, settings, and theme checks.

## External Release Gates

Real Google Play purchase/restore, a signed production build, and an in-place
upgrade from the current Play Store artifact still require store credentials.
They remain mandatory before rollout; see `release-checklist.md`.
