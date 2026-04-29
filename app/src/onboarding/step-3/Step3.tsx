import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { OnboardingStepContent } from '../model/types';
import { GradientText } from '../components/GradientText';

// Replace with actual CloudFront URL when assets are ready
const CHARACTERS_VIDEO_URL = 'https://d1example.cloudfront.net/luva/characters-intro.mp4';

const COLORS = {
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  card: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
};

type CharacterId = 'luna' | 'mateo';

const CHARACTERS = [
  {
    id: 'luna' as CharacterId,
    name: 'Luna',
    age: '25 años',
    traits: 'Creativa • Amante de los viajes',
    description: 'Amigable, positiva y divertida.',
    catchphrase: 'Te ayuda a ganar confianza y hablar sin miedo.',
    color: '#a855f7',
    avatarBg: 'rgba(109, 40, 217, 0.45)',
    cardBg: 'rgba(109, 40, 217, 0.08)',
    speechHeadline: '¡Elígeme!',
    speechBody: 'Haré que hablar\ninglés sea\ndivertido 😎',
  },
  {
    id: 'mateo' as CharacterId,
    name: 'Mateo',
    age: '32 años',
    traits: 'Coach • Fan del fitness',
    description: 'Motivador, paciente y claro.',
    catchphrase: 'Te reta a mejorar y alcanzar tus metas en inglés.',
    color: '#22d3ee',
    avatarBg: 'rgba(6, 78, 105, 0.55)',
    cardBg: 'rgba(6, 78, 105, 0.08)',
    speechHeadline: '¡Elígeme a mí!',
    speechBody: 'Juntos llevaremos\ntu inglés al\nsiguiente nivel. 💪',
  },
] as const;

const FILL: object = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

export default function Step3({ content: _content }: { content: OnboardingStepContent }) {
  const videoRef = useRef<Video>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId | null>(null);

  async function handlePlayVideo() {
    setIsVideoPlaying(true);
    await videoRef.current?.playAsync();
  }

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
        {' de inglés'}
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
        }}
      >
        {/* Placeholder: two halves (left = Luna purple, right = Mateo teal) */}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(109, 40, 217, 0.55)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(6, 78, 105, 0.65)' }} />
        </View>

        {/* Video (covers placeholder while playing) */}
        {isVideoPlaying && (
          <Video
            ref={videoRef}
            style={FILL}
            source={{ uri: CHARACTERS_VIDEO_URL }}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsVideoPlaying(false);
              }
            }}
          />
        )}

        {/* Overlays: speech bubbles + play button */}
        {!isVideoPlaying && (
          <>
            {/* Speech bubbles row */}
            <View
              style={{
                ...(FILL as any),
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: 10,
                gap: 8,
              }}
            >
              {CHARACTERS.map((char) => (
                <View
                  key={char.id}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(10, 16, 36, 0.88)',
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <Text
                    style={{
                      color: '#facc15',
                      fontSize: 12,
                      fontWeight: '900',
                    }}
                  >
                    {char.speechHeadline}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 12,
                      lineHeight: 17,
                      marginTop: 2,
                    }}
                  >
                    {char.speechBody}
                  </Text>
                </View>
              ))}
            </View>

            {/* Play button centered */}
            <View
              style={{
                ...(FILL as any),
                alignItems: 'center',
                justifyContent: 'center',
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
          </>
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
              onPress={() => setSelectedCharacter(character.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: isSelected ? character.cardBg : COLORS.card,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: isSelected ? character.color : COLORS.cardBorder,
                padding: 16,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {/* Avatar placeholder */}
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
                  }}
                >
                  <MaterialIcons name="person" size={44} color={character.color} />
                </View>
                {/* Play badge */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: character.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#07111f',
                  }}
                >
                  <MaterialIcons
                    name="play-arrow"
                    size={14}
                    color="#07111f"
                    style={{ marginLeft: 1 }}
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
                  marginVertical: 12,
                }}
              />

              {/* Description */}
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 18,
                }}
              >
                {character.description}
              </Text>
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
