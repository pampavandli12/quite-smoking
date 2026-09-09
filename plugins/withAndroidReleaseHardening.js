const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PREVIEW_ACTIVITY = 'androidx.compose.ui.tooling.PreviewActivity';
const LEGACY_PROGUARD_FILE = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZED_PROGUARD_FILE =
  'getDefaultProguardFile("proguard-android-optimize.txt")';

function withAndroidReleaseGradleOptimization(config) {
  return withDangerousMod(config, [
    'android',
    async (configWithMod) => {
      const buildGradlePath = path.join(
        configWithMod.modRequest.platformProjectRoot,
        'app',
        'build.gradle',
      );
      const contents = await fs.promises.readFile(buildGradlePath, 'utf8');

      if (!contents.includes(LEGACY_PROGUARD_FILE)) {
        return configWithMod;
      }

      await fs.promises.writeFile(
        buildGradlePath,
        contents.replace(LEGACY_PROGUARD_FILE, OPTIMIZED_PROGUARD_FILE),
      );

      return configWithMod;
    },
  ]);
}

module.exports = function withAndroidReleaseHardening(config) {
  config = withAndroidReleaseGradleOptimization(config);

  return withAndroidManifest(config, (configWithManifest) => {
    const manifest = configWithManifest.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) {
      throw new Error('Android application manifest entry is missing.');
    }

    application.$['android:allowBackup'] = 'false';
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const activities = application.activity ?? [];
    const withoutDuplicateRemoval = activities.filter(
      (activity) =>
        activity.$?.['android:name'] !== PREVIEW_ACTIVITY ||
        activity.$?.['tools:node'] !== 'remove',
    );

    application.activity = [
      ...withoutDuplicateRemoval,
      {
        $: {
          'android:name': PREVIEW_ACTIVITY,
          'tools:node': 'remove',
        },
      },
    ];

    return configWithManifest;
  });
};
