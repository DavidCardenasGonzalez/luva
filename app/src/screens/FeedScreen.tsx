import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LearningItem, useLearningItems } from '../hooks/useLearningItems';
import { StoryMission, useStoryCatalog } from '../hooks/useStories';
import {
  CARD_STATUS_LABELS,
  CardProgressStatus,
  useCardProgress,
} from '../progress/CardProgressProvider';
import { useStoryProgress } from '../progress/StoryProgressProvider';
import { CARD_OPEN_COST, CHAT_MISSION_COST, useCoins } from '../purchases/CoinBalanceProvider';
import CoinCountChip from '../components/CoinCountChip';
import AppTabBar from '../components/AppTabBar';
import { getChatAvatar } from '../chatimages/chatAvatarMap';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

type PendingMission = {
  kind: 'mission';
  id: string;
  storyId: string;
  storyTitle: string;
  sceneIndex: number;
  mission: StoryMission;
};

type PendingVocab = LearningItem & {
  kind: 'vocab';
  feedId: string;
  status: CardProgressStatus;
};

type FeedItem = PendingMission | PendingVocab;

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  surfaceAlt: '#111827',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  accentStrong: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
};

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickRandom<T>(list: T[], count: number, seed: string, keyFor: (item: T) => string) {
  return [...list]
    .sort((a, b) => hashString(`${seed}:${keyFor(a)}`) - hashString(`${seed}:${keyFor(b)}`))
    .slice(0, count);
}

function buildFeedItems(missions: PendingMission[], vocabulary: PendingVocab[]) {
  const feed: FeedItem[] = [];
  const blocks = Math.max(missions.length, Math.ceil(vocabulary.length / 2));

  for (let index = 0; index < blocks; index += 1) {
    const mission = missions[index];
    if (mission) {
      feed.push(mission);
    }

    const firstVocab = vocabulary[index * 2];
    const secondVocab = vocabulary[index * 2 + 1];
    if (firstVocab) {
      feed.push(firstVocab);
    }
    if (secondVocab) {
      feed.push(secondVocab);
    }
  }

  return feed;
}

function MissionCard({
  item,
  onStart,
}: {
  item: PendingMission;
  onStart: (item: PendingMission) => void;
}) {
  const avatarImageUrl = item.mission.avatarImageUrl?.trim();
  const [allowMappedAvatarFallback, setAllowMappedAvatarFallback] = useState(false);

  useEffect(() => {
    setAllowMappedAvatarFallback(false);
    if (avatarImageUrl) return;
    const fallbackTimer = setTimeout(() => {
      setAllowMappedAvatarFallback(true);
    }, 300);
    return () => clearTimeout(fallbackTimer);
  }, [avatarImageUrl, item.mission.missionId]);

  const missionAvatar = useMemo<ImageSourcePropType | undefined>(() => {
    if (avatarImageUrl) {
      return { uri: avatarImageUrl };
    }
    if (!allowMappedAvatarFallback) {
      return undefined;
    }
    return getChatAvatar(item.mission.missionId);
  }, [allowMappedAvatarFallback, avatarImageUrl, item.mission.missionId]);

  const displayName = item.mission.caracterName || item.mission.title || 'Personaje';
  const avatarInitial = (displayName.trim().charAt(0) || '?').toUpperCase();
  const description = item.mission.sceneSummary || 'Habla con el personaje y completa los objetivos de la escena.';

  const visualContent = (
    <View style={{ flex: 1, justifyContent: 'space-between', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: 'rgba(11, 18, 36, 0.72)',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.22)',
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
            Misión
          </Text>
        </View>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            backgroundColor: 'rgba(11, 18, 36, 0.7)',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.24)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {missionAvatar ? (
            <Image source={missionAvatar} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900' }}>{avatarInitial}</Text>
          )}
        </View>
      </View>
      <View>
        <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text style={{ color: 'white', fontSize: 21, fontWeight: '900', marginTop: 4 }} numberOfLines={2}>
          {item.mission.title}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowRadius: 12,
      }}
    >
      <View style={{ aspectRatio: 1, backgroundColor: COLORS.surfaceAlt }}>
        {missionAvatar ? (
          <ImageBackground
            source={missionAvatar}
            style={{ flex: 1 }}
            imageStyle={{ resizeMode: 'cover' }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: 'rgba(11, 18, 36, 0.38)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 100,
                backgroundColor: 'rgba(11, 18, 36, 0.66)',
              }}
            />
            {visualContent}
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#0b172b' }}>{visualContent}</View>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ color: COLORS.muted, lineHeight: 20 }} numberOfLines={3}>
          {description}
        </Text>
        <Pressable
          onPress={() => onStart(item)}
          style={({ pressed }) => ({
            marginTop: 14,
            paddingVertical: 13,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: pressed ? '#1d4ed8' : COLORS.accentStrong,
            shadowColor: COLORS.accentStrong,
            shadowOpacity: 0.25,
            shadowRadius: 10,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '900' }}>Empezar misión</Text>
        </Pressable>
      </View>
    </View>
  );
}

function VocabularyCard({
  item,
  onListen,
  onMarkLearned,
  onPractice,
}: {
  item: PendingVocab;
  onListen: (item: PendingVocab) => void;
  onMarkLearned: (item: PendingVocab) => void;
  onPractice: (item: PendingVocab) => void;
}) {
  const example = item.examples?.[0] || item.prompt || 'Úsala en una oración natural.';

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
            Vocabulario
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: '900', marginTop: 5 }} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
        <Pressable
          onPress={() => onListen(item)}
          accessibilityRole="button"
          accessibilityLabel={`Escuchar ${item.label}`}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? '#0ea5e933' : '#0ea5e91f',
            borderWidth: 1,
            borderColor: '#0ea5e9',
            marginLeft: 12,
          })}
        >
          <MaterialIcons name="volume-up" size={23} color={COLORS.accent} />
        </Pressable>
      </View>

      <View
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 14,
          backgroundColor: '#0b172b',
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
          Ejemplo
        </Text>
        <Text style={{ color: COLORS.text, marginTop: 6, lineHeight: 21 }} numberOfLines={3}>
          {example}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 14 }}>
        <Pressable
          onPress={() => onMarkLearned(item)}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: pressed ? '#134e4a' : '#0f766e',
            marginRight: 8,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '900' }}>Ya me la sé</Text>
        </Pressable>
        <Pressable
          onPress={() => onPractice(item)}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: pressed ? '#1d4ed8' : COLORS.accentStrong,
            marginLeft: 8,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '900' }}>Practicar</Text>
        </Pressable>
      </View>

      <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 10 }}>
        Estado: {CARD_STATUS_LABELS[item.status]}
      </Text>
    </View>
  );
}

export default function FeedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items: learningItems } = useLearningItems();
  const { stories, loading: storiesLoading, error: storiesError } = useStoryCatalog();
  const {
    loading: cardProgressLoading,
    statusFor,
    statuses,
    setStatus,
  } = useCardProgress();
  const {
    loading: storyProgressLoading,
    isMissionCompleted,
    progress: storyProgress,
  } = useStoryProgress();
  const { canSpend, loading: coinsLoading, isUnlimited } = useCoins();
  const [feedSeed, setFeedSeed] = useState(() => `${Date.now()}:${Math.random()}`);

  useFocusEffect(
    useCallback(() => {
      setFeedSeed(`${Date.now()}:${Math.random()}`);
    }, [])
  );

  const pendingMissions = useMemo<PendingMission[]>(() => {
    return stories.flatMap((story) =>
      story.missions
        .map((mission, sceneIndex) => ({
          kind: 'mission' as const,
          id: `${story.storyId}:${mission.missionId}`,
          storyId: story.storyId,
          storyTitle: story.title,
          sceneIndex,
          mission,
        }))
        .filter((item) => !isMissionCompleted(item.storyId, item.mission.missionId))
    );
  }, [isMissionCompleted, stories, storyProgress]);

  const pendingVocabulary = useMemo<PendingVocab[]>(() => {
    return learningItems
      .map((item) => ({ ...item, kind: 'vocab' as const, feedId: `vocab:${item.id}`, status: statusFor(item.id) }))
      .filter((item) => item.status !== 'learned');
  }, [learningItems, statusFor, statuses]);

  const selectedMissions = useMemo(
    () => pickRandom(pendingMissions, 15, `${feedSeed}:missions`, (item) => item.id),
    [feedSeed, pendingMissions]
  );

  const selectedVocabulary = useMemo(
    () => pickRandom(pendingVocabulary, 30, `${feedSeed}:vocab`, (item) => item.feedId),
    [feedSeed, pendingVocabulary]
  );

  const feedItems = useMemo(
    () => buildFeedItems(selectedMissions, selectedVocabulary),
    [selectedMissions, selectedVocabulary]
  );

  const loading = storiesLoading || cardProgressLoading || storyProgressLoading;

  const speakVocabulary = useCallback(async (item: PendingVocab) => {
    const segments = [item.label, item.examples?.[0]].filter(
      (segment): segment is string => typeof segment === 'string' && segment.trim().length > 0
    );
    if (!segments.length) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      console.warn('[Feed] No se pudo configurar audio mode para speech', err);
    }
    Speech.stop();
    Speech.speak(segments.join('. '), { language: 'en-US', pitch: 1.05 });
  }, []);

  const handleMarkLearned = useCallback(
    (item: PendingVocab) => {
      void setStatus(String(item.id), 'learned');
    },
    [setStatus]
  );

  const handlePractice = useCallback(
    async (item: PendingVocab) => {
      if (!isUnlimited) {
        if (coinsLoading) return;
        const enough = await canSpend(CARD_OPEN_COST);
        if (!enough) {
          navigation.navigate('Paywall', { source: 'deck_card_unlock' });
          return;
        }
      }
      navigation.navigate('Practice', {
        cardId: String(item.id),
        label: item.label,
        examples: item.examples,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
        prompt: item.prompt,
      });
    },
    [canSpend, coinsLoading, isUnlimited, navigation]
  );

  const handleStartMission = useCallback(
    async (item: PendingMission) => {
      if (!isUnlimited) {
        if (coinsLoading) return;
        const enough = await canSpend(CHAT_MISSION_COST);
        if (!enough) {
          navigation.navigate('Paywall', { source: 'story_mission_unlock' });
          return;
        }
      }
      navigation.navigate('StoryScene', {
        storyId: item.storyId,
        sceneIndex: item.sceneIndex,
      });
    },
    [canSpend, coinsLoading, isUnlimited, navigation]
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList<FeedItem>
        data={feedItems}
        keyExtractor={(item) => (item.kind === 'mission' ? item.id : item.feedId)}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom + 108, 128),
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 58,
                position: 'relative',
              }}
            >
              <CoinCountChip style={{ position: 'absolute', left: 0, top: 6 }} />
              <Image
                source={require('../image/logo.png')}
                style={{ width: 180, height: 48, resizeMode: 'contain' }}
              />
              <Pressable
                onPress={() => navigation.navigate('Settings')}
                hitSlop={12}
                style={({ pressed }) => ({
                  position: 'absolute',
                  right: 0,
                  top: 7,
                  opacity: pressed ? 0.8 : 1,
                  padding: 6,
                })}
              >
                <MaterialIcons name="settings" size={26} color="#cbd5e1" />
              </Pressable>
            </View>

            {storiesError ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: '#3f1d2e',
                  borderWidth: 1,
                  borderColor: '#7f1d1d',
                }}
              >
                <Text style={{ color: '#fecdd3', fontWeight: '700' }}>{storiesError}</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'mission' ? (
            <MissionCard item={item} onStart={handleStartMission} />
          ) : (
            <VocabularyCard
              item={item}
              onListen={speakVocabulary}
              onMarkLearned={handleMarkLearned}
              onPractice={handlePractice}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={{ color: COLORS.muted, marginTop: 10 }}>Preparando tu feed...</Text>
            </View>
          ) : (
            <View
              style={{
                padding: 18,
                borderRadius: 16,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLORS.text, fontWeight: '900', textAlign: 'center' }}>
                No hay pendientes por ahora.
              </Text>
              <Text style={{ color: COLORS.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
                Cuando aparezcan nuevas tarjetas o misiones, las verás aquí.
              </Text>
            </View>
          )
        }
      />
      <AppTabBar active="feed" />
    </SafeAreaView>
  );
}
