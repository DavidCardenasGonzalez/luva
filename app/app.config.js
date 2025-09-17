// Dynamic Expo config to inject env vars into Constants.expoConfig.extra
require("dotenv").config();

module.exports = {
  expo: {
    name: "Luva",
    slug: "luva",
    scheme: "myapp",
    version: "1.0.0",
    orientation: "portrait",
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ["**/*"],
    ios: { supportsTablet: true },
    // Icons temporarily disabled until assets are added
    // icon: './assets/icon.png',
    android: {},
    plugins: [],
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
      COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
      REDIRECT_URI: process.env.REDIRECT_URI || "myapp://callback",
    },
  },
};
