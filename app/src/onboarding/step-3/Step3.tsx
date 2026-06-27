import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { OnboardingStepContent } from '../model/types';
import { GradientText } from '../components/GradientText';

const previewGif = require('./video.gif');
const zoeImage = require('./Zoe.png');
const mateoImage = require('./Mateo.png');

const COLORS = {
  text: '#f8fafc',
  muted: '#a7b0c2',
  cyan: '#22d3ee',
  purple: '#a855f7',
  button: '#7c3aed',
  buttonPressed: '#6d28d9',
};

type Props = {
  content: OnboardingStepContent;
  onStart: () => void;
  onSkip: () => void;
};

type SidePreviewProps = {
  image: ImageSourcePropType;
  side: 'left' | 'right';
  width: number;
  height: number;
};

function SidePreviewCard({ image, side, width, height }: SidePreviewProps) {
  const cardWidth = width * 0.7;
  const cardHeight = Math.min(height * 0.58, cardWidth * 1.45);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: height * 0.32,
        [side]: -width * 0.22,
        width: cardWidth,
        height: cardHeight,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.24)',
        opacity: 0.42,
        transform: [{ rotate: side === 'left' ? '-10deg' : '10deg' }],
      }}
    >
      <Image
        source={image}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.48)',
        }}
      />
    </View>
  );
}

export default function Step3({ content, onStart, onSkip: _onSkip }: Props) {
  const { height, width } = useWindowDimensions();
  const isCompact = height < 860 || width < 380;
  const titleSize = isCompact ? 30 : 36;
  const titleLineHeight = isCompact ? 35 : 41;
  const previewWidth = Math.min(width - 102, isCompact ? 196 : 238);
  const previewHeight = previewWidth * (649 / 300);
  const titleWords = content.title.trim().split(/\s+/);
  const titleFirstLine = titleWords.slice(0, 2).join(' ') || content.title;
  const titleHighlight = titleWords.slice(2).join(' ');
  const subtitle = content.subtitle.trim();
  const subtitleParts = subtitle.split(/(characters|reply|personajes|responde)/i);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: isCompact ? 4 : 10,
        paddingBottom: 8,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: 'center', width: '100%' }}>
        {/* <MaterialIcons name="auto-awesome" size={24} color={COLORS.purple} /> */}

        <Text
          style={{
            color: COLORS.text,
            fontSize: titleSize,
            fontWeight: '900',
            lineHeight: titleLineHeight,
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          {titleFirstLine}
        </Text>
        {titleHighlight ? (
          <GradientText
            style={{
              fontSize: titleSize,
              fontWeight: '900',
              lineHeight: titleLineHeight,
              textAlign: 'center',
            }}
          >
            {titleHighlight}
          </GradientText>
        ) : null}
      </View>

      <View
        style={{
          width: '100%',
          height: previewHeight + 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: isCompact ? 6 : 10,
        }}
      >
        <SidePreviewCard
          image={mateoImage}
          side="left"
          width={width}
          height={previewHeight}
        />
        <SidePreviewCard
          image={zoeImage}
          side="right"
          width={width}
          height={previewHeight}
        />

        <View
          style={{
            width: previewWidth,
            height: previewHeight,
            borderRadius: 25,
            overflow: 'hidden',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderWidth: 2,
            borderColor: COLORS.purple,
            shadowColor: COLORS.purple,
            shadowOpacity: 0.45,
            shadowRadius: 18,
          }}
        >
          <Image source={previewGif} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginTop: isCompact ? 10 : 14,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: COLORS.purple,
          }}
        >
          <MaterialIcons name="auto-awesome" size={16} color={COLORS.purple} />
        </View>
        <Text style={{ color: COLORS.muted, fontSize: 15, fontWeight: '800' }}>
          {subtitleParts.map((part, index) => {
            const normalized = part.toLowerCase();
            const color =
              normalized === 'characters' || normalized === 'personajes'
                ? COLORS.purple
                : normalized === 'reply' || normalized === 'responde'
                  ? COLORS.cyan
                  : COLORS.muted;
            return (
              <Text key={`${part}-${index}`} style={{ color, fontWeight: '800' }}>
                {part}
              </Text>
            );
          })}
        </Text>
      </View>

      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel={content.primaryCta}
        style={({ pressed }) => ({
          width: '100%',
          minHeight: 58,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: pressed ? COLORS.buttonPressed : COLORS.button,
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <Text style={{ color: '#ffffff', fontSize: 23, fontWeight: '900' }}>{content.primaryCta}</Text>
      </Pressable>
    </ScrollView>
  );
}
