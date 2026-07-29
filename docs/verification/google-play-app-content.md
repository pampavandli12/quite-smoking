# Google Play App Content Declaration

Use this as the release-owner worksheet. Verify every answer against the final
Play-distributed AAB and the current RevenueCat dashboard before submission.

## Store listing and health declaration

- Intended audience: adults 18+.
- Health Apps category: Mental and Behavioral Health / addiction recovery.
- Ads: No.
- The app tracks tobacco use but does not sell, advertise, or encourage tobacco.
- Put this disclaimer in the store listing and keep it visible in the app:
  “Provides general behavioral tracking and support; not medical advice,
  diagnosis, or treatment.”
- Avoid treatment, diagnostic, guaranteed-cessation, or unsupported
  physiological claims.

## Data Safety

Declare data collection as **Yes** because Google Play and RevenueCat process
subscription purchase history.

| Data | Handling | Purpose |
| --- | --- | --- |
| Financial information → Purchase history | Collected, required for subscriptions, non-ephemeral, encrypted in transit | App functionality and analytics |
| Smoking, craving, plan, motivation, and report data | Stored locally; not automatically collected off-device | Do not declare as collected while this remains true |
| Device or advertising identifiers | Declare only if a RevenueCat attribution integration or another SDK collects them | Match the enabled integration |

Do not mark purchase history as shared if RevenueCat is acting only as a service
provider and no sharing integrations are enabled. Reassess this answer whenever
analytics, attribution, ads, accounts, cloud sync, Health Connect, or a remote
health-data service is introduced.

## Privacy-policy requirements

The published privacy policy must state clearly:

- Smoking history, cravings, plans, motivations, and generated reports remain
  on the device.
- Android backup is disabled for the app's local behavioral data.
- Google Play and RevenueCat process subscription purchase history.
- User-initiated exports can be sent to applications the user chooses.
- The app does not collect “app usage information” unless another enabled SDK
  actually does so.
- The app creates no account, so account deletion is not applicable.
- Purchase-data requests can be sent through the in-app support path; include
  the anonymous RevenueCat app user ID shown by the app.

## App access

Premium review access must be configured in Play Console with current,
step-by-step instructions and a working promo/reviewer-access mechanism. Test it
on the exact closed-test artifact. Do not add a universal production bypass.

## Release-owner confirmations

- [ ] RevenueCat has no undeclared attribution or data-sharing integration.
- [ ] The privacy-policy URL serves the revised policy publicly.
- [ ] Product, base plan, offer, price, grace period, and entitlement mapping are
      active and correct.
- [ ] The review-access mechanism activates `QuitSmoke Pro`.
- [ ] Content-rating and tobacco-reference answers match the listing and app.
