// Dynamic Expo config to inject env vars into Constants.expoConfig.extra
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || "development")
  .trim()
  .toLowerCase();
const isProduction = appEnv === "production";
const envFile = path.join(__dirname, `.env.${appEnv}`);
const baseEnvFile = path.join(__dirname, ".env");
const baseEnv = fs.existsSync(baseEnvFile) ? dotenv.parse(fs.readFileSync(baseEnvFile)) : {};

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else if (isProduction || !process.env.APP_ENV) {
  dotenv.config();
}

const getRevenueCatEnv = (key) => process.env[key] || baseEnv[key];

const metaAppId = process.env.META_APP_ID?.trim();
const metaClientToken = process.env.META_CLIENT_TOKEN?.trim();
const metaDisplayName = process.env.META_DISPLAY_NAME?.trim() || "Luva";
const metaScheme = metaAppId ? `fb${metaAppId}` : undefined;
const metaTrackingPermission =
  process.env.META_IOS_USER_TRACKING_PERMISSION?.trim() ||
  "Usamos tu identificador publicitario para medir suscripciones y mejorar nuestras campañas en Meta. No vendemos tu informacion.";
const metaConfigured = Boolean(metaAppId && metaClientToken);
const mixpanelProjectToken = process.env.MIXPANEL_PROJECT_TOKEN?.trim();
const mixpanelServerUrl = process.env.MIXPANEL_SERVER_URL?.trim();
const mixpanelTrackAutomaticEvents =
  process.env.MIXPANEL_TRACK_AUTOMATIC_EVENTS?.trim().toLowerCase() === "true";
const mixpanelConfigured = Boolean(mixpanelProjectToken);
const analyticsEnabledInDev =
  process.env.ANALYTICS_ENABLED_IN_DEV?.trim().toLowerCase() === "true";
const appName = process.env.APP_DISPLAY_NAME?.trim() || (isProduction ? "Luva" : "Luva Dev");
const appScheme = process.env.APP_SCHEME?.trim() || (isProduction ? "myapp" : "luvadev");
const iosBundleIdentifier =
  process.env.IOS_BUNDLE_IDENTIFIER?.trim() ||
  ("com.cardi7.luva");
console.log(`Using app scheme: ${iosBundleIdentifier}`);
const androidPackage =
  process.env.ANDROID_PACKAGE?.trim() ||
  ("com.cardi7.luva");

const plugins = [
  "expo-dev-client",
  "expo-secure-store",
  "expo-web-browser",
  [
    "expo-notifications",
    {
      defaultChannel: "default",
      color: "#22d3ee",
    },
  ],
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
    name: appName,
    slug: "luva",
    scheme: appScheme,
    version: "1.3.1",
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
      bundleIdentifier: iosBundleIdentifier,
      buildNumber: "1.3.1",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["audio"],
        NSMicrophoneUsageDescription:
          "Luva usa el micrófono para que puedas grabar tu voz mientras practicas ejercicios de habla inglesa y recibir comentarios sobre tu pronunciación.",
        NSPhotoLibraryUsageDescription:
          "Luva accede a tu galería para que puedas compartir fotos en la conversación con tu amigo virtual.",
        NSCameraUsageDescription:
          "Luva usa la cámara para que puedas tomar y compartir fotos en la conversación.",
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
      package: androidPackage,
      versionCode: 15,
      permissions: ["android.permission.CAMERA"],
      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
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
      APP_ENV: appEnv,
      COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
      COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
      COGNITO_REGION: process.env.COGNITO_REGION,
      REDIRECT_URI: process.env.REDIRECT_URI || `${appScheme}://callback`,
      REVENUECAT_IOS_API_KEY:
        getRevenueCatEnv("REVENUECAT_IOS_API_KEY") ||
        "test_McxcjSSwciXGjgWNQzomMYBDQXe",
      REVENUECAT_ANDROID_API_KEY:
        getRevenueCatEnv("REVENUECAT_ANDROID_API_KEY") ||
        "test_McxcjSSwciXGjgWNQzomMYBDQXe",
      REVENUECAT_ENTITLEMENT_ID:
        getRevenueCatEnv("REVENUECAT_ENTITLEMENT_ID") || "Luva Pro",
      META_ENABLED: metaConfigured,
      META_APP_ID: metaAppId,
      META_DISPLAY_NAME: metaDisplayName,
      MIXPANEL_ENABLED: mixpanelConfigured,
      MIXPANEL_PROJECT_TOKEN: mixpanelProjectToken,
      MIXPANEL_SERVER_URL: mixpanelServerUrl,
      MIXPANEL_TRACK_AUTOMATIC_EVENTS: mixpanelTrackAutomaticEvents,
      ANALYTICS_ENABLED_IN_DEV: analyticsEnabledInDev,
      eas: { projectId: "f907b78e-85ff-4222-a01f-5c469f016c89" },
    },
  },
};
