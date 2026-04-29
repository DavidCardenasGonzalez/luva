import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import { Mixpanel } from "mixpanel-react-native";

type MixpanelUserIdentity = {
  email?: string;
  cognitoSub?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  isPro?: boolean;
};

type MixpanelEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type ScreenViewedEvent = {
  screenName: string;
  previousScreenName?: string;
};

type MixpanelPaywallViewedEvent = {
  source?: string;
  asModal?: boolean;
  coinBalance: number;
  maxCoins: number;
  isUnlimited?: boolean;
};

type MixpanelPremiumActivatedEvent = {
  premiumSource: "subscription" | "restore" | "promo_code";
  paywallSource?: string;
  packageId?: string;
  productId?: string;
  price?: number;
  priceString?: string;
  currency?: string;
  subscriptionPeriod?: string | null;
  hasIntroOffer?: boolean;
  expiresAt?: string | null;
  premiumDays?: number;
};

type MixpanelFeedLoadMoreEvent = {
  previousItemsCount: number;
  nextItemsCount: number;
  itemsLoadedCount: number;
  previousMissionsCount: number;
  nextMissionsCount: number;
  missionsLoadedCount: number;
  previousVocabularyCount: number;
  nextVocabularyCount: number;
  vocabularyLoadedCount: number;
  totalMissionsAvailable: number;
  totalVocabularyAvailable: number;
  hasMoreAfter: boolean;
};

type MixpanelPracticeEvent = {
  practiceType: "card" | "story" | "generic";
  cardId?: string;
  storyId?: string;
  sceneIndex?: number;
  label?: string;
  attemptIndex?: number;
  inputMethod?: "text" | "audio";
  result?: "correct" | "partial" | "incorrect";
  score?: number;
  selectedAnswer?: "a" | "b" | "c";
  expectedAnswer?: "a" | "b" | "c";
  answerMatched?: boolean;
  transcriptLength?: number;
  transcriptWordCount?: number;
  questionLength?: number;
  questionWordCount?: number;
  historyMessageCount?: number;
  hasFeedback?: boolean;
};

type MixpanelMissionEvent = {
  storyId: string;
  storyTitle?: string;
  missionId: string;
  missionTitle?: string;
  sceneIndex: number;
  alreadyCompleted?: boolean;
  storyCompleted?: boolean;
  messageIndex?: number;
  messageAttemptIndex?: number;
  inputMethod?: "text" | "audio";
  result?: "correct" | "partial" | "incorrect";
  correctness?: number;
  questionLength?: number;
  questionWordCount?: number;
  historyMessageCount?: number;
  requirementsMetCount?: number;
};

type MixpanelOnboardingStepEvent = {
  stepNumber: number;
  stepId: string;
  title?: string;
};

type CryptoWithRandomValues = {
  getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T;
};

const extra = Constants.expoConfig?.extra || {};
const MIXPANEL_PROJECT_TOKEN =
  typeof extra.MIXPANEL_PROJECT_TOKEN === "string"
    ? extra.MIXPANEL_PROJECT_TOKEN.trim()
    : "";
const MIXPANEL_ENABLED = Boolean(
  extra.MIXPANEL_ENABLED && MIXPANEL_PROJECT_TOKEN
);
const MIXPANEL_SERVER_URL =
  typeof extra.MIXPANEL_SERVER_URL === "string" &&
  extra.MIXPANEL_SERVER_URL.trim()
    ? extra.MIXPANEL_SERVER_URL.trim()
    : undefined;
const MIXPANEL_TRACK_AUTOMATIC_EVENTS = Boolean(
  extra.MIXPANEL_TRACK_AUTOMATIC_EVENTS
);
const MIXPANEL_USE_NATIVE = Boolean(
  Platform.OS !== "web" && NativeModules.MixpanelReactNative
);
const FIRST_OPEN_TRACKED_KEY = "luva_mixpanel_first_open_tracked";

let mixpanel: Mixpanel | null = null;
let initializePromise: Promise<Mixpanel | null> | null = null;
let initialAppOpenPromise: Promise<void> | null = null;
let firstOpenPromise: Promise<void> | null = null;
let identifiedUserId: string | undefined;

function normalizeProperties(properties: MixpanelEventProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([, value]) => value !== undefined && value !== null
    )
  ) as Record<string, string | number | boolean>;
}

function getUserDistinctId(user?: MixpanelUserIdentity | null) {
  const cognitoSub = user?.cognitoSub?.trim();
  if (cognitoSub) {
    return cognitoSub;
  }
  return user?.email?.trim().toLowerCase();
}

function getBaseSuperProperties() {
  return normalizeProperties({
    app_name: "Luva",
    app_platform: Platform.OS,
  });
}

function trackEvent(
  instance: Mixpanel,
  eventName: string,
  properties?: MixpanelEventProperties
) {
  instance.track(eventName, normalizeProperties(properties));
}

function getMissionProperties(event: MixpanelMissionEvent) {
  return normalizeProperties({
    event_category: "mission",
    story_id: event.storyId,
    story_title: event.storyTitle,
    mission_id: event.missionId,
    mission_title: event.missionTitle,
    scene_index: event.sceneIndex,
    mission_number: event.sceneIndex + 1,
    already_completed: event.alreadyCompleted,
    story_completed: event.storyCompleted,
    message_index: event.messageIndex,
    message_attempt_index: event.messageAttemptIndex,
    input_method: event.inputMethod,
    result: event.result,
    correctness: event.correctness,
    question_length: event.questionLength,
    question_word_count: event.questionWordCount,
    history_message_count: event.historyMessageCount,
    requirements_met_count: event.requirementsMetCount,
  });
}

function getPracticeProperties(event: MixpanelPracticeEvent) {
  return normalizeProperties({
    event_category: "practice",
    practice_type: event.practiceType,
    card_id: event.cardId,
    story_id: event.storyId,
    scene_index: event.sceneIndex,
    practice_number:
      typeof event.sceneIndex === "number" ? event.sceneIndex + 1 : undefined,
    label: event.label?.trim() || undefined,
    attempt_index: event.attemptIndex,
    input_method: event.inputMethod,
    result: event.result,
    score: event.score,
    selected_answer: event.selectedAnswer,
    expected_answer: event.expectedAnswer,
    answer_matched: event.answerMatched,
    transcript_length: event.transcriptLength,
    transcript_word_count: event.transcriptWordCount,
    question_length: event.questionLength,
    question_word_count: event.questionWordCount,
    history_message_count: event.historyMessageCount,
    has_feedback: event.hasFeedback,
  });
}

function installRandomValuesFallbackIfNeeded() {
  const globalWithCrypto = globalThis as unknown as {
    crypto?: CryptoWithRandomValues;
  };

  if (!globalWithCrypto.crypto) {
    globalWithCrypto.crypto = {};
  }

  const currentGetRandomValues =
    globalWithCrypto.crypto.getRandomValues?.bind(globalWithCrypto.crypto);

  if (currentGetRandomValues) {
    try {
      currentGetRandomValues(new Uint8Array(1));
      return;
    } catch (err) {
      if (
        !(err instanceof Error) ||
        !err.message.includes("Native module not found")
      ) {
        throw err;
      }
    }
  }

  globalWithCrypto.crypto.getRandomValues = <T extends ArrayBufferView | null>(
    array: T
  ) => {
    if (!array || !("byteLength" in array)) {
      return array;
    }

    const bytes = new Uint8Array(
      array.buffer,
      array.byteOffset,
      array.byteLength
    );

    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }

    return array;
  };
}

export function isMixpanelEnabled() {
  return MIXPANEL_ENABLED;
}

export async function initializeMixpanelSdk() {
  if (!MIXPANEL_ENABLED) {
    return null;
  }

  if (mixpanel) {
    return mixpanel;
  }

  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    try {
      if (!MIXPANEL_USE_NATIVE) {
        installRandomValuesFallbackIfNeeded();
      }

      const instance = MIXPANEL_USE_NATIVE
        ? new Mixpanel(
            MIXPANEL_PROJECT_TOKEN,
            MIXPANEL_TRACK_AUTOMATIC_EVENTS,
            true
          )
        : new Mixpanel(
            MIXPANEL_PROJECT_TOKEN,
            MIXPANEL_TRACK_AUTOMATIC_EVENTS,
            false
          );

      await instance.init(
        false,
        getBaseSuperProperties(),
        MIXPANEL_SERVER_URL
      );

      mixpanel = instance;
      return instance;
    } catch (err) {
      console.warn("[Mixpanel] No se pudo inicializar el SDK", err);
      initializePromise = null;
      return null;
    }
  })();

  return initializePromise;
}

export async function setMixpanelUserIdentity(
  user?: MixpanelUserIdentity | null
) {
  const instance = await initializeMixpanelSdk();
  if (!instance) {
    return;
  }

  try {
    const distinctId = getUserDistinctId(user);

    if (!distinctId) {
      instance.registerSuperProperties(
        normalizeProperties({
          ...getBaseSuperProperties(),
          is_signed_in: false,
        })
      );
      identifiedUserId = undefined;
      return;
    }

    if (identifiedUserId !== distinctId) {
      await instance.identify(distinctId);
      identifiedUserId = distinctId;
    }

    const normalizedEmail = user?.email?.trim().toLowerCase();
    instance.registerSuperProperties(
      normalizeProperties({
        ...getBaseSuperProperties(),
        user_id: distinctId,
        is_signed_in: true,
        is_pro: Boolean(user?.isPro),
      })
    );
    instance.getPeople().set(
      normalizeProperties({
        $email: normalizedEmail,
        $name: user?.displayName?.trim() || undefined,
        $first_name: user?.givenName?.trim() || undefined,
        $last_name: user?.familyName?.trim() || undefined,
        cognito_sub: user?.cognitoSub?.trim() || undefined,
        is_pro: Boolean(user?.isPro),
      })
    );
  } catch (err) {
    console.warn(
      "[Mixpanel] No se pudo actualizar la identidad del usuario",
      err
    );
  }
}

export async function resetMixpanelUserIdentity() {
  const instance = await initializeMixpanelSdk();
  if (!instance) {
    return;
  }

  try {
    instance.reset();
    identifiedUserId = undefined;
    instance.registerSuperProperties(
      normalizeProperties({
        ...getBaseSuperProperties(),
        is_signed_in: false,
      })
    );
  } catch (err) {
    console.warn("[Mixpanel] No se pudo limpiar la identidad del usuario", err);
  }
}

export async function trackMixpanelEvent(
  eventName: string,
  properties?: MixpanelEventProperties
) {
  const instance = await initializeMixpanelSdk();
  if (!instance) {
    return;
  }

  try {
    trackEvent(instance, eventName, properties);
  } catch (err) {
    console.warn(`[Mixpanel] No se pudo registrar ${eventName}`, err);
  }
}

export async function trackFirstOpenIfNeeded() {
  if (firstOpenPromise) {
    return firstOpenPromise;
  }

  firstOpenPromise = (async () => {
    const instance = await initializeMixpanelSdk();
    if (!instance) {
      firstOpenPromise = null;
      return;
    }

    try {
      const alreadyTracked = await AsyncStorage.getItem(FIRST_OPEN_TRACKED_KEY);
      if (alreadyTracked) {
        return;
      }

      await AsyncStorage.setItem(
        FIRST_OPEN_TRACKED_KEY,
        new Date().toISOString()
      );
      trackEvent(instance, "first_open");
      instance.flush();
    } catch (err) {
      console.warn("[Mixpanel] No se pudo registrar first_open", err);
    }
  })();

  return firstOpenPromise;
}

export async function trackAppOpen(properties?: MixpanelEventProperties) {
  await trackMixpanelEvent("app_open", properties);
}

export async function trackInitialAppOpen() {
  if (initialAppOpenPromise) {
    return initialAppOpenPromise;
  }

  initialAppOpenPromise = (async () => {
    const instance = await initializeMixpanelSdk();
    if (!instance) {
      initialAppOpenPromise = null;
      return;
    }

    await trackFirstOpenIfNeeded();

    try {
      trackEvent(instance, "app_open", { open_type: "launch" });
    } catch (err) {
      console.warn("[Mixpanel] No se pudo registrar app_open", err);
    }
  })();

  return initialAppOpenPromise;
}

export async function trackScreenViewed({
  screenName,
  previousScreenName,
}: ScreenViewedEvent) {
  await trackMixpanelEvent("screen_viewed", {
    event_category: "navigation",
    screen_name: screenName,
    previous_screen_name: previousScreenName,
  });
}

export async function trackMixpanelPaywallViewed({
  source,
  asModal,
  coinBalance,
  maxCoins,
  isUnlimited,
}: MixpanelPaywallViewedEvent) {
  await trackMixpanelEvent("paywall_viewed", {
    event_category: "monetization",
    paywall_source: source || "unknown",
    paywall_modal: Boolean(asModal),
    coin_balance: coinBalance,
    max_coins: maxCoins,
    coins_unlimited: Boolean(isUnlimited),
  });
}

export async function trackMixpanelPremiumActivated({
  premiumSource,
  paywallSource,
  packageId,
  productId,
  price,
  priceString,
  currency,
  subscriptionPeriod,
  hasIntroOffer,
  expiresAt,
  premiumDays,
}: MixpanelPremiumActivatedEvent) {
  const instance = await initializeMixpanelSdk();
  if (!instance) {
    return;
  }

  try {
    instance.registerSuperProperties(
      normalizeProperties({
        ...getBaseSuperProperties(),
        is_pro: true,
        premium_source: premiumSource,
      })
    );
    instance.getPeople().set(
      normalizeProperties({
        is_pro: true,
        premium_source: premiumSource,
        premium_product_id: productId,
        premium_expires_at: expiresAt,
      })
    );
    trackEvent(instance, "premium_activated", {
      event_category: "monetization",
      premium_source: premiumSource,
      paywall_source: paywallSource || undefined,
      package_id: packageId,
      product_id: productId,
      price,
      price_string: priceString,
      currency,
      subscription_period: subscriptionPeriod || undefined,
      has_intro_offer: hasIntroOffer,
      expires_at: expiresAt || undefined,
      premium_days: premiumDays,
    });
    instance.flush();
  } catch (err) {
    console.warn("[Mixpanel] No se pudo registrar premium_activated", err);
  }
}

export async function trackMixpanelFeedLoadMore({
  previousItemsCount,
  nextItemsCount,
  itemsLoadedCount,
  previousMissionsCount,
  nextMissionsCount,
  missionsLoadedCount,
  previousVocabularyCount,
  nextVocabularyCount,
  vocabularyLoadedCount,
  totalMissionsAvailable,
  totalVocabularyAvailable,
  hasMoreAfter,
}: MixpanelFeedLoadMoreEvent) {
  await trackMixpanelEvent("feed_load_more", {
    event_category: "feed",
    previous_items_count: previousItemsCount,
    next_items_count: nextItemsCount,
    items_loaded_count: itemsLoadedCount,
    previous_missions_count: previousMissionsCount,
    next_missions_count: nextMissionsCount,
    missions_loaded_count: missionsLoadedCount,
    previous_vocabulary_count: previousVocabularyCount,
    next_vocabulary_count: nextVocabularyCount,
    vocabulary_loaded_count: vocabularyLoadedCount,
    total_missions_available: totalMissionsAvailable,
    total_vocabulary_available: totalVocabularyAvailable,
    has_more_after: hasMoreAfter,
  });
}

export async function trackMixpanelPracticeStarted(
  event: MixpanelPracticeEvent
) {
  await trackMixpanelEvent("practice_started", getPracticeProperties(event));
}

export async function trackMixpanelPracticeCompleted(
  event: MixpanelPracticeEvent
) {
  await trackMixpanelEvent("practice_completed", getPracticeProperties(event));
}

export async function trackMixpanelPracticeHelpRequested(
  event: MixpanelPracticeEvent
) {
  await trackMixpanelEvent(
    "practice_help_requested",
    getPracticeProperties(event)
  );
}

export async function trackMixpanelMissionVisited(event: MixpanelMissionEvent) {
  await trackMixpanelEvent("mission_visited", getMissionProperties(event));
}

export async function trackMixpanelMissionStarted(event: MixpanelMissionEvent) {
  await trackMixpanelEvent("mission_started", getMissionProperties(event));
}

export async function trackMixpanelMissionMessageSent(
  event: MixpanelMissionEvent
) {
  await trackMixpanelEvent("mission_message_sent", getMissionProperties(event));
}

export async function trackMixpanelMissionCompleted(
  event: MixpanelMissionEvent
) {
  await trackMixpanelEvent("mission_completed", getMissionProperties(event));
}

export async function trackMixpanelMissionHelpRequested(
  event: MixpanelMissionEvent
) {
  await trackMixpanelEvent("mission_help_requested", getMissionProperties(event));
}

export async function trackMixpanelOnboardingStepViewed({
  stepNumber,
  stepId,
  title,
}: MixpanelOnboardingStepEvent) {
  await trackMixpanelEvent(`onboarding-step-${stepNumber}`, {
    event_category: "onboarding",
    step_number: stepNumber,
    step_id: stepId,
    title: title?.trim() || undefined,
  });
}

export async function flushMixpanelEvents() {
  const instance = await initializeMixpanelSdk();
  if (!instance) {
    return;
  }

  try {
    instance.flush();
  } catch (err) {
    console.warn("[Mixpanel] No se pudo enviar la cola de eventos", err);
  }
}
