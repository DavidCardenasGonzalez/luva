import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  NativeModules,
} from "react-native";
import useAudioRecorder from "../shared/useAudioRecorder";
import useUploadToS3 from "../shared/useUploadToS3";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "../api/api";
import CardStatusSelector from "../components/CardStatusSelector";
import {
  CARD_STATUS_LABELS,
  useCardProgress,
} from "../progress/CardProgressProvider";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import StoryMessageComposer, {
  StoryFlowState,
} from "../components/StoryMessageComposer";
import { useCoins, CARD_OPEN_COST, RECORDING_COST } from "../purchases/CoinBalanceProvider";
import TourOverlay, { TourHighlight } from "../components/TourOverlay";
import { hasSeenTour, markTourAsSeen } from "../tour/tourProgress";

type EvalRes = {
  score: number;
  result: "correct" | "partial" | "incorrect";
  feedback: {
    grammar: string[];
    wording: string[];
    naturalness: string[];
    register: string[];
  };
  errors?: string[];
  improvements?: string[];
  suggestions?: string[];
};

type StoryAssistanceResponse = {
  answer: string;
};

type PracticeState =
  | "idle"
  | "recording"
  | "uploading"
  | "transcribing"
  | "evaluating"
  | "done";

type PracticeTourStep = {
  key: string;
  ref: React.RefObject<View | null>;
  title: string;
  description: string;
};

const COLORS = {
  background: "#0b1224",
  surface: "#0f172a",
  border: "#1f2937",
  text: "#e2e8f0",
  muted: "#94a3b8",
  accent: "#38bdf8",
  accentStrong: "#0ea5e9",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  purple: "#8b5cf6",
};

const STATE_LABELS: Record<PracticeState, string> = {
  idle: "Listo",
  recording: "Grabando",
  uploading: "Subiendo",
  transcribing: "Transcribiendo",
  evaluating: "Evaluando",
  done: "Listo",
};

const STATE_STYLES: Record<
  PracticeState,
  { bg: string; color: string; border: string }
> = {
  idle: { bg: "#0b1224", color: COLORS.text, border: COLORS.border },
  recording: {
    bg: "rgba(139, 92, 246, 0.22)",
    color: "#c4b5fd",
    border: COLORS.purple,
  },
  uploading: {
    bg: "rgba(56, 189, 248, 0.2)",
    color: COLORS.accent,
    border: COLORS.accentStrong,
  },
  transcribing: {
    bg: "rgba(56, 189, 248, 0.2)",
    color: COLORS.accent,
    border: COLORS.accentStrong,
  },
  evaluating: {
    bg: "rgba(245, 158, 11, 0.2)",
    color: COLORS.warning,
    border: COLORS.warning,
  },
  done: {
    bg: "rgba(34, 197, 94, 0.16)",
    color: COLORS.success,
    border: COLORS.success,
  },
};

const luviImage = require("../image/luvi.png");

// Reemplaza estos IDs por tus ad units reales de rewarded en producción.
const PROD_REWARDED_AD_UNIT_ID =
  Platform.select({
    ios: "ca-app-pub-3572102651268229/8175446712",
    android: "ca-app-pub-3572102651268229/6032857897",
  }) ?? "ca-app-pub-3572102651268229/6032857897";

type MobileAdsRewardedModule = {
  AdEventType: {
    CLOSED: string;
    ERROR: string;
  };
  RewardedAdEventType: {
    LOADED: string;
    EARNED_REWARD: string;
  };
  RewardedAd: {
    createForAdRequest: (
      adUnitId: string,
      options?: { requestNonPersonalizedAdsOnly?: boolean },
    ) => {
      addAdEventListener: (
        eventType: string,
        listener: () => void,
      ) => () => void;
      load: () => void;
      show: () => Promise<void>;
    };
  };
  TestIds: {
    REWARDED: string;
  };
};

const getMobileAdsRewardedModule = (): MobileAdsRewardedModule | null => {
  const nativeAdsModule =
    (NativeModules as any)?.RNGoogleMobileAdsModule ||
    (NativeModules as any)?.RNGoogleMobileAdsNativeModule;
  if (!nativeAdsModule) {
    return null;
  }

  try {
    const ads =
      require("react-native-google-mobile-ads") as MobileAdsRewardedModule;
    if (
      !ads?.RewardedAd ||
      !ads?.RewardedAdEventType ||
      !ads?.AdEventType ||
      !ads?.TestIds
    ) {
      return null;
    }
    return ads;
  } catch {
    return null;
  }
};

const showRewardedAssistanceAd = () =>
  new Promise<boolean>((resolve) => {
    const ads = getMobileAdsRewardedModule();
    if (!ads) {
      resolve(true);
      return;
    }

    const rewardedAdUnitId = __DEV__
      ? ads.TestIds.REWARDED
      : PROD_REWARDED_AD_UNIT_ID;

    const { AdEventType, RewardedAdEventType, RewardedAd } = ads;
    const rewarded = RewardedAd.createForAdRequest(rewardedAdUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    let done = false;
    let earnedReward = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeLoaded: (() => void) | null = null;
    let unsubscribeClosed: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;
    let unsubscribeReward: (() => void) | null = null;

    const finish = (granted: boolean) => {
      if (done) return;
      done = true;
      unsubscribeLoaded?.();
      unsubscribeClosed?.();
      unsubscribeError?.();
      unsubscribeReward?.();
      if (timeoutId) clearTimeout(timeoutId);
      resolve(granted);
    };

    unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        rewarded.show().catch(() => finish(true));
      },
    );

    unsubscribeReward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earnedReward = true;
      },
    );

    unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      finish(earnedReward);
    });

    unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      finish(true);
    });

    timeoutId = setTimeout(() => finish(true), 7000);
    rewarded.load();
  });

export default function PracticeScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    cardId,
    storyId,
    sceneIndex,
    prompt,
    label,
    examples,
    options,
    answer,
    explanation,
  } = route.params || {};
  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const { statusFor } = useCardProgress();
  const { spendCoins, loading: coinsLoading, isUnlimited, balance } = useCoins();
  const [transcript, setTranscript] = useState("");
  const [state, setState] = useState<PracticeState>("idle");
  const [feedback, setFeedback] = useState<EvalRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<"a" | "b" | "c" | null>(null);
  const [canRecord, setCanRecord] = useState<boolean>(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [assistanceQuestion, setAssistanceQuestion] = useState("");
  const [assistanceAnswer, setAssistanceAnswer] = useState("");
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [assistanceError, setAssistanceError] = useState<string | null>(null);
  const chargeRegistered = useRef(false);
  const chargingCard = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const trainingCardRef = useRef<View>(null);
  const definitionCardRef = useRef<View>(null);
  const helpButtonRef = useRef<View>(null);
  const [showPracticeTour, setShowPracticeTour] = useState(false);
  const [practiceTourHighlight, setPracticeTourHighlight] =
    useState<TourHighlight | null>(null);
  const [practiceTourStepIndex, setPracticeTourStepIndex] = useState(0);
  const isStartingRecording = useRef(false);
  const stopRequestedWhileStarting = useRef(false);

  const ensureCardCharge = useCallback(async () => {
    if (!cardId || isUnlimited || chargeRegistered.current) {
      return true;
    }
    if (coinsLoading) {
      setError("Cargando tus monedas...");
      return false;
    }
    if (chargingCard.current) {
      return false;
    }
    chargingCard.current = true;
    try {
      const ok = await spendCoins(CARD_OPEN_COST, `card:${cardId}`);
      if (!ok) {
        setError(`Necesitas ${CARD_OPEN_COST} moneda${CARD_OPEN_COST === 1 ? "" : "s"} para responder.`);
        navigation.navigate("Paywall");
        return false;
      }
      chargeRegistered.current = true;
      return true;
    } catch (err: any) {
      console.error("[Practice] Error cobrando la card", err);
      setError(err?.message || "No se pudo cobrar la card");
      return false;
    } finally {
      chargingCard.current = false;
    }
  }, [cardId, coinsLoading, isUnlimited, navigation, spendCoins]);

  const speakSegments = useCallback(
    async (
      segments: (string | undefined | null)[],
      scope: string,
      language: string = "en-US",
    ) => {
      const filtered = segments
        .map((s) => (s || "").trim())
        .filter((s) => s.length > 0);
      if (!filtered.length) return;
      const speechText = filtered.join(". ");
      console.log(`[Practice] Reproduciendo ${scope}`, speechText);
      try {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            playThroughEarpieceAndroid: false,
            defaultToSpeaker: true,
          });
        } catch (audioErr) {
          console.warn(
            "[Practice] No se pudo configurar audio mode para speech",
            audioErr,
          );
        }
        Speech.stop();
        Speech.speak(speechText, { language, pitch: 1.05 });
      } catch (err: any) {
        console.warn("[Practice] Error al reproducir", err?.message || err);
      }
    },
    [],
  );

  const speakLabel = useCallback(() => {
    if (!label) return;
    void speakSegments([label, ...(examples || [])], "palabra");
  }, [label, examples, speakSegments]);

  // Press-and-hold: start on pressIn, stop & process on pressOut
  const run = async () => {
    if (!recordReady) {
      return;
    }
    if (coinsLoading) {
      setError("Cargando tus monedas...");
      return;
    }
    if (!isUnlimited) {
      const ok = await spendCoins(
        RECORDING_COST,
        cardId ? `practice-recording:${cardId}` : "practice-recording",
      );
      if (!ok) {
        setError("Necesitas 1 moneda para grabar.");
        navigation.navigate("Paywall");
        return;
      }
    }
    // Mantener el feedback y transcript actual visibles para evitar saltos de layout.
    setError(null);
    setState("recording");
    setCanRecord(false);
    stopRequestedWhileStarting.current = false;
    isStartingRecording.current = true;
    try {
      await recorder.start();
      isStartingRecording.current = false;
      if (stopRequestedWhileStarting.current) {
        stopRequestedWhileStarting.current = false;
        await onRelease(true);
      }
    } catch (err: any) {
      console.error(
        "[Practice] No se pudo iniciar la grabación",
        err?.message || err,
      );
      setError(err?.message || "No se pudo iniciar la grabación");
      setState("idle");
      stopRequestedWhileStarting.current = false;
      isStartingRecording.current = false;
    }
  };

  const onRelease = async (skipStartGuard = false) => {
    try {
      if (isStartingRecording.current && !skipStartGuard) {
        stopRequestedWhileStarting.current = true;
        setState("idle");
        return;
      }
      if (!recorder.isRecording()) {
        console.warn("[Practice] onRelease sin grabación activa");
        setState("idle");
        return;
      }
      const rec = await recorder.stop();
      console.log("Recorded", rec);

      setState("uploading");
      const startBody: any = {};
      if (cardId) startBody.cardId = cardId;
      if (storyId) {
        startBody.storyId = storyId;
        startBody.sceneIndex = sceneIndex ?? 0;
      }
      let started;
      try {
        started = await api.post<{ sessionId: string; uploadUrl: string }>(
          `/sessions/start`,
          startBody,
        );
      } catch (error) {
        console.error("Error starting session:", error);
        setState("idle");
        return;
      }
      try {
        // Important: content type must match the presigned URL (backend signs audio/mp4)
        await uploader.put(started.uploadUrl, { uri: rec.uri }, "audio/mp4");
      } catch (e: any) {
        console.error("Upload failed:", e);
        setError(e?.message || "Upload failed");
        setState("idle");
        return;
      }
      console.log("Uploaded");
      setState("transcribing");
      const tr = await api.post<{ transcript: string }>(
        `/sessions/${started.sessionId}/transcribe`,
      );
      const finalTranscript = tr.transcript;
      setTranscript(tr.transcript);

      setState("evaluating");
      const ev = await api.post<EvalRes>(
        `/sessions/${started.sessionId}/evaluate`,
        {
          transcript: finalTranscript,
          label,
          example: examples?.[0],
        },
      );
      console.log("Evaluation:", ev);
      setFeedback(ev);
      if (ev.result !== "correct") {
        setCanRecord(true);
      } else {
        setCanRecord(false);
      }

      if (cardId) {
        // Complete card and update points/streak server-side
        const combinedResult =
          selected && answer && selected === answer ? ev.result : "incorrect";
        const comp: any = await api.post(`/cards/${cardId}/complete`, {
          result: combinedResult,
          score: ev.score,
        });
        if (comp?.streak === 5) {
          // simple streak modal/alert
          console.log("Streak x5! Bonus awarded.");
        }
      }
      setState("done");
    } catch (e: any) {
      console.error("Error after release:", e);
      setError(e?.message || "Failed to process recording");
      setState("idle");
    }
  };

  const errorsList = useMemo(() => {
    if (!feedback) return [] as string[];
    const errs =
      (feedback.errors && feedback.errors.length
        ? feedback.errors
        : feedback.feedback.grammar) || [];
    return Array.isArray(errs)
      ? errs.filter(
          (e): e is string => typeof e === "string" && e.trim().length > 0,
        )
      : [];
  }, [feedback]);

  const improvementsList = useMemo(() => {
    if (!feedback) return [] as string[];
    const sugg =
      feedback.improvements && feedback.improvements.length
        ? feedback.improvements
        : feedback.suggestions || [];
    return Array.isArray(sugg)
      ? sugg.filter(
          (s): s is string => typeof s === "string" && s.trim().length > 0,
        )
      : [];
  }, [feedback]);

  const speakErrors = useCallback(() => {
    if (!errorsList.length) return;
    void speakSegments(errorsList, "feedback.errores", "es-ES");
  }, [errorsList, speakSegments]);

  const speakImprovements = useCallback(() => {
    if (!improvementsList.length) return;
    void speakSegments(improvementsList, "feedback.reformulaciones");
  }, [improvementsList, speakSegments]);

  const selectedPracticeItem = useMemo(() => {
    if (typeof label === "string" && label.trim().length > 0) {
      return label.trim();
    }
    const optionText =
      selected && options && typeof options[selected] === "string"
        ? options[selected].trim()
        : "";
    return optionText || "esta palabra";
  }, [label, options, selected]);

  const assistanceStoryId = useMemo(() => {
    if (typeof storyId === "string" && storyId.trim().length > 0) {
      return storyId.trim();
    }
    if (cardId) {
      return `practice-card-${String(cardId)}`;
    }
    return "practice-session";
  }, [cardId, storyId]);

  const assistanceSceneIndex = useMemo(() => {
    const rawIndex =
      typeof sceneIndex === "number" ? sceneIndex : Number(sceneIndex);
    if (!Number.isFinite(rawIndex)) return 0;
    return Math.max(0, Math.floor(rawIndex));
  }, [sceneIndex]);

  const assistanceMissionDefinition = useMemo(() => {
    return {
      missionId: cardId
        ? `practice-mission-${String(cardId)}`
        : "practice-mission",
      title:
        typeof label === "string" && label.trim().length > 0
          ? `Práctica de la palabra "${label.trim()}"`
          : "Práctica de vocabulario",
      sceneSummary:
        "Sesión de práctica para entender una palabra y usarla en contexto.",
      aiRole: "Tutor de inglés para práctica de tarjetas.",
      requirements: [
        {
          requirementId: "understand_word",
          text: `Entender el significado de "${selectedPracticeItem}".`,
        },
        {
          requirementId: "use_word_in_context",
          text: `Usar "${selectedPracticeItem}" en una oración natural.`,
        },
      ],
    };
  }, [cardId, label, selectedPracticeItem]);

  const assistanceStoryDefinition = useMemo(() => {
    return {
      storyId: assistanceStoryId,
      title: "Práctica de vocabulario",
      summary:
        "Sesión de práctica de cards para reforzar significado, uso y pronunciación.",
      level: "B1",
      missions: [assistanceMissionDefinition],
    };
  }, [assistanceMissionDefinition, assistanceStoryId]);

  const assistanceRequirements = useMemo(() => {
    return [
      {
        requirementId: "understand_word",
        text: `Entender el significado de "${selectedPracticeItem}".`,
        met: !!feedback,
      },
      {
        requirementId: "use_word_in_context",
        text: `Usar "${selectedPracticeItem}" en una oración natural.`,
        met: feedback?.result === "correct",
      },
    ];
  }, [feedback, selectedPracticeItem]);

  const assistanceHistory = useMemo(() => {
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];
    const trimmedTranscript = transcript.trim();
    if (trimmedTranscript) {
      history.push({
        role: "user",
        content: `Mi intento usando "${selectedPracticeItem}" fue: ${trimmedTranscript}`,
      });
    }
    if (errorsList.length) {
      history.push({
        role: "assistant",
        content: `Errores detectados: ${errorsList.join(" | ")}`,
      });
    }
    if (improvementsList.length) {
      history.push({
        role: "assistant",
        content: `Reformulaciones sugeridas: ${improvementsList.join(" | ")}`,
      });
    }
    return history;
  }, [errorsList, improvementsList, selectedPracticeItem, transcript]);

  const assistanceConversationFeedback = useMemo(() => {
    if (!feedback) return null;
    return {
      summary: `Resultado previo: ${feedback.result} (${feedback.score}/100).`,
      improvements: improvementsList.slice(0, 3),
    };
  }, [feedback, improvementsList]);

  const handleOpenAssistance = useCallback(() => {
    setAssistanceQuestion(
      `Puedes ayudarme a entender y usar la palabra "${selectedPracticeItem}"`,
    );
    setAssistanceAnswer("");
    setAssistanceError(null);
    setShowAssistanceModal(true);
  }, [selectedPracticeItem]);

  const handleRequestAssistance = useCallback(async () => {
    const trimmed = assistanceQuestion.trim();
    if (!trimmed) {
      setAssistanceError("Escribe tu pregunta.");
      return;
    }
    setAssistanceLoading(true);
    setAssistanceError(null);
    setAssistanceAnswer("");
    try {
      const rewardedOk = isUnlimited ? true : await showRewardedAssistanceAd();
      if (!rewardedOk) {
        setAssistanceError("Debes completar el anuncio para pedir asistencia.");
        return;
      }
      const payload = await api.post<StoryAssistanceResponse>(
        `/stories/${encodeURIComponent(assistanceStoryId)}/assist`,
        {
          sceneIndex: assistanceSceneIndex,
          question: trimmed,
          history: assistanceHistory,
          storyDefinition: assistanceStoryDefinition,
          missionDefinition: assistanceMissionDefinition,
          requirements: assistanceRequirements,
          conversationFeedback: assistanceConversationFeedback,
        },
      );
      setAssistanceAnswer(payload?.answer || "");
    } catch (err: any) {
      console.error("Practice assistance error", err);
      setAssistanceError(err?.message || "No pudimos obtener la asistencia.");
    } finally {
      setAssistanceLoading(false);
    }
  }, [
    assistanceConversationFeedback,
    assistanceHistory,
    assistanceMissionDefinition,
    assistanceQuestion,
    assistanceRequirements,
    assistanceSceneIndex,
    assistanceStoryDefinition,
    assistanceStoryId,
    isUnlimited,
  ]);

  const coinReady = isUnlimited || !cardId || chargeRegistered.current;
  const interactionReady =
    coinReady && ((!!selected && canRecord) || state === "recording");
  const recordingCoinLocked = !isUnlimited && balance < RECORDING_COST;
  const recordReady = interactionReady && !recordingCoinLocked;
  const cardStatusLabel = cardId ? CARD_STATUS_LABELS[statusFor(cardId)] : null;
  const practiceSubtitle = !coinReady
    ? coinsLoading
      ? "Cargando tus monedas..."
      : `Responder cuesta ${CARD_OPEN_COST} moneda${CARD_OPEN_COST === 1 ? "" : "s"}`
    : !selected
      ? "Selecciona una opción"
      : recordingCoinLocked
        ? "Necesitas 1 moneda para grabar"
      : recordReady
        ? "Listo para grabar"
        : canRecord
          ? "Prepara tu respuesta"
          : feedback?.result === "correct"
            ? "Práctica completada"
            : "Prepara tu respuesta";

  const flowState: StoryFlowState =
    state === "recording"
      ? "recording"
      : state === "uploading"
        ? "uploading"
        : state === "transcribing"
          ? "transcribing"
          : state === "evaluating"
            ? "evaluating"
            : "idle";

  const statusLabel =
    flowState === "recording"
      ? "Grabando..."
      : flowState === "uploading"
        ? "Subiendo audio..."
        : flowState === "transcribing"
          ? "Transcribiendo..."
          : flowState === "evaluating"
            ? "Evaluando..."
            : "";

  const practiceTourSteps = useMemo<PracticeTourStep[]>(() => {
    const steps: PracticeTourStep[] = [
      {
        key: "training-mode",
        ref: trainingCardRef,
        title: "Modo entrenamiento",
        description:
          "Aquí está la tarjeta que vas a practicar. Encontrarás ejemplos y puedes tocar en escuchar para oír su pronunciación.",
      },
    ];

    steps.push({
      key: "help-button",
      ref: helpButtonRef,
      title: "Botón de ayuda",
      description:
        "En cualquier momento que tengas una duda puedes consultar a Luvi.",
    });

    if (options) {
      steps.push({
        key: "definition-followup",
        ref: definitionCardRef,
        title: "Seguimiento de definición",
        description:
          "Elige la opción que concuerda con la definición para habilitar la práctica. Cuando selecciones la opción correcta, se te pedirá usar esta palabra en una oración y Luvi la evaluará.",
      });
    }

    return steps;
  }, [options]);

  const activePracticeTourStep = showPracticeTour
    ? practiceTourSteps[practiceTourStepIndex]
    : null;
  const isLastPracticeTourStep =
    practiceTourStepIndex >= practiceTourSteps.length - 1;

  useEffect(() => {
    let mounted = true;
    hasSeenTour("practice").then((seen) => {
      if (mounted && !seen) {
      setShowPracticeTour(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const measurePracticeTourTarget = useCallback(() => {
    if (!showPracticeTour) return;
    const step = practiceTourSteps[practiceTourStepIndex];
    if (!step) return;
    const target = step.ref.current;
    if (!target || !target.measureInWindow) return;
    target.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) return;
      setPracticeTourHighlight({ x, y, width, height });
    });
  }, [practiceTourStepIndex, practiceTourSteps, showPracticeTour]);

  useEffect(() => {
    if (!showPracticeTour) return;
    const stepKey = practiceTourSteps[practiceTourStepIndex]?.key;
    const timer = setTimeout(() => {
      if (stepKey === "definition-box" || stepKey === "definition-followup") {
        scrollRef.current?.scrollTo({ y: 340, animated: true });
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      measurePracticeTourTarget();
    }, 200);
    return () => clearTimeout(timer);
  }, [
    measurePracticeTourTarget,
    practiceTourStepIndex,
    practiceTourSteps,
    showPracticeTour,
  ]);

  const finishPracticeTour = useCallback(async () => {
    setShowPracticeTour(false);
    setPracticeTourHighlight(null);
    setPracticeTourStepIndex(0);
    await markTourAsSeen("practice");
  }, []);

  const handleAdvancePracticeTour = useCallback(async () => {
    if (!showPracticeTour) return;
    if (isLastPracticeTourStep) {
      await finishPracticeTour();
      return;
    }
    setPracticeTourStepIndex((prev) =>
      Math.min(prev + 1, practiceTourSteps.length - 1),
    );
  }, [
    finishPracticeTour,
    isLastPracticeTourStep,
    practiceTourSteps.length,
    showPracticeTour,
  ]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={state !== "recording"}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
              justifyContent: "space-between",
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderLeftWidth: 2,
                  borderBottomWidth: 2,
                  borderColor: COLORS.text,
                  transform: [{ rotate: "45deg" }],
                }}
              />
            </Pressable>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text
                style={{ color: COLORS.text, fontSize: 20, fontWeight: "800" }}
              >
                Sesión de práctica
              </Text>
              <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                Repite, graba y recibe feedback inmediato.
              </Text>
            </View>
            <View
              ref={helpButtonRef}
              collapsable={false}
              onLayout={measurePracticeTourTarget}
              style={{
                marginLeft: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Pressable
                hitSlop={12}
                onPress={handleOpenAssistance}
                accessibilityRole="button"
                accessibilityLabel="Abrir ayuda"
                style={({ pressed }) => ({
                  marginLeft: 6,
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.92 : 1,
                })}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 20,
                    lineHeight: 22,
                    fontWeight: "800",
                  }}
                >
                  ?
                </Text>
              </Pressable>
            </View>
          </View>

          <View
            ref={trainingCardRef}
            collapsable={false}
            onLayout={measurePracticeTourTarget}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: COLORS.border,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 240,
                height: 240,
                backgroundColor: "rgba(14, 165, 233, 0.18)",
                borderRadius: 240,
                top: -90,
                right: -80,
              }}
            />
            <View
              style={{
                position: "absolute",
                width: 180,
                height: 180,
                backgroundColor: "rgba(139, 92, 246, 0.14)",
                borderRadius: 180,
                bottom: -80,
                left: -60,
              }}
            />
            <Text
              style={{
                color: "#22d3ee",
                fontSize: 12,
                letterSpacing: 1,
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              Modo entrenamiento
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 24,
                fontWeight: "900",
                marginTop: 6,
              }}
            >
              {label ? label : "Práctica guiada"}
            </Text>
            {examples?.length ? (
              <View style={{ marginTop: 12 }}>
                {examples.map((ex: string, idx: number) => (
                  <Text
                    key={idx}
                    style={{
                      marginTop: idx === 0 ? 0 : 6,
                      color: COLORS.muted,
                      fontSize: 15,
                      lineHeight: 22,
                    }}
                  >
                    • {ex}
                  </Text>
                ))}
              </View>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: STATE_STYLES[state].border,
                  backgroundColor: STATE_STYLES[state].bg,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: STATE_STYLES[state].color,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    color: STATE_STYLES[state].color,
                    fontWeight: "700",
                  }}
                >
                  {STATE_LABELS[state]}
                </Text>
              </View>
              {cardStatusLabel ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: COLORS.success,
                    backgroundColor: "rgba(34, 197, 94, 0.16)",
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: COLORS.success, fontWeight: "700" }}>
                    Estado: {cardStatusLabel}
                  </Text>
                </View>
              ) : null}
              {label ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Pronunciar ${label}`}
                  onPress={speakLabel}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: pressed ? "#0ea5e933" : "#0ea5e91a",
                    borderWidth: 1,
                    borderColor: COLORS.accentStrong,
                    marginBottom: 8,
                  })}
                >
                  <Text style={{ color: COLORS.accent, fontWeight: "700" }}>
                    🔊 Escuchar
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          {options && (
            <View
              ref={definitionCardRef}
              collapsable={false}
              onLayout={measurePracticeTourTarget}
              style={{
                marginTop: 12,
                padding: 16,
                borderRadius: 16,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{ color: COLORS.text, fontWeight: "800", fontSize: 16 }}
              >
                ¿Cuál es la mejor definición?
              </Text>
              <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                Elige una opción para habilitar la práctica.
              </Text>
              {(["a", "b", "c"] as const).map((k) => {
                const isSelected = selected === k;
                const isCorrectChoice = isSelected && answer && k === answer;
                const isWrongChoice = isSelected && answer && k !== answer;
                return (
                  <Pressable
                    key={k}
                    onPress={async () => {
                      const charged = await ensureCardCharge();
                      if (!charged) return;
                      setError(null);
                      setSelected(k);
                      setCanRecord(true);
                    }}
                    style={({ pressed }) => ({
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isCorrectChoice
                        ? COLORS.success
                        : isWrongChoice
                          ? COLORS.error
                          : COLORS.border,
                      backgroundColor: isCorrectChoice
                        ? "rgba(34, 197, 94, 0.12)"
                        : isWrongChoice
                          ? "rgba(239, 68, 68, 0.12)"
                          : "#111827",
                      opacity: pressed ? 0.92 : 1,
                    })}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "flex-start" }}
                    >
                      <Text
                        style={{
                          color: COLORS.text,
                          fontWeight: "800",
                          marginRight: 10,
                          marginTop: 1,
                        }}
                      >
                        {k.toUpperCase()}.
                      </Text>
                      <Text
                        style={{
                          color: COLORS.muted,
                          fontSize: 15,
                          flex: 1,
                          lineHeight: 22,
                        }}
                      >
                        {options[k]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              {selected && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#0b1528",
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      color:
                        answer && selected === answer
                          ? COLORS.success
                          : COLORS.error,
                      fontWeight: "800",
                    }}
                  >
                    {answer && selected === answer
                      ? "¡Correcto!"
                      : "Incorrecto"}
                  </Text>
                  {explanation ? (
                    <Text
                      style={{
                        marginTop: 6,
                        color: COLORS.muted,
                        lineHeight: 20,
                      }}
                    >
                      {explanation}
                    </Text>
                  ) : null}
                  <Text
                    style={{
                      marginTop: 10,
                      fontWeight: "700",
                      color: COLORS.text,
                    }}
                  >
                    {prompt
                      ? `Úsalo en una oración, por ejemplo: ${prompt}`
                      : "¿Puedes usarlo en una oración?"}
                  </Text>
                </View>
              )}
            </View>
          )}
          {transcript ? (
            <View
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: 10,
                backgroundColor: "#0b1528",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Tu respuesta:
              </Text>
              <Text style={{ color: COLORS.text, marginTop: 4 }}>
                {transcript}
              </Text>
            </View>
          ) : null}
          {feedback && (
            <View
              style={{
                marginTop: 14,
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  marginBottom: 6,
                  color: COLORS.text,
                }}
              >
                {feedback.result === "correct" &&
                  "¡Excelente! Vas por muy buen camino."}
                {feedback.result === "partial" &&
                  "Buen intento. Aquí tienes algunas sugerencias:"}
                {feedback.result === "incorrect" &&
                  "Gracias por intentarlo. Probemos con estas mejoras:"}
              </Text>
              <View
                style={{
                  height: 10,
                  backgroundColor: "#0b1528",
                  borderRadius: 999,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <View
                  style={{
                    height: 10,
                    width: `${Math.max(0, Math.min(100, feedback.score))}%`,
                    backgroundColor:
                      feedback.score >= 85
                        ? COLORS.success
                        : feedback.score >= 60
                          ? COLORS.warning
                          : COLORS.error,
                  }}
                />
              </View>
              <Text style={{ marginTop: 6, color: COLORS.muted }}>
                Puntaje: {feedback.score}/100
              </Text>

              {errorsList.length ? (
                <View style={{ marginTop: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{ fontWeight: "700", flex: 1, color: COLORS.text }}
                    >
                      Detalles a mejorar
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Escuchar detalles a mejorar"
                      onPress={speakErrors}
                      style={({ pressed }) => ({
                        padding: 6,
                        borderRadius: 999,
                        backgroundColor: pressed ? "#3f1d2e" : "#2a1b2b",
                      })}
                    >
                      <Text style={{ fontSize: 18 }}>🔊</Text>
                    </Pressable>
                  </View>
                  {errorsList.map((e, i) => (
                    <Text
                      key={i}
                      style={{ color: COLORS.error, marginBottom: 4 }}
                    >
                      • {e}
                    </Text>
                  ))}
                </View>
              ) : null}

              {improvementsList.length ? (
                <View style={{ marginTop: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{ fontWeight: "700", flex: 1, color: COLORS.text }}
                    >
                      Reformulaciones más naturales
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Escuchar reformulaciones sugeridas"
                      onPress={speakImprovements}
                      style={({ pressed }) => ({
                        padding: 6,
                        borderRadius: 999,
                        backgroundColor: pressed ? "#0b2540" : "#0b1f35",
                      })}
                    >
                      <Text style={{ fontSize: 18 }}>🔊</Text>
                    </Pressable>
                  </View>
                  {improvementsList.map((s, i) => (
                    <Text
                      key={i}
                      style={{ marginBottom: 4, color: COLORS.text }}
                    >
                      • {s}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          )}
          {cardId && feedback?.result === "correct" ? (
            <View
              style={{
                marginTop: 14,
                padding: 18,
                borderRadius: 14,
                backgroundColor: "rgba(34, 197, 94, 0.12)",
                borderWidth: 1,
                borderColor: COLORS.success,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: COLORS.success,
                }}
              >
                ✅ ¡Lograste esta card!
              </Text>
              <Text style={{ color: COLORS.text, marginTop: 8 }}>
                Ahora decide si quieres seguir reforzándola o marcarla como
                aprendida.
              </Text>
              <Text
                style={{ marginTop: 12, color: COLORS.text, fontWeight: "700" }}
              >
                Estado actual: {CARD_STATUS_LABELS[statusFor(cardId)]}
              </Text>
              <CardStatusSelector
                cardId={String(cardId)}
                title="Actualiza tu progreso"
                allowedStatuses={["learning", "learned"]}
                style={{ marginTop: 12 }}
                onStatusChange={() => {
                  navigation.navigate("Deck");
                }}
              />
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 6 }}>
                Puedes volver a cambiarlo más adelante desde el deck.
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View
          style={
            {
              // borderTopWidth: 1,
              // borderTopColor: COLORS.border,
              // backgroundColor: COLORS.surface,
              // paddingHorizontal: 12,
              // paddingTop: 8,
              // paddingBottom: 8,
            }
          }
        >
          <StoryMessageComposer
            flowState={flowState}
            retryBlocked={!interactionReady}
            recordBlocked={!recordReady}
            statusLabel={statusLabel}
            onSendText={async (textToSend: string) => {
              const trimmed = textToSend.trim();
              if (!trimmed || !interactionReady) return false;
              try {
                const charged = await ensureCardCharge();
                if (!charged) {
                  return false;
                }
                setError(null);
                setState("evaluating");
                const started = await api.post<{
                  sessionId: string;
                  uploadUrl: string;
                }>(`/sessions/start`, {
                  cardId,
                  storyId,
                  sceneIndex,
                });
                setTranscript(trimmed);
                const ev = await api.post<EvalRes>(
                  `/sessions/${started.sessionId}/evaluate`,
                  {
                    transcript: trimmed,
                    label,
                    example: examples?.[0],
                  },
                );
                setFeedback(ev);
                if (cardId) {
                  const combinedResult =
                    selected && answer && selected === answer
                      ? ev.result
                      : "incorrect";
                  await api.post(`/cards/${cardId}/complete`, {
                    result: combinedResult,
                    score: ev.score,
                  });
                }
                setState("done");
                if (ev.result !== "correct") {
                  setCanRecord(true);
                } else {
                  setCanRecord(false);
                }
                return true;
              } catch (e: any) {
                console.error("Evaluate text error:", e);
                setError(e?.message || "No se pudo evaluar el texto");
                setState("idle");
                return false;
              }
            }}
            onRecordPressIn={run}
            onRecordRelease={onRelease}
          />
          {error ? (
            <Text style={{ marginTop: 6, color: COLORS.error }}>
              Error: {error}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
      <TourOverlay
        visible={showPracticeTour}
        highlight={practiceTourHighlight}
        title={activePracticeTourStep?.title ?? ""}
        description={activePracticeTourStep?.description ?? ""}
        onNext={handleAdvancePracticeTour}
        isLast={isLastPracticeTourStep}
      />
      <Modal
        animationType="fade"
        transparent
        visible={showAssistanceModal}
        onRequestClose={() => setShowAssistanceModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 12 : 0}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(4,7,17,0.75)",
              padding: 20,
            }}
            onPress={() => setShowAssistanceModal(false)}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            >
              <Pressable
                onPress={() => {}}
                style={{
                  backgroundColor: "white",
                  borderRadius: 18,
                  padding: 20,
                  shadowColor: "#0f172a",
                  shadowOpacity: 0.12,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <View style={{ alignItems: "flex-end" }}>
                  <Pressable
                    onPress={() => setShowAssistanceModal(false)}
                    hitSlop={12}
                    style={({ pressed }) => ({
                      padding: 4,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 20, color: "#0f172a" }}>✕</Text>
                  </Pressable>
                </View>
                <View style={{ alignItems: "center", marginBottom: 12 }}>
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      backgroundColor: "#0b1224",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={luviImage}
                      style={{ width: "90%", height: "90%" }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#0f172a",
                    }}
                  >
                    ¿Cómo puedo ayudarte?
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: "#475569",
                      textAlign: "center",
                    }}
                  >
                    Luvi puede ayudarte a entender y usar mejor esta palabra.
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#64748b",
                      textAlign: "center",
                    }}
                  >
                    Palabra seleccionada: {selectedPracticeItem}
                  </Text>
                </View>
                <TextInput
                  value={assistanceQuestion}
                  onChangeText={(text) => {
                    setAssistanceQuestion(text);
                    if (assistanceError) setAssistanceError(null);
                  }}
                  placeholder='Ejemplo: "No entiendo en qué contexto usar esta palabra."'
                  placeholderTextColor="#94a3b8"
                  multiline
                  style={{
                    minHeight: 90,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    backgroundColor: "#f8fafc",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: "#0f172a",
                  }}
                />
                {assistanceError ? (
                  <Text style={{ marginTop: 6, color: "#dc2626" }}>
                    {assistanceError}
                  </Text>
                ) : null}
                <Pressable
                  onPress={handleRequestAssistance}
                  disabled={assistanceLoading}
                  style={({ pressed }) => ({
                    marginTop: 12,
                    paddingVertical: 12,
                    borderRadius: 999,
                    alignItems: "center",
                    backgroundColor: assistanceLoading
                      ? "#cbd5f5"
                      : pressed
                        ? "#0b1224"
                        : "#2563eb",
                  })}
                >
                  {assistanceLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: "white", fontWeight: "700" }}>
                      Pedir asistencia
                    </Text>
                  )}
                </Pressable>
                {assistanceAnswer ? (
                  <View
                    style={{
                      marginTop: 14,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: "#f8fafc",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: "#0f172a",
                        marginBottom: 6,
                      }}
                    >
                      Sugerencia
                    </Text>
                    <Text style={{ color: "#0f172a", lineHeight: 20 }}>
                      {assistanceAnswer}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
