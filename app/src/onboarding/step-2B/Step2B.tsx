import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { EnglishDifficulty } from '../../auth/AuthProvider';
import { useAuth } from '../../auth/AuthProvider';
import { readStoredEnglishDifficulty, writeStoredEnglishDifficulty } from '../../auth/englishDifficulty';
import { GradientText } from '../components/GradientText';
import type { OnboardingStepContent } from '../model/types';

const luviSayingHi = require('../../image/luvi-science.gif');

const COLORS = {
  cardBorder: 'rgba(148, 163, 184, 0.18)',
  selectedBorder: '#22d3ee',
  selectedCard: 'rgba(34, 211, 238, 0.10)',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  yellow: '#facc15',
};

type DifficultyOption = {
  id: EnglishDifficulty;
  title: string;
  summary: string;
  example: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
};

const difficultyOptions: DifficultyOption[] = [
  {
    id: 'easy',
    title: 'Fácil',
    summary: 'Inglés básico, pero te entiendo aunque escribas en español',
    example:
      'Hi! My name is Zoe.\nI like pizza.\nWhat food do you like?',
    iconName: 'spa',
    iconBg: 'rgba(16, 185, 129, 0.18)',
    iconColor: '#34d399',
  },
  {
    id: 'medium',
    title: 'Medio',
    summary: 'Conversaciones simples y naturales',
    example:
      'I usually go out with my friends on weekends, but today I just want to stay home and relax.\nWhat do you usually do on Saturdays?',
    iconName: 'trending-up',
    iconBg: 'rgba(37, 99, 235, 0.20)',
    iconColor: '#60a5fa',
  },
  {
    id: 'hard',
    title: 'Difícil',
    summary: 'Inglés nativo, casual y coloquial',
    example:
      'Honestly, I was supposed to be productive today, but I ended up scrolling for an hour and pretending it was research.\nHas that ever happened to you?',
    iconName: 'bolt',
    iconBg: 'rgba(217, 119, 6, 0.20)',
    iconColor: '#fb923c',
  },
];

type Props = {
  content: OnboardingStepContent;
  onNext: () => void;
};

export default function Step2B({ content, onNext }: Props) {
  const { isSignedIn, updateCurrentUser, user } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<EnglishDifficulty>(
    user?.englishDifficulty || 'medium',
  );
  const [savingDifficulty, setSavingDifficulty] = useState<EnglishDifficulty | null>(null);

  useEffect(() => {
    let mounted = true;

    void readStoredEnglishDifficulty().then((value) => {
      if (mounted && !user?.englishDifficulty) {
        setSelectedDifficulty(value);
      }
    });

    return () => {
      mounted = false;
    };
  }, [user?.englishDifficulty]);

  async function handleSelectDifficulty(value: EnglishDifficulty) {
    if (savingDifficulty) return;

    setSelectedDifficulty(value);
    setSavingDifficulty(value);

    try {
      await writeStoredEnglishDifficulty(value);
      if (isSignedIn) {
        await updateCurrentUser({ englishDifficulty: value });
      }
    } catch (err) {
      console.warn('[Onboarding] Error al guardar dificultad', err);
    } finally {
      setSavingDifficulty(null);
      onNext();
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: -18 }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: '900', lineHeight: 36 }}>
            {'Elige tu '}
            <GradientText style={{ fontSize: 30, fontWeight: '900', lineHeight: 36 }}>
              nivel
            </GradientText>
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 10 }}>
            {content.subtitle || 'Ajustaré la dificultad de las conversaciones para que practiques a tu ritmo.'}
          </Text>
        </View>

        <View style={{ width: 136, alignItems: 'center' }}>
          <MaterialIcons
            name="auto-awesome"
            size={15}
            color={COLORS.yellow}
            style={{ position: 'absolute', left: 4, top: 44, zIndex: 2 }}
          />
          <MaterialIcons
            name="auto-awesome"
            size={14}
            color={COLORS.cyan}
            style={{ position: 'absolute', right: 4, top: 72, zIndex: 2 }}
          />
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
              {'Lo adapto\na ti'}
            </Text>
          </View>
          <Image
            source={luviSayingHi}
            resizeMode="contain"
            style={{ height: 156 }}
            accessibilityLabel="Luvi"
          />
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#0f1c34',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          padding: 14,
          marginTop: -18,
          marginBottom: 14,
          zIndex: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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
            }}
          >
            <MaterialIcons name="tune" size={22} color="#60a5fa" />
          </View>
          <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '900', lineHeight: 21, flex: 1 }}>
            {'¿Qué dificultad quieres practicar '}
            <GradientText style={{ fontSize: 15, fontWeight: '900', lineHeight: 21 }}>
              ahora?
            </GradientText>
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {difficultyOptions.map((option) => {
            const selected = selectedDifficulty === option.id;
            const saving = savingDifficulty === option.id;

            return (
              <Pressable
                key={option.id}
                onPress={() => void handleSelectDifficulty(option.id)}
                accessibilityRole="button"
                accessibilityLabel={`Elegir dificultad ${option.title}`}
                style={({ pressed }) => ({
                  borderRadius: 18,
                  borderWidth: selected ? 1.5 : 1,
                  borderColor: selected ? COLORS.selectedBorder : 'rgba(148, 163, 184, 0.16)',
                  backgroundColor: selected ? COLORS.selectedCard : 'rgba(255, 255, 255, 0.04)',
                  padding: 14,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 9 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: option.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color={option.iconColor} />
                    ) : (
                      <MaterialIcons
                        name={option.iconName as any}
                        size={23}
                        color={option.iconColor}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: '900' }}>
                      {option.title}
                    </Text>
                    <Text style={{ color: COLORS.cyan, fontSize: 12, fontWeight: '900', lineHeight: 16, marginTop: 2 }}>
                      {option.summary}
                    </Text>
                  </View>
                  {selected ? (
                    <MaterialIcons name="check-circle" size={23} color={COLORS.cyan} />
                  ) : null}
                </View>

                <View
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.14)',
                    backgroundColor: 'rgba(7, 17, 31, 0.46)',
                    padding: 10,
                    marginTop: 10,
                  }}
                >
                  <Text style={{ color: COLORS.text, fontSize: 12, lineHeight: 17 }}>
                    {option.example}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
