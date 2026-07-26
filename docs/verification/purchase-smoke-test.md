# RevenueCat Smoke Test

Test through a store-distributed build when validating real Google Play billing.
Keep entitlement `QuitSmoke Pro` and `PAYWALL_BYPASS` values unchanged.

- [ ] Bypass build routes directly to Home.
- [ ] Real-paywall build routes users without settings to setup.
- [ ] Inactive configured user sees the current offering and price.
- [ ] Cancellation leaves the user on the paywall without a failure alert.
- [ ] Purchase failure shows the existing generic failure alert.
- [ ] Purchase success shows the existing success alert and continues to Home.
- [ ] Restore with entitlement succeeds and continues to Home.
- [ ] Restore without entitlement shows “No Purchases Found”.
- [ ] Active entitlement routes directly to Home on restart.
- [ ] Production logs contain no serialized customer information.

Never store RevenueCat dashboard secrets or service-account JSON in this
repository.
