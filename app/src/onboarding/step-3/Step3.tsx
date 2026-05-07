import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { OnboardingCharacterId, OnboardingStepContent } from '../model/types';
import { GradientText } from '../components/GradientText';

// Replace with actual CloudFront URL when assets are ready
// const CHARACTERS_VIDEO_URL = 'https://d2ozl81tz5pxlo.cloudfront.net/feedPostVideos/20260505001422-6018cb09-1e65-4c11-814c-3192637e8558.mp4';
const CHARACTERS_VIDEO_URL = 'https://d2ozl81tz5pxlo.cloudfront.net/feedPostVideos/20260506005036-c0d8c3bf-d4a8-4829-8f9d-fc2c1bab65b5.mp4';
const CHARACTERS_VIDEO_SOURCE = { uri: CHARACTERS_VIDEO_URL };

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  card: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
};

const CHARACTERS = [
  {
    id: 'zoe' as OnboardingCharacterId,
    name: 'Zoe',
    age: '25 años',
    traits: 'Creativa • Lifestyle • Emociones',
    description: 'Amigable, positiva y divertida.',
    catchphrase: 'Puedes hablarme de tus emociones y me encantará escuchar.',
    color: '#a855f7',
    avatarBg: 'rgba(109, 40, 217, 0.45)',
    cardBg: 'rgba(109, 40, 217, 0.08)',
    image: require('./Zoe.png'),
    speechHeadline: '¡Elígeme!',
    speechBody: 'Haré que hablar\ninglés sea\ndivertido 😎',
  },
  {
    id: 'mateo' as OnboardingCharacterId,
    name: 'Mateo',
    age: '32 años',
    traits: 'Música • Viajes • Fitness',
    description: 'Motivador, paciente y claro.',
    catchphrase: 'Tengo miles de historias para contarte, cuéntame las tuyas.',
    color: '#22d3ee',
    avatarBg: 'rgba(6, 79, 105, 0.42)',
    cardBg: 'rgba(25, 85, 106, 0.23)',
    image: require('./Mateo.png'),
    speechHeadline: '¡Elígeme a mí!',
    speechBody: 'Juntos llevaremos\ntu inglés al\nsiguiente nivel. 💪',
  },
] as const;

const FILL: object = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

type Props = {
  content: OnboardingStepContent;
  selectedCharacter: OnboardingCharacterId | null;
  onSelectCharacter: (characterId: OnboardingCharacterId) => void;
};

export default function Step3({ content: _content, selectedCharacter, onSelectCharacter }: Props) {
  const { width } = useWindowDimensions();
  const videoRef = useRef<Video>(null);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);
  const isCompactPhone = width < 400;

  async function handlePlayVideo() {
    setHasVideoStarted(true);
    await videoRef.current?.playAsync();
  }

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      setHasVideoStarted(false);
      void videoRef.current?.setPositionAsync(0);
    }
  }, []);

  useEffect(() => {
    return () => {
      void videoRef.current?.unloadAsync().catch(() => {
        // Best effort cleanup on unmount.
      });
    };
  }, []);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text
        style={{
          color: COLORS.text,
          fontSize: 34,
          fontWeight: '900',
          lineHeight: 40,
          marginBottom: 10,
        }}
      >
        {'Elige a tu\n'}
        <GradientText style={{ fontSize: 34, fontWeight: '900', lineHeight: 40 }}>
          compañero
        </GradientText>
        {isCompactPhone ? '' : ' de inglés'}
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 16,
          lineHeight: 22,
          marginBottom: 20,
        }}
      >
        {'Practicarás conversaciones reales y mejorarás hablando con tu nuevo '}
        <Text style={{ color: COLORS.cyan }}>amigo de IA.</Text>
      </Text>

      {/* Video card */}
      <View
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          height: 240,
          marginBottom: 18,
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <Video
          ref={videoRef}
          style={FILL}
          source={CHARACTERS_VIDEO_SOURCE}
          resizeMode={ResizeMode.COVER}
          useNativeControls={hasVideoStarted}
          progressUpdateIntervalMillis={500}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Play button */}
        {!hasVideoStarted && (
          <View
            style={{
              ...(FILL as any),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(7, 17, 31, 0.16)',
            }}
          >
            <Pressable
              onPress={handlePlayVideo}
              accessibilityRole="button"
              accessibilityLabel="Ver video de personajes"
              style={({ pressed }) => ({
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: 'rgba(34, 211, 238, 0.88)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <MaterialIcons
                name="play-arrow"
                size={36}
                color="#07111f"
                style={{ marginLeft: 4 }}
              />
            </Pressable>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 13,
                fontWeight: '700',
                marginTop: 8,
              }}
            >
              Ver video
            </Text>
          </View>
        )}
      </View>

      {/* Hint text */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <MaterialIcons name="auto-awesome" size={13} color={COLORS.cyan} />
        <Text style={{ color: COLORS.muted, fontSize: 13 }}>
          Conócelos y elige con quién quieres practicar.
        </Text>
        <MaterialIcons name="auto-awesome" size={13} color={COLORS.cyan} />
      </View>

      {/* Character selection cards */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {CHARACTERS.map((character) => {
          const isSelected = selectedCharacter === character.id;
          return (
            <Pressable
              key={character.id}
              onPress={() => {
                onSelectCharacter(character.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Elegir a ${character.name}`}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: character.cardBg,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: isSelected ? character.color : COLORS.cardBorder,
                padding: 16,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {/* Avatar */}
              <View style={{ marginBottom: 10 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: character.avatarBg,
                    borderWidth: 2,
                    borderColor: character.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={character.image}
                    resizeMode="cover"
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </View>
              </View>

              {/* Name */}
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 20,
                  fontWeight: '900',
                }}
              >
                {character.name} ✨
              </Text>

              {/* Tags */}
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 11,
                  marginTop: 4,
                  textAlign: 'center',
                  lineHeight: 16,
                }}
              >
                {character.age} • {character.traits}
              </Text>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: 'rgba(148, 163, 184, 0.18)',
                  alignSelf: 'stretch',
                  marginVertical: 6,
                }}
              />

              <Text
                style={{
                  color: character.color,
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 18,
                  marginTop: 4,
                  fontWeight: '700',
                }}
              >
                {character.catchphrase}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom notice */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255, 255, 255, 0.07)',
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MaterialIcons name="lock" size={18} color={COLORS.muted} />
        </View>
        <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18, flex: 1 }}>
          Podrás cambiar de compañero más adelante o desbloquear nuevos personajes.
        </Text>
      </View>
    </ScrollView>
  );
}
