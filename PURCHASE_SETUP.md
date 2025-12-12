# In-App Purchase Setup Guide

This app uses RevenueCat for managing in-app subscriptions. Follow these steps to complete the setup.

## 1. Create RevenueCat Account

1. Go to [https://www.revenuecat.com](https://www.revenuecat.com)
2. Sign up for a free account
3. Create a new project for your app

## 2. Configure App Store Connect (iOS)

### Create In-App Purchase Product

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to "Features" > "In-App Purchases"
4. Click "+" to create a new subscription
5. Fill in the details:
   - **Reference Name**: Premium Monthly
   - **Product ID**: `com.yourapp.premium.monthly` (save this!)
   - **Subscription Group**: Create new group "Premium"
   - **Duration**: 1 month
   - **Price**: $1.20
   - **Free Trial**: 7 days

### Create Shared Secret

1. In App Store Connect, go to your app
2. Click "App Information"
3. Scroll to "App-Specific Shared Secret"
4. Click "Generate" and save the secret key

## 3. Configure Google Play Console (Android)

### Create In-App Product

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to "Monetization" > "Subscriptions"
4. Click "Create subscription"
5. Fill in the details:
   - **Product ID**: `com.yourapp.premium.monthly` (same as iOS)
   - **Name**: Premium Monthly
   - **Description**: Premium features for $1.20/month
   - **Price**: $1.20
   - **Free Trial**: 7 days

### Create Service Account

1. In Google Play Console, go to "Setup" > "API access"
2. Click "Create new service account"
3. Follow the instructions to create and download the JSON key file
4. Save this file securely

## 4. Configure RevenueCat

### Add iOS App

1. In RevenueCat dashboard, go to your project
2. Click "Apps" > "Add app"
3. Select "iOS"
4. Enter your Bundle ID
5. Upload the Shared Secret from App Store Connect
6. Copy the **iOS API Key**

### Add Android App

1. Click "Apps" > "Add app"
2. Select "Android"
3. Enter your Package Name
4. Upload the Service Account JSON file
5. Copy the **Android API Key**

### Create Entitlement

1. Go to "Entitlements" tab
2. Click "New Entitlement"
3. Name it "premium"
4. This is what the app checks for subscription status

### Create Product

1. Go to "Products" tab
2. Click "New product"
3. Enter the Product ID: `com.yourapp.premium.monthly`
4. Select platform (iOS/Android)
5. Link to App Store Connect/Google Play product

### Create Offering

1. Go to "Offerings" tab
2. Create a default offering
3. Add the monthly package
4. Set it as the default offering

## 5. Update App Configuration

Open `services/purchases.ts` and update the API keys:

```typescript
const REVENUECAT_API_KEY = Platform.select({
  ios: "appl_YOUR_IOS_API_KEY_HERE", // Replace with your iOS API key
  android: "goog_YOUR_ANDROID_API_KEY_HERE", // Replace with your Android API key
});
```

## 6. Testing

### iOS Testing

1. Create a sandbox test account in App Store Connect
2. Sign out of your regular Apple ID on the device
3. Run the app and try to purchase
4. Use sandbox account when prompted

### Android Testing

1. Add test accounts in Google Play Console
2. Upload app to Internal Testing track
3. Install from Play Store
4. Test purchases with test account

## 7. Production Checklist

- [ ] Replace API keys in `services/purchases.ts`
- [ ] Test subscription purchase on iOS
- [ ] Test subscription purchase on Android
- [ ] Test restore purchases
- [ ] Test subscription status check
- [ ] Set up webhook notifications in RevenueCat (optional)
- [ ] Configure subscription management URL
- [ ] Add Terms of Service and Privacy Policy links
- [ ] Submit apps to App Store and Google Play

## Entitlement Identifiers

The app checks for the entitlement named **"premium"**. Make sure this matches in RevenueCat dashboard.

## Product IDs

Make sure to use consistent Product IDs across:

- App Store Connect
- Google Play Console
- RevenueCat dashboard

Example: `com.yourapp.premium.monthly`

## Support Links

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [iOS Subscription Setup](https://docs.revenuecat.com/docs/ios-subscription-setup)
- [Android Subscription Setup](https://docs.revenuecat.com/docs/android-subscription-setup)

## Free Trial Flow

1. User clicks "Start 7-Day Free Trial"
2. Native subscription dialog appears
3. User confirms with Face ID/Touch ID or Google authentication
4. RevenueCat processes the subscription
5. App receives confirmation and navigates to home screen
6. User has 7 days of free access
7. After 7 days, subscription automatically charges $1.20/month
8. User can cancel anytime before trial ends

## Testing Without Purchases (Development)

For development and testing, there's a "Skip for now" button that allows bypassing the subscription screen. Remove this before production release.
