# Quit Smoking

Expo React Native app for tracking smoking logs, triggers, and progress stats.

## Setup

Install dependencies:

```bash
npm install
```

Create the ignored local environment file:

```bash
cp .env.example .env.local
```

Set `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` in `.env.local` to the RevenueCat
Test Store public SDK key. Expo loads this file for `npx expo run:android` and
`npm start`; EAS profiles use the values in `eas.json` instead.

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

This profile uses `PAYWALL_BYPASS=false` and the Google Play RevenueCat public
SDK key configured in `eas.json`.

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

## Native project and billing keys

The project uses Expo CNG: `android/` is generated locally and by EAS from
`app.config.js` and is intentionally not committed. Run `npx expo
prebuild --platform android` only when a native inspection is needed.

Development may use a RevenueCat Test Store `test_` public SDK key. The
`closedTest` and `production` profiles must use a Google Play `goog_` public SDK
key. A missing, placeholder, or test key in a production build disables purchase
actions; it never enables mock purchases.
