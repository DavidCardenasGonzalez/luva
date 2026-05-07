import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  OnboardingPlanResponse,
  OnboardingStepContent,
  OnboardingTrainingFocus,
  OnboardingTrainingFocusId,
} from '../model/types';
import { GradientText } from '../components/GradientText';

const mountainBackground = require('./mountain.png');

const COLORS = {
  background: '#07111f',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  purple: '#8b5cf6',
  card: 'rgba(15, 23, 42, 0.82)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
};

const FALLBACK_DISTRIBUTION: OnboardingTrainingFocus[] = [
  {
    id: 'aiConversation',
    title: 'Conversaciones con IA',
    percentage: 45,
    description: 'Para que pierdas el miedo a hablar y ganes fluidez real practicando con situaciones de la vida real.',
    badge: 'Tu mayor prioridad',
  },
  {
    id: 'shadowing',
    title: 'Shadowing',
    percentage: 25,
    description: 'Para entrenar tu oído y acostumbrarte al ritmo, acento y entonación del inglés real.',
    badge: 'Mejora tu comprensión',
  },
  {
    id: 'vocabulary',
    title: 'Vocabulario útil',
    percentage: 20,
    description: 'Para que tengas las palabras que realmente necesitas y puedas expresarte sin quedarte en blanco.',
    badge: 'Expresa tus ideas',
  },
  {
    id: 'structures',
    title: 'Estructuras clave',
    percentage: 10,
    description: 'Para corregir errores comunes y hablar con más precisión y naturalidad.',
    badge: 'Habla con seguridad',
  },
];

const FALLBACK_PLAN: OnboardingPlanResponse = {
  title: 'Este es tu enfoque personalizado',
  summary: 'Creamos este plan basado en tus objetivos y en lo que nos contaste que se te dificulta del inglés.',
  heroGoal: 'Hablar inglés con más seguridad',
  recommendedStartingPoint: 'Empieza con una misión corta y refuerza vocabulario antes de tu siguiente conversación.',
  focusAreas: ['Speaking', 'Vocabulario útil', 'Fluidez diaria'],
  trainingDistribution: FALLBACK_DISTRIBUTION,
  progressModel: {
    pointsPerLevel: 120,
    currentLevel: 1,
    pointsInCurrentLevel: 0,
    activities: [
      {
        id: 'mission',
        label: 'Misión',
        points: 10,
        unit: 'por misión',
        description: 'Conversaciones guiadas con objetivos concretos.',
      },
      {
        id: 'vocabularyWord',
        label: 'Palabra de vocabulario',
        points: 1,
        unit: 'por palabra',
        description: 'Cada palabra aprendida suma a tu nivel.',
      },
      {
        id: 'freeTextMessage',
        label: 'Mensajes con amigos IA',
        points: 1,
        unit: 'por mensaje',
        description: 'Texto libre con avatares para practicar natural.',
      },
      {
        id: 'lesson',
        label: 'Lesson',
        points: 10,
        unit: 'por lección + quiz',
        description: 'Lección de inglés completada con su quiz.',
      },
      {
        id: 'shadowingChapter',
        label: 'Capítulo de shadowing',
        points: 5,
        unit: 'por capítulo',
        description: 'Práctica de escucha, ritmo y pronunciación.',
      },
    ],
  },
};

const FOCUS_STYLE: Record<OnboardingTrainingFocusId, {
  icon: string;
  color: string;
  bg: string;
}> = {
  aiConversation: {
    icon: 'chat-bubble',
    color: '#a855f7',
    bg: 'rgba(124, 58, 237, 0.32)',
  },
  shadowing: {
    icon: 'headphones',
    color: '#38bdf8',
    bg: 'rgba(14, 165, 233, 0.24)',
  },
  vocabulary: {
    icon: 'menu-book',
    color: '#86efac',
    bg: 'rgba(34, 197, 94, 0.22)',
  },
  structures: {
    icon: 'extension',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.20)',
  },
};

type Props = {
  content: OnboardingStepContent;
  plan: OnboardingPlanResponse | null;
  onNext: () => void;
};

export default function Step6({ content, plan, onNext }: Props) {
  const activePlan = plan || FALLBACK_PLAN;
  const distribution = activePlan.trainingDistribution?.length
    ? activePlan.trainingDistribution
    : FALLBACK_DISTRIBUTION;
  const firstName = activePlan.learnerName?.split(/\s+/)[0];
  const progressModel = activePlan.progressModel || FALLBACK_PLAN.progressModel;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <ImageBackground
        source={mountainBackground}
        resizeMode="cover"
        imageStyle={{ borderRadius: 24, opacity: 0.92 }}
        style={{
          minHeight: 360,
          borderRadius: 24,
          overflow: 'hidden',
          marginTop: 8,
          marginBottom: 20,
        }}
      >
        <View
          style={{
            flex: 1,
            padding: 18,
            backgroundColor: 'rgba(7, 17, 31, 0.26)',
          }}
        >
          <View style={{ maxWidth: 230 }}>
            <Text
              style={{
                color: '#a78bfa',
                fontSize: 11,
                fontWeight: '900',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {firstName ? `${firstName}, estás un paso más cerca` : 'Estás un paso más cerca'} ✨
            </Text>
            <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '900', lineHeight: 33 }}>
              {'Este es tu\n'}
              <GradientText style={{ fontSize: 28, fontWeight: '900', lineHeight: 33 }}>
                enfoque
              </GradientText>
              {'\n'}
              <GradientText style={{ fontSize: 28, fontWeight: '900', lineHeight: 33 }}>
                personalizado
              </GradientText>
            </Text>
            <Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 18, marginTop: 14 }}>
              {activePlan.summary || content.subtitle}
            </Text>
          </View>

          <View
            style={{
              position: 'absolute',
              left: 18,
              bottom: 18,
              flexDirection: 'row',
              alignItems: 'flex-start',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.22)',
              backgroundColor: 'rgba(15, 23, 42, 0.72)',
              paddingHorizontal: 10,
              paddingVertical: 9,
              width: '78%',
              maxWidth: 292,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: 'rgba(34, 211, 238, 0.16)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
                flexShrink: 0,
              }}
            >
              <MaterialIcons name="gps-fixed" size={18} color={COLORS.cyan} />
            </View>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 11,
                lineHeight: 16,
                fontWeight: '800',
                flex: 1,
                flexShrink: 1,
              }}
            >
              Tu objetivo:{' '}
              <Text style={{ color: COLORS.cyan }}>{activePlan.heroGoal}</Text>
            </Text>
          </View>

          <Milestone top={112} right={22} number="3" label="Hablar con confianza" />
          <Milestone top={212} right={54} number="2" label="Conversaciones reales" />
          <Milestone bottom={74} right={26} number="1" label="Primeras palabras" checked />
        </View>
      </ImageBackground>

      <SectionTitle />

      <View style={{ gap: 10 }}>
        {distribution.map((item) => (
          <FocusCard key={item.id} item={item} />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(139, 92, 246, 0.24)',
          backgroundColor: 'rgba(88, 28, 135, 0.20)',
          padding: 14,
          marginTop: 12,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: 'rgba(124, 58, 237, 0.30)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="stacked-line-chart" size={24} color="#c084fc" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '900' }}>
            Este plan se ajustará contigo cada semana
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 }}>
            Cada nivel equivale a {progressModel.pointsPerLevel} puntos internos según lo que practiques.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel={content.primaryCta || 'Empezar mi plan'}
        style={({ pressed }) => ({
          minHeight: 60,
          borderRadius: 18,
          backgroundColor: pressed ? '#2563eb' : '#7c3aed',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 12,
          marginTop: 16,
          opacity: pressed ? 0.9 : 1,
          shadowColor: '#38bdf8',
          shadowOpacity: 0.28,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
        })}
      >
        <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '900' }}>
          Empezar mi plan
        </Text>
        <MaterialIcons name="arrow-forward" size={24} color="#ffffff" />
      </Pressable>

      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: COLORS.muted, fontSize: 11 }}>
          Puedes cambiar tu enfoque cuando quieras
        </Text>
      </View>
    </ScrollView>
  );
}

function SectionTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(148, 163, 184, 0.22)' }} />
      <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>
        Así distribuiremos tu entrenamiento:
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(148, 163, 184, 0.22)' }} />
    </View>
  );
}

function Milestone({
  number,
  label,
  checked,
  top,
  right,
  bottom,
}: {
  number: string;
  label: string;
  checked?: boolean;
  top?: number;
  right: number;
  bottom?: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top,
        right,
        bottom,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        maxWidth: 120,
      }}
    >
      <Text style={{ color: '#c4b5fd', fontSize: 10, fontWeight: '900' }}>{number}</Text>
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#a78bfa',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? 'rgba(124, 58, 237, 0.55)' : 'rgba(15, 23, 42, 0.42)',
        }}
      >
        {checked ? <MaterialIcons name="check" size={11} color="#ffffff" /> : null}
      </View>
      <Text style={{ color: '#e2e8f0', fontSize: 9, lineHeight: 12, flex: 1 }}>{label}</Text>
    </View>
  );
}

function FocusCard({ item }: { item: OnboardingTrainingFocus }) {
  const meta = FOCUS_STYLE[item.id];
  const safePercentage = Math.max(0, Math.min(100, Math.round(item.percentage)));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        backgroundColor: COLORS.card,
        padding: 12,
      }}
    >
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 16,
          backgroundColor: meta.bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MaterialIcons name={meta.icon as any} size={29} color={meta.color} />
      </View>

      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          borderWidth: 7,
          borderColor: 'rgba(30, 41, 59, 0.95)',
          borderTopColor: meta.color,
          borderRightColor: safePercentage >= 25 ? meta.color : 'rgba(30, 41, 59, 0.95)',
          borderBottomColor: safePercentage >= 50 ? meta.color : 'rgba(30, 41, 59, 0.95)',
          borderLeftColor: safePercentage >= 75 ? meta.color : 'rgba(30, 41, 59, 0.95)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: '900' }}>
          {safePercentage}%
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: meta.color, fontSize: 14, fontWeight: '900', lineHeight: 19 }}>
          {item.title}
        </Text>
        <Text style={{ color: '#cbd5e1', fontSize: 11, lineHeight: 16, marginTop: 3 }}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}
