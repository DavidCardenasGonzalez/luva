// Dynamic Expo config to inject env vars into Constants.expoConfig.extra
require('dotenv').config();

module.exports = {
  expo: {
    name: 'Luva',
    slug: 'luva',
    scheme: 'myapp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ['**/*'],
    ios: { supportsTablet: true },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
    },
    plugins: [],
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
      COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
      REDIRECT_URI: process.env.REDIRECT_URI || 'myapp://callback',
    },
  },
};

