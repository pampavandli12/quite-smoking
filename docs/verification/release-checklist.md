# Android Release Verification

Use this checklist for a release candidate built from a clean checkout.

## Automated gates

- [ ] `npm ci`
- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build:check`
- [ ] EAS production build completes with `PAYWALL_BYPASS=false`.

## Upgrade and data

- [ ] Install the current Play Store version and create representative logs.
- [ ] Upgrade in place to the release candidate without clearing app data.
- [ ] Confirm startup, settings, logs, triggers, streak, and all stats periods.
- [ ] Restart the app and confirm data remains unchanged.
- [ ] Confirm the database recovery screen is not shown.

## User flows

- [ ] New-user setup validates and saves the existing inputs.
- [ ] Active subscribers route to Home.
- [ ] Inactive users see the existing paywall.
- [ ] Purchase cancellation, failure, success, and restore show existing alerts.
- [ ] Log with a trigger and without a trigger.
- [ ] Verify Home, Stats, Settings, external links, theme, and tab animations.

## Rollout

- [ ] Start with a staged Play rollout.
- [ ] Monitor startup, purchase, and crash signals.
- [ ] Halt rollout on database, entitlement, or navigation regressions.
- [ ] Roll back to the previous artifact; never clear user databases.
