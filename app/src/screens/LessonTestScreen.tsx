import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LessonQuizQuestion, useLessonDetail } from '../hooks/useLessons';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonTest'>;

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
  danger: '#ef4444',
};

function QuestionCard({
  question,
  questionIndex,
  selectedIndex,
  onSelect,
}: {
  question: LessonQuizQuestion;
  questionIndex: number;
  selectedIndex?: number;
  onSelect: (questionIndex: number, optionIndex: number) => void;
}) {
  const answered = selectedIndex != null;

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: 'rgba(34, 211, 238, 0.14)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: COLORS.accent, fontWeight: '900' }}>{questionIndex + 1}</Text>
        </View>
        <Text style={{ flex: 1, color: COLORS.text, fontSize: 17, fontWeight: '900', lineHeight: 23 }}>
          {question.question}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {question.options.map((option, optionIndex) => {
          const selected = selectedIndex === optionIndex;
          const correct = question.correctIndex === optionIndex;
          const showCorrect = answered && correct;
          const showWrong = answered && selected && !correct;
          return (
            <Pressable
              key={`${questionIndex}-${optionIndex}`}
              onPress={() => onSelect(questionIndex, optionIndex)}
              accessibilityRole="button"
              accessibilityLabel={`Respuesta ${optionIndex + 1}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: 14,
                backgroundColor: showCorrect
                  ? 'rgba(34, 197, 94, 0.14)'
                  : showWrong
                    ? 'rgba(239, 68, 68, 0.14)'
                    : selected
                      ? 'rgba(37, 99, 235, 0.18)'
                      : pressed
                        ? COLORS.surfaceAlt
                        : '#07111f',
                borderWidth: 1,
                borderColor: showCorrect
                  ? 'rgba(34, 197, 94, 0.45)'
                  : showWrong
                    ? 'rgba(239, 68, 68, 0.45)'
                    : selected
                      ? 'rgba(37, 99, 235, 0.45)'
                      : COLORS.border,
              })}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: showCorrect
                    ? COLORS.success
                    : showWrong
                      ? COLORS.danger
                      : selected
                        ? COLORS.action
                        : COLORS.surface,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '900' }}>
                  {String.fromCharCode(65 + optionIndex)}
                </Text>
              </View>
              <Text style={{ flex: 1, color: COLORS.text, lineHeight: 20 }}>{option}</Text>
              {showCorrect ? <MaterialIcons name="check-circle" size={20} color={COLORS.success} /> : null}
              {showWrong ? <MaterialIcons name="cancel" size={20} color={COLORS.danger} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function LessonTestScreen({ navigation, route }: Props) {
  const { lessonId } = route.params;
  const { lesson, loading, error } = useLessonDetail(lessonId);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const questions = lesson?.quiz || [];
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const score = useMemo(
    () =>
      questions.reduce((total, question, index) => {
        return total + (selectedAnswers[index] === question.correctIndex ? 1 : 0);
      }, 0),
    [questions, selectedAnswers]
  );

  const handleSelectAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionIndex]: optionIndex,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedAnswers({});
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 16 }} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? COLORS.surfaceAlt : COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
            })}
          >
            <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>
              Test
            </Text>
            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '900' }} numberOfLines={1}>
              {lesson?.title || 'Cargando...'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={{ color: COLORS.muted, marginTop: 10 }}>Cargando test...</Text>
          </View>
        ) : error || !lesson ? (
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(248, 113, 113, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(248, 113, 113, 0.35)',
            }}
          >
            <Text style={{ color: '#fecaca', lineHeight: 20 }}>{error || 'Lección no encontrada.'}</Text>
          </View>
        ) : questions.length === 0 ? (
          <View
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              gap: 10,
            }}
          >
            <MaterialIcons name="quiz" size={30} color={COLORS.accent} />
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900' }}>
              Esta lección todavía no tiene test
            </Text>
            <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
              Cuando el quiz esté generado en el registro de la lección aparecerá aquí.
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                padding: 16,
                borderRadius: 18,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900' }}>
                  {answeredCount}/{questions.length} respondidas
                </Text>
                <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                  El resultado aparece cuando selecciones todas las respuestas.
                </Text>
              </View>
              {allAnswered ? (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: 'rgba(34, 197, 94, 0.14)',
                    borderWidth: 1,
                    borderColor: 'rgba(34, 197, 94, 0.4)',
                  }}
                >
                  <Text style={{ color: '#bbf7d0', fontWeight: '900' }}>
                    {score}/{questions.length}
                  </Text>
                </View>
              ) : null}
            </View>

            {questions.map((question, index) => (
              <QuestionCard
                key={`${lesson.lessonId}-${index}`}
                question={question}
                questionIndex={index}
                selectedIndex={selectedAnswers[index]}
                onSelect={handleSelectAnswer}
              />
            ))}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => navigation.navigate('LessonDetail', { lessonId })}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
                })}
              >
                <Text style={{ color: 'white', fontWeight: '900' }}>Volver al video</Text>
              </Pressable>
              <Pressable
                onPress={handleReset}
                style={({ pressed }) => ({
                  minHeight: 48,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? COLORS.surfaceAlt : COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                })}
              >
                <MaterialIcons name="refresh" size={20} color={COLORS.text} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
