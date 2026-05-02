import React, { useCallback, useState } from 'react';
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
import { ResizeMode, Video } from 'expo-av';
import { RootStackParamList } from '../navigation/AppNavigator';
import AppTabBar from '../components/AppTabBar';
import { Lesson, useLessons } from '../hooks/useLessons';
import { getLearnedLessonIds } from '../progress/lessonProgress';

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

function LessonCard({
  lesson,
  learned,
  onOpen,
}: {
  lesson: Lesson;
  learned: boolean;
  onOpen: (lesson: Lesson) => void;
}) {
  const quizCount = lesson.quiz?.length || 0;
  const hasSpanishSubtitles = Boolean(lesson.translatedSubtitlesUrl);

  return (
    <View
      style={{
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
      }}
    >
      {/* Video preview */}
      <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#07111f' }}>
        <Video
          source={{ uri: lesson.videoUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted
        />

        {/* Completed badge */}
        {learned ? (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: 'rgba(34, 197, 94, 0.88)',
            }}
            pointerEvents="none"
          >
            <MaterialIcons name="check-circle" size={13} color="white" />
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>Completada</Text>
          </View>
        ) : null}
      </View>

      {/* Info + CTA */}
      <View style={{ padding: 14, gap: 12 }}>
        <View>
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>
            Lección
          </Text>
          <Text
            style={{ color: COLORS.text, fontSize: 18, fontWeight: '900', marginTop: 3, lineHeight: 24 }}
            numberOfLines={2}
          >
            {lesson.title}
          </Text>
          {lesson.prompt ? (
            <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 5 }} numberOfLines={2}>
              {lesson.prompt}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
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
              <MaterialIcons name="closed-caption" size={14} color={COLORS.accent} />
              <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '800' }}>
                {hasSpanishSubtitles ? 'EN + ES' : 'EN'}
              </Text>
            </View>
            {quizCount > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                }}
              >
                <MaterialIcons name="quiz" size={14} color={COLORS.success} />
                <Text style={{ color: '#bbf7d0', fontSize: 12, fontWeight: '800' }}>
                  {quizCount} preguntas
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => onOpen(lesson)}
            accessibilityRole="button"
            accessibilityLabel={`Empezar lección ${lesson.title}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
            })}
          >
            <MaterialIcons name={learned ? 'replay' : 'play-arrow'} size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>
              {learned ? 'Repasar' : 'Empezar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function LessonsScreen({ navigation }: Props) {
  const { lessons, loading, error, reload } = useLessons();
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());

  const reloadLearned = useCallback(async () => {
    const ids = await getLearnedLessonIds();
    setLearnedIds(ids);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      reloadLearned();
    }, [reload, reloadLearned])
  );

  const handleOpenLesson = useCallback(
    (lesson: Lesson) => {
      navigation.navigate('LessonDetail', { lessonId: lesson.lessonId });
    },
    [navigation]
  );

  const completedCount = lessons.filter((l) => learnedIds.has(l.lessonId)).length;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 128, gap: 16 }} style={{ flex: 1 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
            Videos
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: '900' }}>
            Lecciones
          </Text>
          <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
            Mira videos con subtítulos y pregúntale a Luvi cuando algo no quede claro.
          </Text>

          {!loading && lessons.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
                alignSelf: 'flex-start',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: completedCount === lessons.length
                  ? 'rgba(34, 197, 94, 0.18)'
                  : 'rgba(34, 211, 238, 0.10)',
                borderWidth: 1,
                borderColor: completedCount === lessons.length
                  ? 'rgba(34, 197, 94, 0.35)'
                  : 'rgba(34, 211, 238, 0.2)',
              }}
            >
              <MaterialIcons
                name={completedCount === lessons.length ? 'emoji-events' : 'bar-chart'}
                size={15}
                color={completedCount === lessons.length ? '#4ade80' : COLORS.accent}
              />
              <Text
                style={{
                  color: completedCount === lessons.length ? '#bbf7d0' : '#a5f3fc',
                  fontSize: 13,
                  fontWeight: '900',
                }}
              >
                {completedCount} de {lessons.length} completadas
              </Text>
            </View>
          ) : null}
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
              <LessonCard
                key={lesson.lessonId}
                lesson={lesson}
                learned={learnedIds.has(lesson.lessonId)}
                onOpen={handleOpenLesson}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <AppTabBar active="lessons" />
    </SafeAreaView>
  );
}
