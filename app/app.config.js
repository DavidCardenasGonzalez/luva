// Dynamic Expo config to inject env vars into Constants.expoConfig.extra
require("dotenv").config();

const metaAppId = process.env.META_APP_ID?.trim();
const metaClientToken = process.env.META_CLIENT_TOKEN?.trim();
const metaDisplayName = process.env.META_DISPLAY_NAME?.trim() || "Luva";
const metaScheme = metaAppId ? `fb${metaAppId}` : undefined;
const metaTrackingPermission =
  process.env.META_IOS_USER_TRACKING_PERMISSION?.trim() ||
  "Usamos tu identificador publicitario para medir suscripciones y mejorar nuestras campañas en Meta. No vendemos tu informacion.";
const metaConfigured = Boolean(metaAppId && metaClientToken);

const plugins = [
  "expo-dev-client",
  "expo-secure-store",
  "expo-web-browser",
  [
    "react-native-google-mobile-ads",
    {
      androidAppId: "ca-app-pub-3572102651268229~7758474310",
      iosAppId: "ca-app-pub-3572102651268229~4090701782",
    },
  ],
];

if (metaConfigured) {
  plugins.push([
    "expo-tracking-transparency",
    {
      userTrackingPermission: metaTrackingPermission,
    },
  ]);
  plugins.push([
    "react-native-fbsdk-next",
    {
      appID: metaAppId,
      clientToken: metaClientToken,
      displayName: metaDisplayName,
      scheme: metaScheme,
      isAutoInitEnabled: true,
      autoLogAppEventsEnabled: true,
      advertiserIDCollectionEnabled: true,
      iosUserTrackingPermission: metaTrackingPermission,
    },
  ]);
}

module.exports = {
  expo: {
    name: "Luva",
    slug: "luva",
    scheme: "myapp",
    version: "1.1.5",
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
      buildNumber: "1.1.5",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription:
          "Luva usa el micrófono para que puedas grabar tu voz mientras practicas ejercicios de habla inglesa y recibir comentarios sobre tu pronunciación.",
        ...(metaConfigured
          ? {
              NSUserTrackingUsageDescription: metaTrackingPermission,
            }
          : {}),
      },
      associatedDomains: ["applinks:www.luvaenglish.com"],
    },
    // Icons temporarily disabled until assets are added
    // icon: './assets/icon.png',
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0b1224",
      },
      package: "com.cardi7.luva",
      versionCode: 5,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "www.luvaenglish.com",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    plugins,
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
      META_ENABLED: metaConfigured,
      META_APP_ID: metaAppId,
      META_DISPLAY_NAME: metaDisplayName,
      eas: { projectId: "f907b78e-85ff-4222-a01f-5c469f016c89" },
    },
  },
};
