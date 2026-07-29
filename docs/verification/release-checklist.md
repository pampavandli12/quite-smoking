# Android Release Verification

Use this checklist for a release candidate built from a clean checkout.

## Automated gates

- [ ] `npm ci`
- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build:check`
- [ ] `npx expo-doctor`
- [ ] `npx expo install --check`
- [ ] `npm audit --omit=dev` is reviewed and recorded.
- [ ] EAS `closedTest` build completes with `PAYWALL_BYPASS=false`.
- [ ] The build uses the `goog_` RevenueCat public Android SDK key.

## Native artifact

- [ ] `android/` is not tracked; `app.config.js` is the CNG source of truth.
- [ ] The AAB contains the leaf launcher, adaptive foreground, monochrome icon,
      and light/dark splash assets.
- [ ] The merged release manifest targets API 36.
- [ ] The merged manifest has `android:allowBackup="false"`.
- [ ] The merged manifest does not request `READ_EXTERNAL_STORAGE`,
      `WRITE_EXTERNAL_STORAGE`, or `SYSTEM_ALERT_WINDOW`.
- [ ] The merged manifest has no generated `exp+quit-smoking` intent scheme.
- [ ] The merged manifest does not export
      `androidx.compose.ui.tooling.PreviewActivity`.
- [ ] The final AAB certificate is the EAS upload key accepted by Play App
      Signing; never upload a locally debug-signed artifact.

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
- [ ] Subscription cancellation is reachable from Settings.
- [ ] Log with a trigger and without a trigger.
- [ ] Rescue logging, history edits, and plan changes refresh Home on focus.
- [ ] Plan targets advance across simulated week boundaries.
- [ ] Savings are correct at the start, middle, and end of week/month/year.
- [ ] Verify notifications, PDF export, process restart, external links, dark
      mode, symbol rendering, and tab animations.

## Play Console

- [ ] Privacy policy and store listing include: “Provides general behavioral
      tracking and support; not medical advice, diagnosis, or treatment.”
- [ ] Health Apps declares Mental and Behavioral Health / addiction recovery.
- [ ] Data Safety matches `google-play-app-content.md`.
- [ ] Ads is No; target audience is adults 18+.
- [ ] Content rating accurately discloses tobacco references.
- [ ] App access contains working premium review instructions and a
      promo/reviewer mechanism; no universal bypass is shipped.
- [ ] Financial features and all other App Content declarations are completed.
- [ ] If the personal developer account was created after November 13, 2023,
      at least 12 opted-in testers complete 14 continuous days before applying
      for production access.

## Rollout

- [ ] Start at 10% and monitor for 48 hours.
- [ ] Increase to 50% and monitor for 48 hours.
- [ ] Increase to 100% only when Android Vitals, RevenueCat, and feedback remain
      clean.
- [ ] Monitor startup, purchase, and crash signals.
- [ ] Halt rollout on database, entitlement, or navigation regressions.
- [ ] Roll back to the previous artifact; never clear user databases.
