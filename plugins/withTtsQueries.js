const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withTtsQueries(config) {
  return withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;

    // Ensure <queries> exists
    if (!manifest.queries) {
      manifest.queries = [{}];
    }

    const queries = manifest.queries[0];

    // Ensure <intent> exists within <queries>
    if (!queries.intent) {
      queries.intent = [];
    }

    // Add the TTS_SERVICE intent if it's not already there
    const hasTtsIntent = queries.intent.some(
      (i) => i.action && i.action[0].$['android:name'] === 'android.intent.action.TTS_SERVICE'
    );

    if (!hasTtsIntent) {
      queries.intent.push({
        action: [
          {
            $: { 'android:name': 'android.intent.action.TTS_SERVICE' },
          },
        ],
      });
    }

    return config;
  });
};