import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { EnglishDifficulty } from '../../auth/AuthProvider';
import { useAuth } from '../../auth/AuthProvider';
import { readStoredEnglishDifficulty, writeStoredEnglishDifficulty } from '../../auth/englishDifficulty';
import { useLanguage } from '../../i18n/LanguageProvider';
import type { AppLanguage } from '../../i18n/language';
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

function getDifficultyOptions(language: AppLanguage): DifficultyOption[] {
  return [
    {
      id: 'easy',
      title: language === 'es' ? 'Fácil' : 'Easy',
      summary: language === 'es'
        ? 'Inglés básico, pero te entiendo aunque escribas en tu idioma nativo'
        : 'Basic English, and I can still help if you write in your native language',
      example:
        'Hi! My name is Zoe.\nI like pizza.\nWhat food do you like?',
      iconName: 'spa',
      iconBg: 'rgba(16, 185, 129, 0.18)',
      iconColor: '#34d399',
    },
    {
      id: 'medium',
      title: language === 'es' ? 'Medio' : 'Medium',
      summary: language === 'es' ? 'Conversaciones simples y naturales' : 'Simple, natural conversations',
      example:
        'I usually go out with my friends on weekends, but today I just want to stay home and relax.\nWhat do you usually do on Saturdays?',
      iconName: 'trending-up',
      iconBg: 'rgba(37, 99, 235, 0.20)',
      iconColor: '#60a5fa',
    },
    {
      id: 'hard',
      title: language === 'es' ? 'Difícil' : 'Hard',
      summary: language === 'es' ? 'Inglés nativo, casual y coloquial' : 'Native, casual, conversational English',
      example:
        'Honestly, I was supposed to be productive today, but I ended up scrolling for an hour and pretending it was research.\nHas that ever happened to you?',
      iconName: 'bolt',
      iconBg: 'rgba(217, 119, 6, 0.20)',
      iconColor: '#fb923c',
    },
  ];
}

type Props = {
  content: OnboardingStepContent;
  onNext: () => void;
};

export default function Step2B({ content, onNext }: Props) {
  const { height } = useWindowDimensions();
  const { language } = useLanguage();
  const { isSignedIn, updateCurrentUser, user } = useAuth();
  const difficultyOptions = getDifficultyOptions(language);
  const choosePrefix = language === 'es' ? 'Elige tu ' : 'Choose your ';
  const chooseHighlight = language === 'es' ? 'nivel' : 'level';
  const subtitleFallback = language === 'es'
    ? 'Ajustaré la dificultad de las conversaciones para que practiques a tu ritmo.'
    : 'I will adjust conversation difficulty so you can practice at your pace.';
  const badgeText = language === 'es' ? 'Lo adapto\na ti' : 'Built around\nyou';
  const practiceQuestionPrefix = language === 'es' ? '¿Qué dificultad quieres practicar ' : 'What difficulty do you want to practice ';
  const practiceQuestionHighlight = language === 'es' ? 'ahora?' : 'now?';
  const chooseDifficultyLabel = language === 'es' ? 'Elegir dificultad' : 'Choose difficulty';
  const [selectedDifficulty, setSelectedDifficulty] = useState<EnglishDifficulty>(
    user?.englishDifficulty || 'medium',
  );
  const [savingDifficulty, setSavingDifficulty] = useState<EnglishDifficulty | null>(null);
  const compactLayout = height < 880;

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
      contentContainerStyle={{
        paddingHorizontal: compactLayout ? 18 : 20,
        paddingBottom: compactLayout ? 2 : 8,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: compactLayout ? -28 : -18,
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text
            style={{
              color: COLORS.text,
              fontSize: compactLayout ? 27 : 30,
              fontWeight: '900',
              lineHeight: compactLayout ? 32 : 36,
            }}
          >
            {choosePrefix}
            <GradientText
              style={{
                fontSize: compactLayout ? 27 : 30,
                fontWeight: '900',
                lineHeight: compactLayout ? 32 : 36,
              }}
            >
              {chooseHighlight}
            </GradientText>
          </Text>
          <Text
            style={{
              color: COLORS.muted,
              fontSize: compactLayout ? 13 : 14,
              lineHeight: compactLayout ? 18 : 20,
              marginTop: compactLayout ? 6 : 10,
            }}
          >
            {content.subtitle || subtitleFallback}
          </Text>
        </View>

        <View style={{ width: compactLayout ? 118 : 136, alignItems: 'center' }}>
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
              paddingHorizontal: compactLayout ? 8 : 10,
              paddingVertical: compactLayout ? 6 : 8,
              marginBottom: -2,
              zIndex: 1,
            }}
          >
            <Text
              style={{
                color: COLORS.text,
                fontSize: compactLayout ? 11 : 12,
                fontWeight: '700',
                lineHeight: compactLayout ? 15 : 17,
                textAlign: 'center',
              }}
            >
              {badgeText}
            </Text>
          </View>
          <Image
            source={luviSayingHi}
            resizeMode="contain"
            style={{ height: compactLayout ? 126 : 156 }}
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
          padding: compactLayout ? 11 : 14,
          marginTop: compactLayout ? -22 : -18,
          marginBottom: compactLayout ? 8 : 14,
          zIndex: 2,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: compactLayout ? 8 : 12,
          }}
        >
          <View
            style={{
              width: compactLayout ? 36 : 42,
              height: compactLayout ? 36 : 42,
              borderRadius: compactLayout ? 18 : 21,
              backgroundColor: 'rgba(37, 99, 235, 0.22)',
              borderWidth: 1,
              borderColor: 'rgba(96, 165, 250, 0.28)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: compactLayout ? 8 : 10,
            }}
          >
            <MaterialIcons name="tune" size={compactLayout ? 20 : 22} color="#60a5fa" />
          </View>
          <Text
            style={{
              color: COLORS.text,
              fontSize: compactLayout ? 14 : 15,
              fontWeight: '900',
              lineHeight: compactLayout ? 19 : 21,
              flex: 1,
            }}
          >
            {practiceQuestionPrefix}
            <GradientText
              style={{
                fontSize: compactLayout ? 14 : 15,
                fontWeight: '900',
                lineHeight: compactLayout ? 19 : 21,
              }}
            >
              {practiceQuestionHighlight}
            </GradientText>
          </Text>
        </View>

        <View style={{ gap: compactLayout ? 7 : 10 }}>
          {difficultyOptions.map((option) => {
            const selected = selectedDifficulty === option.id;
            const saving = savingDifficulty === option.id;

            return (
              <Pressable
                key={option.id}
                onPress={() => void handleSelectDifficulty(option.id)}
                accessibilityRole="button"
                accessibilityLabel={`${chooseDifficultyLabel} ${option.title}`}
                style={({ pressed }) => ({
                  borderRadius: 18,
                  borderWidth: selected ? 1.5 : 1,
                  borderColor: selected ? COLORS.selectedBorder : 'rgba(148, 163, 184, 0.16)',
                  backgroundColor: selected ? COLORS.selectedCard : 'rgba(255, 255, 255, 0.04)',
                  padding: compactLayout ? 10 : 14,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: compactLayout ? 5 : 9,
                  }}
                >
                  <View
                    style={{
                      width: compactLayout ? 36 : 42,
                      height: compactLayout ? 36 : 42,
                      borderRadius: compactLayout ? 18 : 21,
                      backgroundColor: option.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: compactLayout ? 8 : 10,
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color={option.iconColor} />
                    ) : (
                      <MaterialIcons
                        name={option.iconName as any}
                        size={compactLayout ? 21 : 23}
                        color={option.iconColor}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: compactLayout ? 16 : 17,
                        fontWeight: '900',
                      }}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.cyan,
                        fontSize: compactLayout ? 11 : 12,
                        fontWeight: '900',
                        lineHeight: compactLayout ? 15 : 16,
                        marginTop: compactLayout ? 1 : 2,
                      }}
                    >
                      {option.summary}
                    </Text>
                  </View>
                  {selected ? (
                    <MaterialIcons name="check-circle" size={compactLayout ? 21 : 23} color={COLORS.cyan} />
                  ) : null}
                </View>

                <View
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.14)',
                    backgroundColor: 'rgba(7, 17, 31, 0.46)',
                    padding: compactLayout ? 8 : 10,
                    marginTop: compactLayout ? 6 : 10,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: compactLayout ? 11 : 12,
                      lineHeight: compactLayout ? 15 : 17,
                    }}
                  >
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
