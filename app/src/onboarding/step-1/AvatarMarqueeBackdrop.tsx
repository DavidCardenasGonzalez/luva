import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, useWindowDimensions, View } from 'react-native';
import { ONBOARDING_AVATAR_IMAGES } from './onboardingAvatars';

const AVATAR_SIZE = 62;
const GAP = 14;
const CELL = AVATAR_SIZE + GAP;
const AVATARS_PER_ROW = 9;
const PIXELS_PER_SECOND = 16;

function rotate<T>(list: T[], offset: number) {
  if (!list.length) return list;
  const shift = ((offset % list.length) + list.length) % list.length;
  return [...list.slice(shift), ...list.slice(0, shift)];
}

function MarqueeRow({
  avatars,
  direction,
}: {
  avatars: string[];
  direction: 'left' | 'right';
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rowWidth = avatars.length * CELL;
  const doubled = useMemo(() => [...avatars, ...avatars], [avatars]);

  useEffect(() => {
    if (rowWidth <= 0) return undefined;
    const from = direction === 'left' ? 0 : -rowWidth;
    const to = direction === 'left' ? -rowWidth : 0;
    translateX.setValue(from);
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: to,
        duration: (rowWidth / PIXELS_PER_SECOND) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [direction, rowWidth, translateX]);

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        transform: [{ translateX }],
      }}
    >
      {doubled.map((uri, index) => (
        <View
          key={`${uri}-${index}`}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            marginRight: GAP,
            overflow: 'hidden',
            backgroundColor: '#13233f',
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.2)',
          }}
        >
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      ))}
    </Animated.View>
  );
}

export function AvatarMarqueeBackdrop() {
  const { height } = useWindowDimensions();
  const bandHeight = Math.min(height * 0.52, 430);

  const rows = useMemo(() => {
    const pool = ONBOARDING_AVATAR_IMAGES;
    if (!pool.length) return [];
    const rowCount = Math.max(3, Math.round(bandHeight / (AVATAR_SIZE + 18)));
    return Array.from({ length: rowCount }, (_, rowIndex) => {
      // Offset each row so columns never line up, and reverse alternating
      // rows so the drift feels organic instead of uniform.
      const rotated = rotate(pool, rowIndex * 4 + Math.floor(rowIndex / 2));
      const avatars = Array.from(
        { length: AVATARS_PER_ROW },
        (_, i) => rotated[(i * 2 + rowIndex) % rotated.length]
      );
      return {
        avatars,
        direction: (rowIndex % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
      };
    });
  }, [bandHeight]);

  if (!rows.length) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: bandHeight, overflow: 'hidden' }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'space-evenly',
          paddingVertical: 6,
          // Tilt the whole field slightly for a more dynamic, editorial feel.
          // The scale over-fills the band so the rotation leaves no empty corners.
          transform: [{ rotate: '-4deg' }, { scale: 1.2 }],
        }}
      >
        {rows.map((row, index) => (
          <MarqueeRow key={index} avatars={row.avatars} direction={row.direction} />
        ))}
      </View>

      {/* Dark scrim so the avatars read as a textured backdrop, not foreground. */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(7, 17, 31, 0.52)',
        }}
      />
      {/* Faux-gradient fade toward the bottom so the band melts into the page. */}
      {[0.18, 0.4, 0.64, 0.85, 1].map((opacity, index, list) => (
        <View
          key={opacity}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: (list.length - 1 - index) * (bandHeight * 0.13),
            height: bandHeight * 0.14,
            backgroundColor: `rgba(7, 17, 31, ${opacity})`,
          }}
        />
      ))}
      {/* Solid base to guarantee a clean seam with the rest of the screen. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -2,
          height: 4,
          backgroundColor: '#07111f',
        }}
      />
    </View>
  );
}
