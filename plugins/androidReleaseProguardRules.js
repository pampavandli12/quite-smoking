/**
 * Release ProGuard/R8 keep rules appended by expo-build-properties.
 * Add entries here when a release build crash points to stripped classes.
 */
module.exports = [
  // React Native / Hermes
  '-keep class com.facebook.react.** { *; }',
  '-keep class com.facebook.hermes.** { *; }',
  '-keep class com.facebook.jni.** { *; }',
  '-keep class com.facebook.react.turbomodule.** { *; }',

  // Navigation and animation stack
  '-keep class com.swmansion.reanimated.** { *; }',
  '-keep class com.swmansion.gesturehandler.** { *; }',
  '-keep class com.swmansion.rnscreens.** { *; }',
  '-keep class com.th3rdwave.safeareacontext.** { *; }',

  // RevenueCat purchases
  '-keep class com.revenuecat.purchases.** { *; }',

  // Expo native modules used by this app
  '-keep class expo.modules.** { *; }',

  // Preserve readable crash reports after obfuscation
  '-keepattributes SourceFile,LineNumberTable',
  '-keepattributes *Annotation*',
  '-renamesourcefileattribute SourceFile',

  // Suppress common transitive warnings
  '-dontwarn com.facebook.react.**',
  '-dontwarn okhttp3.**',
  '-dontwarn okio.**',
].join('\n');
