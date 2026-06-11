import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AFFINITY_LEVELS, getAffinityProgress } from '../friends/affinity';
import type { FriendAffinityUpdate } from '../hooks/useFriends';

type AffinityBarVariant = 'dark' | 'light';

const VARIANT_COLORS: Record<
  AffinityBarVariant,
  { label: string; muted: string; track: string; fill: string; heart: string }
> = {
  dark: {
    label: '#e2e8f0',
    muted: '#94a3b8',
    track: '#1f2937',
    fill: '#f472b6',
    heart: '#f472b6',
  },
  light: {
    label: '#1e293b',
    muted: '#64748b',
    track: '#e2e8f0',
    fill: '#ec4899',
    heart: '#ec4899',
  },
};

export function AffinityBar({
  points,
  variant = 'dark',
}: {
  points?: number;
  variant?: AffinityBarVariant;
}) {
  const colors = VARIANT_COLORS[variant];
  const affinity = useMemo(() => getAffinityProgress(points), [points]);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="favorite" size={15} color={colors.heart} />
          <Text style={{ color: colors.label, fontWeight: '900', fontSize: 13, marginLeft: 6 }}>
            {affinity.levelName}
          </Text>
          <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, marginLeft: 6 }}>
            nivel {affinity.level}/{AFFINITY_LEVELS.length}
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12 }}>
          {affinity.isMaxLevel
            ? `${affinity.points} pts`
            : `${affinity.points} / ${affinity.nextLevelPoints} pts`}
        </Text>
      </View>
      <View
        style={{
          marginTop: 6,
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.track,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.round(affinity.progress * 100)}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: colors.fill,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Animated affinity gain shown right after receiving the conversation feedback:
 * the bar fills from the previous points to the new total and highlights level-ups.
 */
export function AffinityGainBar({
  affinity,
  variant = 'light',
}: {
  affinity: FriendAffinityUpdate;
  variant?: AffinityBarVariant;
}) {
  const colors = VARIANT_COLORS[variant];
  const finalProgress = useMemo(() => getAffinityProgress(affinity.totalPoints), [affinity.totalPoints]);
  const startProgress = useMemo(() => {
    // When the level changed, animate the final level's bar from its start.
    if (affinity.leveledUp) return 0;
    return getAffinityProgress(affinity.previousPoints).progress;
  }, [affinity.leveledUp, affinity.previousPoints]);

  const fillAnim = useRef(new Animated.Value(startProgress)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fillAnim.setValue(startProgress);
    badgeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(badgeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
      Animated.timing(fillAnim, {
        toValue: finalProgress.progress,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [badgeAnim, fillAnim, finalProgress.progress, startProgress]);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
          <MaterialIcons name="favorite" size={15} color={colors.heart} />
          <Text style={{ color: colors.label, fontWeight: '900', fontSize: 13, marginLeft: 6 }}>
            {finalProgress.levelName}
          </Text>
          <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, marginLeft: 6 }}>
            nivel {finalProgress.level}/{AFFINITY_LEVELS.length}
          </Text>
        </View>
        <Animated.View
          style={{
            opacity: badgeAnim,
            transform: [
              {
                scale: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
              },
            ],
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: variant === 'light' ? '#fce7f3' : 'rgba(244, 114, 182, 0.18)',
            borderWidth: 1,
            borderColor: variant === 'light' ? '#f9a8d4' : 'rgba(244, 114, 182, 0.45)',
          }}
        >
          <Text style={{ color: colors.fill, fontWeight: '900', fontSize: 12 }}>
            +{affinity.pointsEarned} afinidad
          </Text>
        </Animated.View>
      </View>
      <View
        style={{
          marginTop: 8,
          height: 10,
          borderRadius: 999,
          backgroundColor: colors.track,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            width: fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            height: '100%',
            borderRadius: 999,
            backgroundColor: colors.fill,
          }}
        />
      </View>
      <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 6 }}>
        {finalProgress.isMaxLevel
          ? `${finalProgress.points} pts — ¡nivel máximo!`
          : `${finalProgress.points} / ${finalProgress.nextLevelPoints} pts para el siguiente nivel`}
      </Text>
      {affinity.leveledUp ? (
        <Animated.View
          style={{
            opacity: badgeAnim,
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <MaterialIcons name="celebration" size={16} color={colors.fill} />
          <Text style={{ color: colors.label, fontWeight: '900', fontSize: 13, marginLeft: 6 }}>
            ¡Su amistad subió a {affinity.levelName}!
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
