import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../auth/AuthProvider';
import { useLearningItems } from '../hooks/useLearningItems';
import { useStories } from '../hooks/useStories';
import {
  CARD_STATUS_LABELS,
  CardProgressStatus,
  useCardProgress,
} from '../progress/CardProgressProvider';
import { useStoryProgress } from '../progress/StoryProgressProvider';
import CoinCountChip from '../components/CoinCountChip';
import { useRevenueCat } from '../purchases/RevenueCatProvider';
import TourOverlay, { TourHighlight } from '../components/TourOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const STATUS_ORDER: CardProgressStatus[] = ['learned', 'learning', 'todo'];
const STATUS_COLORS: Record<CardProgressStatus, string> = {
  learned: '#22c55e',
  learning: '#0ea5e9',
  todo: '#f59e0b',
};
const HOME_TOUR_STORAGE_KEY = 'luva_home_tour_seen_v1';

export default function HomeScreen({ navigation }: Props) {
  const { isSignedIn, signIn, signOut } = useAuth();
  const { items } = useLearningItems();
  const { items: stories } = useStories();
  const { loading: cardLoading, statusFor, statuses } = useCardProgress();
  const { loading: storyLoading, completedCountFor } = useStoryProgress();
  const { isPro, loading: rcLoading } = useRevenueCat();
  const progressHighlightRef = useRef<View>(null);
  const deckButtonRef = useRef<View>(null);
  const storiesButtonRef = useRef<View>(null);
  const [showHomeTour, setShowHomeTour] = useState(false);
  const [tourHighlight, setTourHighlight] = useState<TourHighlight | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const tourSteps = useMemo(
    () => [
      {
        key: 'progress',
        ref: progressHighlightRef,
        title: 'Avance total',
        description: 'Aquí puedes ver tu progreso combinado de tarjetas aprendidas y misiones completadas. Sube el porcentaje para desbloquear recompensas.',
      },
      {
        key: 'deck',
        ref: deckButtonRef,
        title: 'Tarjetas y práctica',
        description: 'Aquí encontrarás todo el vocabulario que debes aprender para llegar a nivel avanzado.',
      },
      {
        key: 'stories',
        ref: storiesButtonRef,
        title: 'Historias (Misión narrativa)',
        description: 'Aquí podrás conversar con nuestros personajes de IA y recibir feedback inmediato mientras completas misiones.',
      },
    ],
    []
  );
  const activeTourStep = showHomeTour ? tourSteps[tourStepIndex] : null;
  const isLastTourStep = tourStepIndex >= tourSteps.length - 1;

  const { totalCards, learnedCards, counts, percentages } = useMemo(() => {
    const totals: Record<CardProgressStatus, number> = { todo: 0, learning: 0, learned: 0 };
    for (const item of items) {
      totals[statusFor(item.id)] += 1;
    }
    const total = items.length || 1;
    const pct: Record<CardProgressStatus, number> = {
      todo: Math.round((totals.todo / total) * 100),
      learning: Math.round((totals.learning / total) * 100),
      learned: Math.round((totals.learned / total) * 100),
    };
    return { totalCards: items.length, learnedCards: totals.learned, counts: totals, percentages: pct };
  }, [items, statuses, statusFor]);

  const { totalMissions, completedMissions } = useMemo(() => {
    const totals = stories.reduce(
      (acc, story) => {
        const missions = story.missionsCount || 0;
        const completed = Math.min(completedCountFor(story.storyId), missions);
        acc.total += missions;
        acc.completed += completed;
        return acc;
      },
      { total: 0, completed: 0 }
    );
    return { totalMissions: totals.total, completedMissions: totals.completed };
  }, [stories, completedCountFor]);

  const totalWeighted = totalCards + totalMissions * 2;
  const completedWeighted = learnedCards + completedMissions * 2;
  const overallProgress = totalWeighted > 0 ? Math.round((completedWeighted / totalWeighted) * 100) : 0;
  const isLoading = cardLoading || storyLoading;
  const missionsProgress = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
  const remainingCards = Math.max(totalCards - learnedCards, 0);
  const remainingMissions = Math.max(totalMissions - completedMissions, 0);

  useEffect(() => {
    AsyncStorage.getItem(HOME_TOUR_STORAGE_KEY).then((value) => {
      if (!value || true) {
        setShowHomeTour(true);
      }
    });
  }, []);

  const measureTourTarget = useCallback(() => {
    if (!showHomeTour) return;
    const step = tourSteps[tourStepIndex];
    if (!step) return;
    const node = step.ref.current;
    if (!node || !node.measureInWindow) return;
    node.measureInWindow((x, y, width, height) => {
      setTourHighlight({ x, y, width, height });
    });
  }, [showHomeTour, tourStepIndex, tourSteps]);

  useEffect(() => {
    if (!showHomeTour) return;
    const timer = setTimeout(measureTourTarget, 200);
    return () => clearTimeout(timer);
  }, [measureTourTarget, showHomeTour, overallProgress, isLoading, tourStepIndex]);

  const dismissTour = useCallback(async () => {
    setShowHomeTour(false);
    setTourHighlight(null);
    setTourStepIndex(0);
    try {
      await AsyncStorage.setItem(HOME_TOUR_STORAGE_KEY, 'seen');
    } catch {
      // ignore
    }
  }, []);

  const handleAdvanceTour = useCallback(async () => {
    if (!showHomeTour) return;
    if (isLastTourStep) {
      await dismissTour();
      return;
    }
    setTourHighlight(null);
    setTourStepIndex((prev) => Math.min(prev + 1, tourSteps.length - 1));
  }, [dismissTour, isLastTourStep, showHomeTour, tourSteps.length]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#0b1224' }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260, backgroundColor: '#0b1224' }} />

      <View style={{ alignItems: 'center', marginBottom: 16, position: 'relative' }}>
        <Image
          source={require('../image/logo.png')}
          style={{ width: 260, height: 60, resizeMode: 'contain' }}
        />
        <CoinCountChip style={{ position: 'absolute', left: 0, top: 6 }} />
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          hitSlop={12}
          style={({ pressed }) => ({
            position: 'absolute',
            right: 0,
            top: 6,
            opacity: pressed ? 0.8 : 1,
            padding: 6,
          })}
        >
          <MaterialIcons name="settings" size={26} color="#cbd5e1" />
        </Pressable>
      </View>

      <View style={{ borderRadius: 24, overflow: 'hidden', padding: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1f2937', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 14 }}>
        <View style={{ position: 'absolute', width: 200, height: 200, backgroundColor: '#0ea5e933', borderRadius: 200, top: -60, right: -60 }} />
        <View style={{ position: 'absolute', width: 160, height: 160, backgroundColor: '#22c55e22', borderRadius: 200, bottom: -50, left: -40 }} />
        <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>Panel de avance</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 26, fontWeight: '800', marginTop: 6 }}>Sigue impulsando tu avance</Text>
        <Text style={{ color: '#94a3b8', marginTop: 8, lineHeight: 20 }}>
          Visualiza tu progreso combinado de tarjetas aprendidas y misiones completadas.
        </Text>
        {!isPro ? (
          <Pressable
            disabled={rcLoading}
            onPress={() => navigation.navigate('Paywall')}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              marginTop: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: rcLoading ? '#1f2937' : pressed ? '#0f766e' : '#0d9488',
              shadowColor: '#0d9488',
              shadowOpacity: 0.25,
              shadowRadius: 10,
            })}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>
              {rcLoading ? 'Cargando...' : 'Hazte Pro · monedas ilimitadas'}
            </Text>
          </Pressable>
        ) : (
          <Text style={{ color: '#22c55e', marginTop: 10, fontWeight: '700' }}>Modo Pro activo</Text>
        )}

        <View style={{ marginTop: 16, backgroundColor: '#0b172b', borderColor: '#1f2937', borderWidth: 1, padding: 16, borderRadius: 16 }}>
          <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700' }}>Avance total</Text>
          <View
            ref={progressHighlightRef}
            collapsable={false}
            onLayout={measureTourTarget}
            style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}
          >
            <Text style={{ color: '#e2e8f0', fontSize: 36, fontWeight: '900' }}>
              {isLoading ? '--' : `${overallProgress}%`}
            </Text>
            <Text style={{ color: '#94a3b8', marginLeft: 8, marginBottom: 6, fontWeight: '600' }}>completado</Text>
          </View>
          <View style={{ marginTop: 10, height: 12, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden' }}>
            <View style={{ width: isLoading ? '0%' : `${overallProgress}%`, backgroundColor: '#22d3ee', height: '100%' }} />
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', flex: 1, marginRight: 8 }}>
              <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '700' }}>Tarjetas</Text>
              <Text style={{ color: '#e2e8f0', marginTop: 4, fontWeight: '800' }}>{learnedCards}/{totalCards}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Aprendidas</Text>
            </View>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', flex: 1, marginLeft: 8 }}>
              <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '700' }}>Misiones</Text>
              <Text style={{ color: '#e2e8f0', marginTop: 4, fontWeight: '800' }}>{completedMissions}/{totalMissions}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Completadas</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <Pressable
            ref={deckButtonRef}
            collapsable={false}
            onLayout={measureTourTarget}
            onPress={() => navigation.navigate('Deck')}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              shadowColor: '#2563eb',
              shadowOpacity: 0.3,
              shadowRadius: 10,
              marginRight: 10,
            })}
          >
            <Text style={{ color: 'white', fontWeight: '800', letterSpacing: 0.3 }}>Tarjetas</Text>
            <Text style={{ color: '#e0f2fe', fontSize: 12, marginTop: 2 }}>Reanudar práctica</Text>
          </Pressable>
          <Pressable
            ref={storiesButtonRef}
            collapsable={false}
            onLayout={measureTourTarget}
            onPress={() => navigation.navigate('Stories')}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? '#0f766e' : '#0d9488',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: 'white', fontWeight: '800', letterSpacing: 0.3 }}>Historias</Text>
            <Text style={{ color: '#ccfbf1', fontSize: 12, marginTop: 2 }}>Misión narrativa</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 20, backgroundColor: '#f8fafc', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
        <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Progreso de tarjetas</Text>
        <Text style={{ color: '#475569', marginTop: 4 }}>Has tocado {totalCards} tarjetas. Sigue equilibrando para llegar a la meta.</Text>

        <View style={{ marginTop: 12, height: 14, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#e2e8f0' }}>
          {STATUS_ORDER.map((status) => (
            <View
              key={status}
              style={{
                flexGrow: percentages[status],
                flexBasis: `${percentages[status]}%`,
                backgroundColor: STATUS_COLORS[status],
              }}
            />
          ))}
        </View>

        <View style={{ marginTop: 12 }}>
          {STATUS_ORDER.map((status) => (
            <View
              key={status}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: STATUS_COLORS[status],
                  marginRight: 8,
                }}
              />
              <Text style={{ flex: 1, color: '#0f172a', fontWeight: '600' }}>{CARD_STATUS_LABELS[status]}</Text>
              <Text style={{ color: '#475569', fontSize: 12 }}>
                {percentages[status]}% · {counts[status]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, marginRight: 10 }}>
          <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15 }}>Misiones narrativas</Text>
          <Text style={{ color: '#475569', marginTop: 6 }}>Completa escenas para empujar el avance combinado.</Text>
          <View style={{ marginTop: 12, height: 10, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
            <View style={{ width: `${missionsProgress}%`, backgroundColor: '#0ea5e9', height: '100%' }} />
          </View>
          <Text style={{ color: '#475569', marginTop: 8, fontSize: 12 }}>
            {completedMissions} de {totalMissions || 0} misiones completas
          </Text>
          <Text style={{ color: '#0f172a', fontSize: 12, marginTop: 4, fontWeight: '700' }}>
            {remainingMissions > 0
              ? `Faltan ${remainingMissions} misión${remainingMissions === 1 ? '' : 'es'}.`
              : 'Sin misiones pendientes.'}
          </Text>
        </View>

        <View style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10 }}>
          <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 15 }}>Detalle rápido</Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 18 }}>
            Prioriza misiones o termina {remainingCards > 0 ? `${remainingCards} tarjeta${remainingCards === 1 ? '' : 's'} pendientes` : 'las tarjetas de repaso'} para subir el porcentaje.
          </Text>
          <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}>
            <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '700' }}>Tarjetas aprendidas</Text>
            <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{learnedCards}/{totalCards}</Text>
            <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '700', marginTop: 10 }}>Misiones completadas</Text>
            <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{completedMissions}/{totalMissions || 0}</Text>
          </View>
        </View>
      </View>
      </ScrollView>

      <TourOverlay
        visible={showHomeTour}
        highlight={tourHighlight}
        title={activeTourStep?.title ?? ''}
        description={activeTourStep?.description ?? ''}
        onNext={handleAdvanceTour}
        isLast={isLastTourStep}
      />
    </SafeAreaView>
  );
}
