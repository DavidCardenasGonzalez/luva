import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import AppTabBar from '../components/AppTabBar';
import { Lesson, useLessons } from '../hooks/useLessons';

type Props = NativeStackScreenProps<RootStackParamList, 'Lessons'>;

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  surfaceAlt: '#111827',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  action: '#2563eb',
  success: '#22c55e',
};

function LessonCard({ lesson, onOpen }: { lesson: Lesson; onOpen: (lesson: Lesson) => void }) {
  const quizCount = lesson.quiz?.length || 0;
  const hasSpanishSubtitles = Boolean(lesson.translatedSubtitlesUrl);

  return (
    <Pressable
      onPress={() => onOpen(lesson)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir lección ${lesson.title}`}
      style={({ pressed }) => ({
        padding: 16,
        borderRadius: 18,
        backgroundColor: pressed ? COLORS.surfaceAlt : COLORS.surface,
        borderWidth: 1,
        borderColor: pressed ? 'rgba(34, 211, 238, 0.38)' : COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
      })}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 16,
            backgroundColor: '#07111f',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.14)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="ondemand-video" size={34} color={COLORS.accent} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>
            Lección
          </Text>
          <Text
            style={{ color: COLORS.text, fontSize: 20, fontWeight: '900', marginTop: 4, lineHeight: 25 }}
            numberOfLines={2}
          >
            {lesson.title}
          </Text>
          {lesson.prompt ? (
            <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 6 }} numberOfLines={2}>
              {lesson.prompt}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: 'rgba(34, 211, 238, 0.12)',
          }}
        >
          <MaterialIcons name="closed-caption" size={15} color={COLORS.accent} />
          <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '800' }}>
            {hasSpanishSubtitles ? 'EN + ES' : 'EN'}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: quizCount > 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.12)',
          }}
        >
          <MaterialIcons name="quiz" size={15} color={quizCount > 0 ? COLORS.success : COLORS.muted} />
          <Text style={{ color: quizCount > 0 ? '#bbf7d0' : COLORS.muted, fontSize: 12, fontWeight: '800' }}>
            {quizCount > 0 ? `${quizCount} preguntas` : 'Sin test'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function LessonsScreen({ navigation }: Props) {
  const { lessons, loading, error, reload } = useLessons();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleOpenLesson = useCallback(
    (lesson: Lesson) => {
      navigation.navigate('LessonDetail', { lessonId: lesson.lessonId });
    },
    [navigation]
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 128, gap: 16 }} style={{ flex: 1 }}>
        <View>
          <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
            Videos
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: '900', marginTop: 6 }}>
            Lecciones
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 8, lineHeight: 21 }}>
            Mira videos con subtítulos y pregúntale a Luvi cuando algo no quede claro.
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 36, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={{ color: COLORS.muted, marginTop: 10 }}>Cargando lecciones...</Text>
          </View>
        ) : error ? (
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(248, 113, 113, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(248, 113, 113, 0.35)',
            }}
          >
            <Text style={{ color: '#fecaca', lineHeight: 20 }}>{error}</Text>
            <Pressable
              onPress={reload}
              style={({ pressed }) => ({
                alignSelf: 'flex-start',
                marginTop: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>Reintentar</Text>
            </Pressable>
          </View>
        ) : lessons.length === 0 ? (
          <View
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <MaterialIcons name="video-library" size={30} color={COLORS.accent} />
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900', marginTop: 10 }}>
              Todavía no hay lecciones listas
            </Text>
            <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 6 }}>
              Cuando una lección tenga video publicado aparecerá aquí.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {lessons.map((lesson) => (
              <LessonCard key={lesson.lessonId} lesson={lesson} onOpen={handleOpenLesson} />
            ))}
          </View>
        )}
      </ScrollView>
      <AppTabBar active="lessons" />
    </SafeAreaView>
  );
}
