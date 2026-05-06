import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { OnboardingStepContent } from '../model/types';
import { GradientText } from '../components/GradientText';

const luviSayingHi = require('../../image/luvi-science.gif');

const COLORS = {
  card: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
  selectedBorder: '#22d3ee',
  selectedCard: 'rgba(34, 211, 238, 0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  yellow: '#facc15',
};

type PhraseOption = {
  id: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  text: string;
};

const PHRASE_OPTIONS: PhraseOption[] = [
  {
    id: 'subtitles',
    iconName: 'theaters',
    iconBg: 'rgba(99, 70, 200, 0.35)',
    iconColor: '#a78bfa',
    text: 'Puedo ver una película en inglés con subtítulos en inglés, pero si los quito ya no la entiendo.',
  },
  {
    id: 'freeze',
    iconName: 'sentiment-dissatisfied',
    iconBg: 'rgba(161, 140, 50, 0.35)',
    iconColor: '#fbbf24',
    text: 'Entiendo inglés cuando lo leo, pero al hablar me congelo.',
  },
  {
    id: 'accent',
    iconName: 'headset',
    iconBg: 'rgba(13, 148, 136, 0.35)',
    iconColor: '#2dd4bf',
    text: 'Cuando hablan rápido o con acento, no entiendo casi nada.',
  },
  {
    id: 'phrases',
    iconName: 'forum',
    iconBg: 'rgba(99, 70, 200, 0.35)',
    iconColor: '#c084fc',
    text: 'Sé muchas palabras, pero me cuesta formar frases rápido.',
  },
  {
    id: 'embarrassed',
    iconName: 'sentiment-very-dissatisfied',
    iconBg: 'rgba(220, 50, 80, 0.35)',
    iconColor: '#f87171',
    text: 'Me da pena hablar y cometer errores delante de otros.',
  },
  {
    id: 'work',
    iconName: 'work',
    iconBg: 'rgba(16, 155, 100, 0.35)',
    iconColor: '#34d399',
    text: 'Necesito mejorar mi inglés para el trabajo o para entrevistas.',
  },
  {
    id: 'studied',
    iconName: 'menu-book',
    iconBg: 'rgba(37, 99, 235, 0.35)',
    iconColor: '#60a5fa',
    text: 'He estudiado antes, pero no he visto resultados reales.',
  },
  {
    id: 'travel',
    iconName: 'flight',
    iconBg: 'rgba(217, 119, 6, 0.35)',
    iconColor: '#fb923c',
    text: 'Quiero viajar y sentirme seguro comunicándome en inglés.',
  },
];

type Props = {
  content: OnboardingStepContent;
  onNext: () => void;
};

export default function Step2({ content, onNext }: Props) {
  const { width } = useWindowDimensions();
  const position = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);
  const latestSwipeX = useRef(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentOption = PHRASE_OPTIONS[currentIndex];
  const nextOptions = PHRASE_OPTIONS.slice(currentIndex + 1, currentIndex + 3);
  const selectedOptions = PHRASE_OPTIONS.filter((option) => selectedIds.has(option.id));
  const exitDistance = Math.max(width, 360);

  const cardRotation = position.x.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: ['-9deg', '0deg', '9deg'],
    extrapolate: 'clamp',
  });
  const markOpacity = position.x.interpolate({
    inputRange: [20, 110],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = position.x.interpolate({
    inputRange: [-110, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  function markCurrentOption(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function advanceCard(shouldMark: boolean) {
    if (isAnimating.current) return;

    const option = PHRASE_OPTIONS[currentIndex];
    if (!option) return;

    isAnimating.current = true;

    if (shouldMark) {
      markCurrentOption(option.id);
    }

    Animated.timing(position, {
      toValue: { x: shouldMark ? exitDistance : -exitDistance, y: 0 },
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      latestSwipeX.current = 0;
      setCurrentIndex((index) => Math.min(index + 1, PHRASE_OPTIONS.length));
      isAnimating.current = false;
    });
  }

  function settleSwipe(dx: number) {
    if (dx > 90) {
      advanceCard(true);
      return;
    }
    if (dx < -90) {
      advanceCard(false);
      return;
    }
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      useNativeDriver: true,
    }).start(() => {
      latestSwipeX.current = 0;
    });
  }

  function resetDeck() {
    isAnimating.current = false;
    latestSwipeX.current = 0;
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(0);
    setSelectedIds(new Set());
  }

  const panResponder = PanResponder.create({
    onPanResponderGrant: () => {
      if (isAnimating.current) return;
      latestSwipeX.current = 0;
      position.stopAnimation(() => {
        position.setValue({ x: 0, y: 0 });
      });
    },
    onMoveShouldSetPanResponder: (_, gesture) =>
      !isAnimating.current && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      latestSwipeX.current = gesture.dx;
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      settleSwipe(gesture.dx);
    },
    onPanResponderTerminate: () => {
      settleSwipe(latestSwipeX.current);
    },
    onPanResponderTerminationRequest: () => false,
  });

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: title + mascot */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: -22 }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: '900', lineHeight: 36 }}>
            {'Creamos un plan '}
            <GradientText style={{ fontSize: 30, fontWeight: '900', lineHeight: 36 }}>
              para ti
            </GradientText>
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 10 }}>
            {'Selecciona las frases que '}
            <Text style={{ color: COLORS.text, fontWeight: '700' }}>más</Text>
            {' se parecen a ti para '}
            <Text style={{ color: COLORS.cyan, fontWeight: '700' }}>personalizar{'\n'}tu ruta</Text>
            {' de aprendizaje.'}
          </Text>
        </View>

        <View
          style={{
            width: 142,
            alignItems: 'center',
            zIndex: 0,
          }}
        >
          <MaterialIcons
            name="auto-awesome"
            size={15}
            color={COLORS.yellow}
            style={{ position: 'absolute', left: 6, top: 46, zIndex: 2 }}
          />
          <MaterialIcons
            name="auto-awesome"
            size={14}
            color={COLORS.cyan}
            style={{ position: 'absolute', right: 4, top: 74, zIndex: 2 }}
          />
          <MaterialIcons
            name="auto-awesome"
            size={13}
            color={COLORS.cyan}
            style={{ position: 'absolute', left: 18, top: 124, zIndex: 2 }}
          />
          <View style={{ alignItems: 'center', transform: [{ translateY: 0 }] }}>
            <View
              style={{
                backgroundColor: 'rgba(15, 28, 52, 0.96)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(148, 163, 184, 0.22)',
                paddingHorizontal: 10,
                paddingVertical: 8,
                marginBottom: -2,
                zIndex: 1,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 12,
                  fontWeight: '700',
                  lineHeight: 17,
                  textAlign: 'center',
                }}
              >
                {'¡Así te entiendo\nmejor! 💙✨'}
              </Text>
            </View>
            <Image
              source={luviSayingHi}
              resizeMode="contain"
              style={{ height: 162 }}
              accessibilityLabel="Luvi"
            />
          </View>
        </View>
      </View>

      {/* Options card */}
      <View
        style={{
          backgroundColor: '#0f1c34',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          padding: 14,
          marginTop: -22,
          marginBottom: 14,
          zIndex: 2,
        }}
      >
        {/* Card header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: 'rgba(37, 99, 235, 0.22)',
              borderWidth: 1,
              borderColor: 'rgba(96, 165, 250, 0.28)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              flexShrink: 0,
            }}
          >
            <MaterialIcons name="gps-fixed" size={22} color="#60a5fa" />
          </View>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 15,
              fontWeight: '900',
              lineHeight: 21,
              flex: 1,
            }}
          >
            {'¿Con cuáles de estas frases '}
            <GradientText style={{ fontSize: 15, fontWeight: '900', lineHeight: 21 }}>
              te identificas?
            </GradientText>
          </Text>
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 11,
              textAlign: 'right',
              maxWidth: 78,
              lineHeight: 15,
              marginLeft: 6,
            }}
          >
            Elige todas las que apliquen
          </Text>
        </View>

        {/* Swipe deck */}
        <View style={{ height: 202, marginBottom: 6 }}>
          {nextOptions
            .slice()
            .reverse()
            .map((option, index) => {
              const depth = nextOptions.length - index;
              return (
                <View
                  key={option.id}
                  style={{
                    position: 'absolute',
                    left: depth * 8,
                    right: depth * 8,
                    top: depth * 8,
                    height: 184,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.14)',
                    backgroundColor: 'rgba(255, 255, 255, 0.035)',
                    transform: [{ scale: 1 - depth * 0.035 }],
                  }}
                />
              );
            })}

          {currentOption ? (
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 196,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: COLORS.cardBorder,
                backgroundColor: 'rgba(15, 28, 52, 0.96)',
                padding: 16,
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate: cardRotation },
                ],
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: COLORS.cyan,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  opacity: markOpacity,
                  transform: [{ rotate: '-8deg' }],
                }}
              >
                <Text style={{ color: COLORS.cyan, fontSize: 12, fontWeight: '900' }}>
                  ME IDENTIFICA
                </Text>
              </Animated.View>
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: '#f87171',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  opacity: skipOpacity,
                  transform: [{ rotate: '8deg' }],
                }}
              >
                <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '900' }}>
                  PASAR
                </Text>
              </Animated.View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: currentOption.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MaterialIcons
                    name={currentOption.iconName as any}
                    size={26}
                    color={currentOption.iconColor}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      color: COLORS.cyan,
                      fontSize: 12,
                      fontWeight: '900',
                      lineHeight: 16,
                    }}
                  >
                    Frase {currentIndex + 1} de {PHRASE_OPTIONS.length}
                  </Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 16 }}>
                    Desliza a la derecha para marcarla
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 18,
                  fontWeight: '900',
                  lineHeight: 25,
                  flex: 1,
                }}
              >
                {currentOption.text}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700' }}>
                  ← Pasar
                </Text>
                <Text style={{ color: COLORS.cyan, fontSize: 12, fontWeight: '900' }}>
                  Marcar →
                </Text>
              </View>
            </Animated.View>
          ) : (
            <View
              style={{
                height: 196,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: COLORS.selectedBorder,
                backgroundColor: COLORS.selectedCard,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <MaterialIcons name="check-circle" size={34} color={COLORS.cyan} />
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 16,
                  fontWeight: '900',
                  lineHeight: 22,
                  textAlign: 'center',
                  marginTop: 10,
                }}
              >
                Listo, ya marcamos tus frases.
              </Text>
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 13,
                  lineHeight: 18,
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                Tu ruta ya puede personalizarse con tus respuestas.
              </Text>
              <Pressable
                onPress={onNext}
                accessibilityRole="button"
                accessibilityLabel={content.primaryCta || 'Continuar'}
                style={({ pressed }) => ({
                  minHeight: 42,
                  alignSelf: 'stretch',
                  borderRadius: 14,
                  backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 14,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '900' }}>
                  {content.primaryCta || 'Continuar'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {currentOption ? (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <Pressable
              onPress={() => advanceCard(false)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(248, 113, 113, 0.35)',
                backgroundColor: 'rgba(248, 113, 113, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <MaterialIcons name="close" size={22} color="#f87171" />
            </Pressable>
            <Pressable
              onPress={() => advanceCard(true)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(34, 211, 238, 0.42)',
                backgroundColor: 'rgba(34, 211, 238, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <MaterialIcons name="check" size={24} color={COLORS.cyan} />
            </Pressable>
          </View>
        ) : null}

        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.16)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialIcons name="done-all" size={18} color={COLORS.cyan} />
            <Text
              style={{
                color: COLORS.text,
                fontSize: 13,
                fontWeight: '900',
                marginLeft: 8,
                flex: 1,
              }}
            >
              Marcadas: {selectedIds.size}
            </Text>
            <Pressable onPress={resetDeck} accessibilityRole="button">
              <Text style={{ color: COLORS.cyan, fontSize: 12, fontWeight: '800' }}>
                Reiniciar
              </Text>
            </Pressable>
          </View>

          {selectedOptions.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {selectedOptions.map((option) => (
                <View
                  key={option.id}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: option.iconBg,
                    borderWidth: 1,
                    borderColor: 'rgba(34, 211, 238, 0.32)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons
                    name={option.iconName as any}
                    size={16}
                    color={option.iconColor}
                  />
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 17 }}>
              Las frases que deslices a la derecha aparecerán aquí como marcadas.
            </Text>
          )}
        </View>
      </View>

      {/* Info card */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(37, 99, 235, 0.10)',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(96, 165, 250, 0.18)',
          padding: 14,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: 'rgba(37, 99, 235, 0.20)',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MaterialIcons name="smart-toy" size={22} color={COLORS.cyan} />
        </View>
        <Text style={{ color: COLORS.muted, fontSize: 13, flex: 1, lineHeight: 18 }}>
          {'Con tus respuestas, Luva creará un '}
          <GradientText style={{ fontSize: 13, fontWeight: '800', lineHeight: 18 }}>
            plan único
          </GradientText>
          {' que se adapta a ti y '}
          <GradientText style={{ fontSize: 13, fontWeight: '800', lineHeight: 18 }}>
            se actualiza contigo
          </GradientText>
          {'.'}
        </Text>
        <MaterialIcons
          name="trending-up"
          size={26}
          color={COLORS.cyan}
          style={{ opacity: 0.8, flexShrink: 0 }}
        />
      </View>
    </ScrollView>
  );
}
