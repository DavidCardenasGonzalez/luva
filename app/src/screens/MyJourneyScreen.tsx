import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import AppTabBar from '../components/AppTabBar';
import { GradientText } from '../onboarding/components/GradientText';
import {
  JOURNEY_TOTAL_LEVELS,
  JourneyObjective,
  JourneyProgressState,
  advanceJourneyLevel,
  buildJourneyObjectives,
  getJourneySnapshot,
} from '../progress/journeyProgress';
import { OnboardingPlanResponse, OnboardingTrainingFocusId } from '../onboarding/model/types';

const mountainBackground = require('../onboarding/step-6/mountain.png');

type Props = NativeStackScreenProps<RootStackParamList, 'MyJourney'>;
type ObjectiveRoute = 'Stories' | 'Shadowing' | 'Deck' | 'Lessons';

const COLORS = {
  background: '#020817',
  text: '#f8fafc',
  muted: '#cbd5e1',
  panel: 'rgba(8, 14, 33, 0.82)',
  panelStrong: 'rgba(11, 18, 36, 0.92)',
  border: 'rgba(139, 92, 246, 0.34)',
  track: 'rgba(73, 75, 112, 0.45)',
  purple: '#a855f7',
  blue: '#2aa8ff',
  green: '#8ee76b',
  gold: '#fbbf24',
};

const LEVEL_TITLES = [
  'Primeras conversaciones en inglés',
  'Frases útiles para tu día',
  'Confianza al responder',
  'Ritmo y pronunciación natural',
  'Conversaciones cotidianas',
  'Conversación en situaciones sociales',
  'Opiniones y experiencias',
  'Historias con más detalle',
  'Inglés para resolver problemas',
  'Conversaciones profesionales',
  'Fluidez en escenarios reales',
  'Comunicación avanzada',
];

const FOCUS_STYLE: Record<OnboardingTrainingFocusId, {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  bg: string;
  shadow: string;
}> = {
  aiConversation: {
    icon: 'chat-bubble',
    color: COLORS.purple,
    bg: 'rgba(126, 34, 206, 0.48)',
    shadow: '#a855f7',
  },
  shadowing: {
    icon: 'headphones',
    color: COLORS.blue,
    bg: 'rgba(14, 116, 144, 0.48)',
    shadow: '#38bdf8',
  },
  vocabulary: {
    icon: 'menu-book',
    color: COLORS.green,
    bg: 'rgba(63, 98, 18, 0.52)',
    shadow: '#84cc16',
  },
  structures: {
    icon: 'extension',
    color: COLORS.gold,
    bg: 'rgba(120, 72, 12, 0.54)',
    shadow: '#f59e0b',
  },
};

const PATH_MARKERS = [
  { level: 1, x: 44, y: 86 },
  { level: 2, x: 55, y: 76 },
  { level: 3, x: 45, y: 68 },
  { level: 4, x: 58, y: 59 },
  { level: 5, x: 47, y: 52 },
  { level: 6, x: 57, y: 45 },
  { level: 7, x: 49, y: 38 },
  { level: 8, x: 57, y: 32 },
  { level: 9, x: 52, y: 27 },
  { level: 10, x: 56, y: 23 },
  { level: 11, x: 54, y: 19 },
  { level: 12, x: 55, y: 15 },
];

const EMPTY_PROGRESS: JourneyProgressState = {
  version: 1,
  currentLevel: 1,
  pointsByFocus: {},
  aiConversationMessageBaselineCount: 0,
  vocabularyPracticeBaselineCount: 0,
  shadowingChapterBaselineIds: [],
  structuresLessonBaselineIds: [],
  updatedAt: new Date(0).toISOString(),
};

const OBJECTIVE_ROUTES: Record<OnboardingTrainingFocusId, ObjectiveRoute> = {
  aiConversation: 'Stories',
  shadowing: 'Shadowing',
  vocabulary: 'Deck',
  structures: 'Lessons',
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getLevelTitle(level: number) {
  return LEVEL_TITLES[clamp(level, 1, JOURNEY_TOTAL_LEVELS) - 1] || LEVEL_TITLES[0];
}

function ProgressBar({
  progress,
  color,
  height = 9,
  fill = false,
}: {
  progress: number;
  color: string;
  height?: number;
  fill?: boolean;
}) {
  const safeProgress = clamp(progress, 0, 100);
  return (
    <View style={[styles.progressTrack, { height }, fill ? styles.progressTrackFill : null]}>
      <View
        style={{
          width: `${safeProgress}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function PathMarkers({ currentLevel }: { currentLevel: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PATH_MARKERS.map((marker) => {
        const active = marker.level === currentLevel;
        const completed = marker.level < currentLevel;
        const size = active ? 62 : completed ? 38 : 32;
        const borderColor = active || completed ? '#f5d0fe' : 'rgba(226, 232, 240, 0.42)';
        const backgroundColor = active
          ? 'rgba(126, 34, 206, 0.94)'
          : completed
            ? 'rgba(126, 34, 206, 0.72)'
            : 'rgba(15, 23, 42, 0.58)';

        return (
          <View
            key={marker.level}
            style={{
              position: 'absolute',
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderRadius: size / 2,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: active ? 5 : 2,
              borderColor,
              backgroundColor,
              shadowColor: active || completed ? '#a855f7' : '#000000',
              shadowOpacity: active ? 0.86 : completed ? 0.42 : 0.18,
              shadowRadius: active ? 18 : 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Text
              style={{
                color: active || completed ? '#ffffff' : '#cbd5e1',
                fontSize: active ? 26 : 15,
                fontWeight: '900',
              }}
            >
              {marker.level}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ObjectiveRow({
  objective,
  compact,
  onPress,
}: {
  objective: JourneyObjective;
  compact: boolean;
  onPress: () => void;
}) {
  const meta = FOCUS_STYLE[objective.id];
  const progress = objective.targetPoints > 0
    ? (objective.currentPoints / objective.targetPoints) * 100
    : 0;

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Ir a ${objective.title}`}
        style={({ pressed }) => [
          styles.objectiveCompactContainer,
          styles.objectivePressable,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={styles.objectiveCompactTop}>
          <View style={[styles.objectiveIcon, { backgroundColor: meta.bg, shadowColor: meta.shadow }]}>
            <MaterialIcons name={meta.icon} size={30} color={meta.color} />
          </View>

          <View style={styles.objectiveMain}>
            <Text style={styles.objectiveTitle}>{objective.title}</Text>
            <View style={styles.objectiveProgressLine}>
              <ProgressBar progress={progress} color={meta.color} fill />
              <Text style={[styles.objectiveFraction, { color: meta.color }]}>
                {objective.currentValue} / {objective.targetValue}
              </Text>
            </View>
          </View>

          <MaterialIcons name="chevron-right" size={25} color="rgba(226, 232, 240, 0.72)" />
        </View>

      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ir a ${objective.title}`}
      style={({ pressed }) => [
        styles.objectiveRow,
        styles.objectivePressable,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.objectiveIcon, { backgroundColor: meta.bg, shadowColor: meta.shadow }]}>
        <MaterialIcons name={meta.icon} size={30} color={meta.color} />
      </View>

      <View style={styles.objectiveMain}>
        <Text style={styles.objectiveTitle}>{objective.title}</Text>
        <View style={styles.objectiveProgressLine}>
          <ProgressBar progress={progress} color={meta.color} fill />
          <Text style={[styles.objectiveFraction, { color: meta.color }]}>
            {objective.currentValue} / {objective.targetValue}
          </Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={25} color="rgba(226, 232, 240, 0.72)" />
    </Pressable>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <View style={styles.levelBadge}>
      <MaterialIcons name="star" size={23} color="#a855f7" style={styles.levelBadgeStar} />
      <Text style={styles.levelBadgeSmall}>Nivel</Text>
      <Text style={styles.levelBadgeNumber}>{level}</Text>
    </View>
  );
}

export default function MyJourneyScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [plan, setPlan] = useState<OnboardingPlanResponse | null>(null);
  const [progress, setProgress] = useState<JourneyProgressState>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);
  const compactRows = width < 410;
  const currentLevel = clamp(progress.currentLevel, 1, JOURNEY_TOTAL_LEVELS);
  const objectives = useMemo(() => buildJourneyObjectives(plan, progress), [plan, progress]);
  const canAdvanceLevel = currentLevel < JOURNEY_TOTAL_LEVELS &&
    objectives.length > 0 &&
    objectives.every((objective) => objective.currentPoints >= objective.targetPoints);
  const overallProgress = Math.round((currentLevel / JOURNEY_TOTAL_LEVELS) * 100);
  const heroHeight = width < 380 ? 470 : 500;
  const mountainWidth = Math.max(width * 1.38, 520);
  const mountainRight = width < 380 ? -150 : -130;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      getJourneySnapshot()
        .then((snapshot) => {
          if (!active) return;
          setPlan(snapshot.plan);
          setProgress(snapshot.progress);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, []),
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Feed');
  }, [navigation]);

  const handleInfo = useCallback(() => {
    Alert.alert(
      'My Journey',
      `Tu camino tiene ${JOURNEY_TOTAL_LEVELS} niveles. Estructuras clave se completa con lecciones: cada lección equivale a 3 puntos internos.`,
    );
  }, []);

  const handleAdvanceLevel = useCallback(async () => {
    const next = await advanceJourneyLevel(plan, progress);
    setProgress(next);
  }, [plan, progress]);

  const handleObjectivePress = useCallback((objectiveId: OnboardingTrainingFocusId) => {
    navigation.navigate(OBJECTIVE_ROUTES[objectiveId]);
  }, [navigation]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 138 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { minHeight: heroHeight }]}>
          <ImageBackground
            source={mountainBackground}
            resizeMode="cover"
            style={[
              styles.mountain,
              {
                width: mountainWidth,
                height: heroHeight + 90,
                right: mountainRight,
              },
            ]}
            imageStyle={{ opacity: 0.95 }}
          >
            <PathMarkers currentLevel={currentLevel} />
          </ImageBackground>
          <View style={styles.heroDarkLayer} />
          <View style={styles.heroBottomFade} />

          <View style={styles.heroHeader}>
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              style={({ pressed }) => [styles.circleButton, pressed ? styles.pressed : null]}
            >
              <MaterialIcons name="chevron-left" size={34} color="#ffffff" />
            </Pressable>
            <Pressable
              onPress={handleInfo}
              accessibilityRole="button"
              accessibilityLabel="Información de My Journey"
              style={({ pressed }) => [styles.circleButton, pressed ? styles.pressed : null]}
            >
              <MaterialIcons name="info-outline" size={25} color="#d8b4fe" />
            </Pressable>
          </View>

          <View style={styles.heroCopy}>
            <GradientText
              colors={['#a78bfa', '#c084fc', '#f0abfc']}
              style={styles.heroTitle}
            >
              Tu camino
            </GradientText>
            <Text style={styles.heroSubtitle}>
              Avanza completando objetivos y desbloquea nuevos niveles.
            </Text>
          </View>

          <View style={styles.overallCard}>
            <Text style={styles.cardLabel}>Progreso general</Text>
            <Text style={styles.overallPercent}>{loading ? '--' : overallProgress}%</Text>
            <ProgressBar progress={loading ? 0 : overallProgress} color="#a855f7" />
            <Text style={styles.levelLine}>Nivel {currentLevel} de {JOURNEY_TOTAL_LEVELS}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.levelCard}>
            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color="#a855f7" />
                <Text style={styles.loadingText}>Cargando tu camino...</Text>
              </View>
            ) : (
              <>
                <View style={styles.levelHeader}>
                  <LevelBadge level={currentLevel} />
                  <View style={styles.levelHeading}>
                    <Text style={styles.levelTitle}>{getLevelTitle(currentLevel)}</Text>
                    <Text style={styles.levelSubtitle}>
                      {plan?.recommendedStartingPoint || 'Completa tus objetivos para avanzar al siguiente nivel.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.objectiveList}>
                  {objectives.map((objective) => (
                    <ObjectiveRow
                      key={objective.id}
                      objective={objective}
                      compact={compactRows}
                      onPress={() => handleObjectivePress(objective.id)}
                    />
                  ))}
                </View>

                {canAdvanceLevel ? (
                  <Pressable
                    onPress={handleAdvanceLevel}
                    accessibilityRole="button"
                    accessibilityLabel="Subir de nivel"
                    style={({ pressed }) => [styles.advanceButton, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.advanceButtonText}>Subir de nivel</Text>
                    <MaterialIcons name="arrow-upward" size={21} color="#ffffff" />
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <AppTabBar active="journey" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  mountain: {
    position: 'absolute',
    top: -58,
  },
  heroDarkLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 8, 23, 0.24)',
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    backgroundColor: 'rgba(2, 8, 23, 0.66)',
  },
  heroHeader: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  circleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.36)',
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  pressed: {
    opacity: 0.78,
  },
  heroCopy: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 245,
    marginTop: 28,
  },
  heroTitle: {
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 10,
    fontWeight: '500',
  },
  overallCard: {
    position: 'absolute',
    left: 20,
    bottom: 24,
    zIndex: 2,
    width: 188,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panel,
    padding: 18,
  },
  cardLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  overallPercent: {
    color: '#ffffff',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    marginTop: 10,
  },
  progressTrack: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.track,
    overflow: 'hidden',
  },
  progressTrackFill: {
    flex: 1,
  },
  levelLine: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 11,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -4,
  },
  levelCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panelStrong,
    padding: 16,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  loadingState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  levelBadge: {
    width: 78,
    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    borderWidth: 3,
    borderColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 28, 135, 0.20)',
  },
  levelBadgeStar: {
    position: 'absolute',
    top: -16,
  },
  levelBadgeSmall: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  levelBadgeNumber: {
    color: '#ffffff',
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    marginTop: 2,
  },
  levelHeading: {
    flex: 1,
    minWidth: 0,
  },
  levelTitle: {
    color: COLORS.text,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },
  levelSubtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.26)',
    marginVertical: 18,
  },
  objectiveList: {
    gap: 18,
  },
  advanceButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    shadowColor: '#a855f7',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  advanceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  objectiveCompactContainer: {
    gap: 8,
  },
  objectivePressable: {
    borderRadius: 18,
    padding: 6,
    margin: -6,
  },
  objectiveCompactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  objectiveIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    flexShrink: 0,
  },
  objectiveMain: {
    flex: 1,
    minWidth: 0,
  },
  objectiveTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  objectiveProgressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  objectiveFraction: {
    width: 92,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
});
