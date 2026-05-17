export default ({ config }) => ({
  expo: {
    name: 'Quit Smoking - Smoke Tracker',
    slug: 'quit-smoking',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'quitsmoking',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dailyapplabs.quitsmoke',
    },

    android: {
      adaptiveIcon: {
        backgroundColor: '#ffffff',
        foregroundImage: './assets/icons/adaptive-icon.png',
        monochromeImage: './assets/icons/adaptive-icon.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.dailyapplabs.quitsmoke',
    },

    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/icons/splash-icon-dark.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            image: './assets/icons/splash-icon-light.png',
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-font',
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: 'ac159556-9ec1-4d90-a104-4c0483eeb119',
      },

      // ✅ this comes from eas.json env
      PAYWALL_BYPASS: process.env.PAYWALL_BYPASS || 'false',
    },
  },
});
