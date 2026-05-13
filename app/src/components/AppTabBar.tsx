import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShadowingPlayer } from '../shadowing/ShadowingPlayerProvider';
import { trackMixpanelTabSelected } from '../marketing/mixpanelEvents';

type AppTabKey = 'home' | 'practice' | 'missions' | 'lessons' | 'journey' | 'shadowing' | 'feed' | 'friends';

type TabConfig = {
  key: AppTabKey;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  route: 'Deck' | 'Stories' | 'Lessons' | 'MyJourney' | 'Shadowing' | 'Feed' | 'Friends';
};

const TABS: TabConfig[] = [
  { key: 'feed', label: 'Feed', icon: 'rss-feed', route: 'Feed' },
  { key: 'journey', label: 'My Journey', icon: 'timeline', route: 'MyJourney' },
  { key: 'shadowing', label: 'Shadowing', icon: 'headphones', route: 'Shadowing' },
  { key: 'friends', label: 'Amigos', icon: 'people', route: 'Friends' },
];

function formatMiniPlayerTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export default function AppTabBar({
  active,
  showShadowingMiniPlayer = false,
  onShadowingMiniPlayerPress,
}: {
  active: AppTabKey;
  showShadowingMiniPlayer?: boolean;
  onShadowingMiniPlayerPress?: () => void;
}) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    currentChapter,
    positionSeconds,
    durationSeconds,
    isPlaying,
    audioLoading,
    playPause,
  } = useShadowingPlayer();
  const progressRatio = durationSeconds > 0 ? Math.min(1, positionSeconds / durationSeconds) : 0;
  const showMiniPlayer = (
    (active !== 'shadowing' || showShadowingMiniPlayer) &&
    Boolean(currentChapter) &&
    (isPlaying || audioLoading || positionSeconds > 0)
  );

  const navigateToTab = (tab: TabConfig) => {
    const state = navigation.getState?.();
    const currentRouteName = state?.routes?.[state.index]?.name;
    if (currentRouteName === tab.route) return;
    void trackMixpanelTabSelected({
      tabKey: tab.key,
      routeName: tab.route,
      previousRouteName: currentRouteName,
    });
    navigation.dispatch(StackActions.replace(tab.route));
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: 'rgba(11, 18, 36, 0.98)',
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
      }}
    >
      {showMiniPlayer ? (
        <Pressable
          onPress={onShadowingMiniPlayerPress || (() => navigation.navigate('Shadowing'))}
          accessibilityRole="button"
          accessibilityLabel="Abrir reproductor de Shadowing"
          style={({ pressed }) => ({
            minHeight: 52,
            marginBottom: 8,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(34, 211, 238, 0.32)',
            backgroundColor: pressed ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.96)',
            overflow: 'hidden',
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>
                Shadowing
              </Text>
              <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '900' }} numberOfLines={1}>
                {currentChapter?.title}
              </Text>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800' }}>
              {formatMiniPlayerTime(positionSeconds)}
            </Text>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                void playPause();
              }}
              disabled={audioLoading}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pausar Shadowing' : 'Reproducir Shadowing'}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
                opacity: audioLoading ? 0.55 : 1,
              })}
            >
              <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={24} color="white" />
            </Pressable>
          </View>
          <View style={{ height: 3, backgroundColor: '#111827' }}>
            <View
              style={{
                width: `${progressRatio * 100}%`,
                height: '100%',
                backgroundColor: '#22d3ee',
              }}
            />
          </View>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => navigateToTab(tab)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 54,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? 'rgba(34, 211, 238, 0.14)' : 'transparent',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isActive ? '#22d3ee' : '#94a3b8'}
              />
              <Text
                style={{
                  color: isActive ? '#e2e8f0' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: isActive ? '800' : '700',
                  marginTop: 3,
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
