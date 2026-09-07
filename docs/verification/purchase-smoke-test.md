# RevenueCat Smoke Test

Test through a Play-distributed closed-test build when validating real billing.
Keep entitlement `QuitSmoke Pro` and `PAYWALL_BYPASS=false`.

- [ ] A production-like build with a missing, placeholder, or `test_` key keeps
      the free app usable and makes purchase actions explicitly unavailable.
- [ ] A closed-test build uses an `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
      beginning with `goog_`.
- [ ] Real-paywall build routes users without settings to setup.
- [ ] Inactive configured user sees the current offering and price.
- [ ] Store-displayed localized price and renewal period match the configured
      Google Play product and base plan.
- [ ] Cancellation leaves the user on the paywall without a failure alert.
- [ ] Purchase failure shows the existing generic failure alert.
- [ ] Purchase success is accepted only when `QuitSmoke Pro` is active, then
      shows the success alert and continues to Home.
- [ ] Restore with entitlement succeeds and continues to Home.
- [ ] Restore without entitlement shows “No Purchases Found”.
- [ ] Restore service failure shows an explicit failure alert.
- [ ] Active entitlement routes directly to Home on restart.
- [ ] Settings refreshes access after purchase, cancellation, expiry, and
      returning to the foreground.
- [ ] “Manage subscription” opens Google Play Subscription Center.
- [ ] Purchase, restore, expiry, offline startup, reinstall, and a second device
      behave as expected.
- [ ] Production logs contain no serialized customer information.

Never store RevenueCat dashboard secrets or service-account JSON in this
repository.
