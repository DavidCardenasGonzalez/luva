import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { OnboardingStepContent } from '../model/types';
import { GradientText } from '../components/GradientText';

const luviSayingHi = require('../../image/luvi-saying-hi.gif');

const COLORS = {
  card: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
  selectedBorder: '#22d3ee',
  selectedCard: 'rgba(34, 211, 238, 0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
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

export default function Step2({ content: _content }: { content: OnboardingStepContent }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleOption(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: title + mascot */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 18 }}>
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

        <View style={{ width: 128, alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: 'rgba(15, 28, 52, 0.96)',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.22)',
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 4,
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
            style={{ width: 116, height: 106 }}
            accessibilityLabel="Luvi"
          />
        </View>
      </View>

      {/* Options card */}
      <View
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          padding: 16,
          marginBottom: 14,
        }}
      >
        {/* Card header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 14,
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

        {/* 2-column options grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PHRASE_OPTIONS.map((option) => {
            const isSelected = selectedIds.has(option.id);
            return (
              <Pressable
                key={option.id}
                onPress={() => toggleOption(option.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                style={({ pressed }) => ({
                  width: '48%',
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: isSelected ? COLORS.selectedBorder : COLORS.cardBorder,
                  backgroundColor: isSelected
                    ? COLORS.selectedCard
                    : 'rgba(255, 255, 255, 0.04)',
                  padding: 12,
                  opacity: pressed ? 0.82 : 1,
                })}
              >
                {/* Icon + checkbox row */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: option.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons
                      name={option.iconName as any}
                      size={20}
                      color={option.iconColor}
                    />
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: isSelected ? COLORS.cyan : 'transparent',
                      borderWidth: isSelected ? 0 : 1.5,
                      borderColor: 'rgba(148, 163, 184, 0.38)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <MaterialIcons name="check" size={14} color="#07111f" />
                    )}
                  </View>
                </View>

                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 12,
                    lineHeight: 17,
                    marginTop: 8,
                    fontWeight: '600',
                  }}
                >
                  {option.text}
                </Text>
              </Pressable>
            );
          })}
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
