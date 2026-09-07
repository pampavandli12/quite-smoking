const { withAndroidManifest } = require('@expo/config-plugins');

const PREVIEW_ACTIVITY = 'androidx.compose.ui.tooling.PreviewActivity';

module.exports = function withAndroidReleaseHardening(config) {
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
