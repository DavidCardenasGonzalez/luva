import Constants from "expo-constants";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { NativeModules, Platform } from "react-native";
import { AppEventsLogger, Settings } from "react-native-fbsdk-next";

type MetaUserIdentity = {
  email?: string;
  givenName?: string;
  familyName?: string;
};

type MetaPaywallView = {
  source?: string;
  asModal?: boolean;
};

type MetaCheckoutEvent = {
  source?: string;
  packageId: string;
  productId: string;
  price: number;
  priceString: string;
  currency: string;
  subscriptionPeriod?: string | null;
  hasIntroOffer?: boolean;
};

type MetaMissionEvent = {
  storyId: string;
  storyTitle?: string;
  missionId: string;
  missionTitle?: string;
  sceneIndex: number;
  alreadyCompleted?: boolean;
  storyCompleted?: boolean;
};

type MetaPracticeEvent = {
  practiceType: "card" | "story" | "generic";
  cardId?: string;
  storyId?: string;
  sceneIndex?: number;
  label?: string;
};

type MetaViewedContentEvent = {
  contentId: string;
  contentType: string;
  description?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
};

type MetaOnboardingStepEvent = {
  stepNumber: number;
  stepId: string;
  title?: string;
};

type TrackingStatus =
  | "granted"
  | "denied"
  | "restricted"
  | "undetermined"
  | "unavailable";

const extra = Constants.expoConfig?.extra || {};
const META_ENABLED = Boolean(extra.META_ENABLED);

const META_EVENTS = AppEventsLogger.AppEvents || {
  InitiatedCheckout: "fb_mobile_initiated_checkout",
  Subscribe: "Subscribe",
  ViewedContent: "fb_mobile_content_view",
};

const META_EVENT_PARAMS = AppEventsLogger.AppEventParams || {
  ContentID: "fb_content_id",
  ContentType: "fb_content_type",
  Currency: "fb_currency",
  Description: "fb_description",
  NumItems: "fb_num_items",
};

const CUSTOM_EVENTS = {
  MissionStarted: "luva_mission_start",
  MissionCompleted: "luva_mission_complete",
  PracticeStarted: "luva_practice_start",
} as const;

let initializePromise: Promise<boolean> | null = null;

function canUseMetaSdk() {
  return Boolean(
    META_ENABLED &&
      Platform.OS !== "web" &&
      NativeModules.FBSettings &&
      NativeModules.FBAppEventsLogger
  );
}

function normalizeParams(
  params: Record<string, string | number | boolean | null | undefined>
) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === "boolean" ? Number(value) : value])
  ) as Record<string, string | number>;
}

function normalizeContentId(value?: string | number | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return normalized || "unknown";
}

function getPracticeContentId({
  practiceType,
  cardId,
  storyId,
  sceneIndex,
  label,
}: MetaPracticeEvent) {
  if (practiceType === "card" && cardId) {
    return `practice_card:${normalizeContentId(cardId)}`;
  }

  if (practiceType === "story" && storyId) {
    return `story_practice:${normalizeContentId(storyId)}:${normalizeContentId(
      typeof sceneIndex === "number" ? sceneIndex : 0
    )}`;
  }

  return `practice:${normalizeContentId(label || "generic")}`;
}

function logViewedContent({
  contentId,
  contentType,
  description,
  params,
}: MetaViewedContentEvent) {
  AppEventsLogger.logEvent(
    META_EVENTS.ViewedContent,
    normalizeParams({
      [META_EVENT_PARAMS.ContentID]: contentId,
      [META_EVENT_PARAMS.ContentType]: contentType,
      [META_EVENT_PARAMS.Description]: description?.trim() || undefined,
      ...params,
    })
  );
}

async function syncTrackingPermission(promptIfNeeded: boolean) {
  if (!canUseMetaSdk()) {
    return "unavailable" as TrackingStatus;
  }

  if (Platform.OS !== "ios") {
    return "granted" as TrackingStatus;
  }

  let tracking = await getTrackingPermissionsAsync();
  let status = tracking.status as TrackingStatus;

  if (promptIfNeeded && status === "undetermined") {
    tracking = await requestTrackingPermissionsAsync();
    status = tracking.status as TrackingStatus;
  }

  try {
    await Settings.setAdvertiserTrackingEnabled(status === "granted");
  } catch (err) {
    console.warn("[Meta] No se pudo actualizar advertiser tracking", err);
  }

  return status;
}

export async function initializeMetaSdk() {
  if (!canUseMetaSdk()) {
    return false;
  }

  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    try {
      Settings.setAutoLogAppEventsEnabled(true);
      Settings.setAdvertiserIDCollectionEnabled(true);
      Settings.initializeSDK();
      await syncTrackingPermission(false);
      return true;
    } catch (err) {
      console.warn("[Meta] No se pudo inicializar el SDK", err);
      initializePromise = null;
      return false;
    }
  })();

  return initializePromise;
}

export async function requestMetaTrackingPermissionIfNeeded() {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return "unavailable" as TrackingStatus;
  }

  try {
    return await syncTrackingPermission(true);
  } catch (err) {
    console.warn("[Meta] No se pudo solicitar ATT", err);
    return "unavailable" as TrackingStatus;
  }
}

export async function setMetaUserIdentity(user?: MetaUserIdentity | null) {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return;
  }

  try {
    const normalizedEmail = user?.email?.trim().toLowerCase();

    if (!normalizedEmail) {
      AppEventsLogger.clearUserID();
      AppEventsLogger.setUserData({});
      return;
    }

    AppEventsLogger.setUserID(normalizedEmail);
    AppEventsLogger.setUserData({
      email: normalizedEmail,
      firstName: user?.givenName?.trim() || undefined,
      lastName: user?.familyName?.trim() || undefined,
    });
  } catch (err) {
    console.warn("[Meta] No se pudo actualizar la identidad del usuario", err);
  }
}

export async function trackPaywallViewed({
  source,
  asModal,
}: MetaPaywallView) {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return;
  }

  try {
    logViewedContent({
      contentId: "luva_pro_paywall",
      contentType: "subscription_paywall",
      params: {
        paywall_source: source || "unknown",
        paywall_modal: Boolean(asModal),
      },
    });
  } catch (err) {
    console.warn("[Meta] No se pudo registrar el paywall", err);
  }
}

export async function trackMetaOnboardingStepViewed({
  stepNumber,
  stepId,
  title,
}: MetaOnboardingStepEvent) {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return;
  }

  try {
    logViewedContent({
      contentId: stepId,
      contentType: "onboarding_step",
      description: title,
      params: {
        step_number: stepNumber,
      },
    });
  } catch (err) {
    console.warn("[Meta] No se pudo registrar ViewContent de onboarding", err);
  }
}

export async function trackMissionStarted({
  storyId,
  storyTitle,
  missionId,
  missionTitle,
  sceneIndex,
  alreadyCompleted,
}: MetaMissionEvent) {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return;
  }

  try {
    logViewedContent({
      contentId: `story_mission:${normalizeContentId(
        storyId
      )}:${normalizeContentId(missionId)}`,
      contentType: "story_mission",
      description: missionTitle || storyTitle,
      params: {
        story_id: storyId,
        story_title: storyTitle || undefined,
        mission_id: missionId,
        mission_title: missionTitle || undefined,
        scene_index: sceneIndex,
        already_completed: Boolean(alreadyCompleted),
      },
    });
  } catch (err) {
    console.warn("[Meta] No se pudo registrar ViewContent de mision", err);
  }

  try {
    AppEventsLogger.logEvent(
      CUSTOM_EVENTS.MissionStarted,
      normalizeParams({
        story_id: storyId,
        story_title: storyTitle || undefined,
        mission_id: missionId,
        mission_title: missionTitle || undefined,
        scene_index: sceneIndex,
        already_completed: Boolean(alreadyCompleted),
      })
    );
  } catch (err) {
    console.warn("[Meta] No se pudo registrar mission_start", err);
  }
}

export async function trackMissionCompleted({
  storyId,
  storyTitle,
  missionId,
  missionTitle,
  sceneIndex,
  storyCompleted,
}: MetaMissionEvent) {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return;
  }

  try {
    AppEventsLogger.logEvent(
      CUSTOM_EVENTS.MissionCompleted,
      normalizeParams({
        story_id: storyId,
        story_title: storyTitle || undefined,
        mission_id: missionId,
        mission_title: missionTitle || undefined,
        scene_index: sceneIndex,
        story_completed: Boolean(storyCompleted),
      })
    );
    AppEventsLogger.flush();
  } catch (err) {
    console.warn("[Meta] No se pudo registrar mission_complete", err);
  }
}

export async function trackPracticeStarted({
  practiceType,
  cardId,
  storyId,
  sceneIndex,
  label,
}: MetaPracticeEvent) {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return;
  }

  try {
    logViewedContent({
      contentId: getPracticeContentId({
        practiceType,
        cardId,
        storyId,
        sceneIndex,
        label,
      }),
      contentType: `practice_${practiceType}`,
      description: label,
      params: {
        practice_type: practiceType,
        card_id: cardId || undefined,
        story_id: storyId || undefined,
        scene_index:
          typeof sceneIndex === "number" ? sceneIndex : undefined,
        label: label?.trim() || undefined,
      },
    });
  } catch (err) {
    console.warn("[Meta] No se pudo registrar ViewContent de practica", err);
  }

  try {
    AppEventsLogger.logEvent(
      CUSTOM_EVENTS.PracticeStarted,
      normalizeParams({
        practice_type: practiceType,
        card_id: cardId || undefined,
        story_id: storyId || undefined,
        scene_index:
          typeof sceneIndex === "number" ? sceneIndex : undefined,
        label: label?.trim() || undefined,
      })
    );
  } catch (err) {
    console.warn("[Meta] No se pudo registrar practice_start", err);
  }
}

export async function trackCheckoutInitiated({
  source,
  packageId,
  productId,
  price,
  priceString,
  currency,
  subscriptionPeriod,
  hasIntroOffer,
}: MetaCheckoutEvent) {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return;
  }

  try {
    AppEventsLogger.logEvent(
      META_EVENTS.InitiatedCheckout,
      price,
      normalizeParams({
        [META_EVENT_PARAMS.ContentID]: productId,
        [META_EVENT_PARAMS.ContentType]: "subscription",
        [META_EVENT_PARAMS.Currency]: currency,
        [META_EVENT_PARAMS.NumItems]: 1,
        package_id: packageId,
        paywall_source: source || "unknown",
        subscription_period: subscriptionPeriod || undefined,
        has_intro_offer: Boolean(hasIntroOffer),
        price_label: priceString,
      })
    );
  } catch (err) {
    console.warn("[Meta] No se pudo registrar InitiatedCheckout", err);
  }
}

export async function trackSubscriptionPurchased({
  source,
  packageId,
  productId,
  price,
  priceString,
  currency,
  subscriptionPeriod,
  hasIntroOffer,
}: MetaCheckoutEvent) {
  const initialized = await initializeMetaSdk();
  if (!initialized) {
    return;
  }

  try {
    AppEventsLogger.logEvent(
      META_EVENTS.Subscribe,
      price,
      normalizeParams({
        [META_EVENT_PARAMS.ContentID]: productId,
        [META_EVENT_PARAMS.ContentType]: "subscription",
        [META_EVENT_PARAMS.Currency]: currency,
        [META_EVENT_PARAMS.NumItems]: 1,
        package_id: packageId,
        paywall_source: source || "unknown",
        subscription_period: subscriptionPeriod || undefined,
        has_intro_offer: Boolean(hasIntroOffer),
        price_label: priceString,
      })
    );
    AppEventsLogger.flush();
  } catch (err) {
    console.warn("[Meta] No se pudo registrar Subscribe", err);
  }
}
