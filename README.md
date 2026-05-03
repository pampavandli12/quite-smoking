# Quit Smoking

Expo React Native app for tracking smoking logs, triggers, and progress stats.

## Setup

Install dependencies:

```bash
npm install
```

## Local Android Development

This project uses a development build because it includes native modules such as RevenueCat purchases.

### Run locally with paywall bypass enabled

Use this when you want to skip the subscription screen while developing:

```bash
PAYWALL_BYPASS=true npx expo run:android
PAYWALL_BYPASS=true npm start
```

### Run locally with the real paywall

Use this when you want production-like subscription behavior:

```bash
PAYWALL_BYPASS=false npx expo run:android
PAYWALL_BYPASS=false npm start
```

If the app is already installed and you only need to restart Metro:

```bash
PAYWALL_BYPASS=true npm start -- --clear
```

or:

```bash
PAYWALL_BYPASS=false npm start -- --clear
```

`PAYWALL_BYPASS` is read through `app.config.js`, so restart Metro after changing the value.

## EAS Builds

EAS build profiles are configured in `eas.json`.

### Development build

Creates an internal development client build. This profile currently sets `PAYWALL_BYPASS=true`.

```bash
eas build --profile development --platform android
```

After installing the development build on an emulator/device, start Metro with the same bypass value:

```bash
PAYWALL_BYPASS=true npm start
```

### Closed testing build

Creates a store-distributed build for closed testing:

```bash
eas build --profile closedTest --platform android
```

Note: if you want testers to validate the real Play Billing/RevenueCat flow, set `PAYWALL_BYPASS=false` for this profile before building.

### Production build

Creates a production Android build. This profile sets `PAYWALL_BYPASS=false`.

```bash
eas build --profile production --platform android
```

Submit the latest production build to Google Play:

```bash
eas submit --platform android
```

## Useful Checks

Run TypeScript checks:

```bash
npx tsc --noEmit
```

Run lint:

```bash
npm run lint
```

## Paywall Configuration

`PAYWALL_BYPASS` flow:

1. `eas.json` or your shell sets `PAYWALL_BYPASS`.
2. `app.config.js` exposes it through `expo.extra.PAYWALL_BYPASS`.
3. `app/index.tsx` reads it with `expo-constants`.

Use `PAYWALL_BYPASS=true` only for development/internal testing. Use `PAYWALL_BYPASS=false` for production and for any test build where purchases must be validated.
