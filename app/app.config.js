// Dynamic Expo config to inject env vars into Constants.expoConfig.extra
require("dotenv").config();

module.exports = {
  expo: {
    name: "Luva",
    slug: "luva",
    scheme: "myapp",
    version: "1.1.3",
    orientation: "portrait",
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ["**/*"],
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0b1224",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.cardi7.luva",
      buildNumber: "1.1.3",
      infoPlist: {
        // NSUserTrackingUsageDescription:
        // "Usamos tu identificador publicitario para medir suscripciones y mejorar nuestras campañas. No vendemos tu información.",
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription:
          "Luva usa el micrófono para que puedas grabar tu voz mientras practicas ejercicios de habla inglesa y recibir comentarios sobre tu pronunciación.",
      },
    },
    // Icons temporarily disabled until assets are added
    // icon: './assets/icon.png',
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0b1224",
      },
      package: "com.cardi7.luva",
      versionCode: 4,
    },
    plugins: [
      "expo-dev-client",
      "expo-secure-store",
      "expo-web-browser",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: "ca-app-pub-3572102651268229~7993878658",
          iosAppId: "ca-app-pub-3572102651268229~4090701782",
        },
      ],
    ],
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
      COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
      REDIRECT_URI: process.env.REDIRECT_URI || "myapp://callback",
      REVENUECAT_IOS_API_KEY:
        process.env.REVENUECAT_IOS_API_KEY ||
        "test_McxcjSSwciXGjgWNQzomMYBDQXe",
      REVENUECAT_ANDROID_API_KEY:
        process.env.REVENUECAT_ANDROID_API_KEY ||
        "test_McxcjSSwciXGjgWNQzomMYBDQXe",
      REVENUECAT_ENTITLEMENT_ID:
        process.env.REVENUECAT_ENTITLEMENT_ID || "Luva Pro",
      eas: { projectId: "f907b78e-85ff-4222-a01f-5c469f016c89" },
    },
  },
};
