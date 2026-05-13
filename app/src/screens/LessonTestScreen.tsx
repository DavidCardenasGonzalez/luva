import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Audio } from 'expo-av';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LessonQuizQuestion, useLessonDetail } from '../hooks/useLessons';
import { markLessonLearned } from '../progress/lessonProgress';

const successSound = require('../sound/succes_req.mp3');

type Props = NativeStackScreenProps<RootStackParamList, 'LessonTest'>;

const PASS_THRESHOLD = 3;

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

function shuffleQuizOptions(questions: LessonQuizQuestion[]): LessonQuizQuestion[] {
  return questions.map((question) => {
    const shuffled = question.options
      .map((option, index) => ({ option, isCorrect: index === question.correctIndex }))
      .sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.findIndex((option) => option.isCorrect);

    return {
      ...question,
      options: shuffled.map((option) => option.option),
      correctIndex: correctIndex >= 0 ? correctIndex : question.correctIndex,
    };
  });
}

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
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [resultVisible, setResultVisible] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);
  const resultConfettiRef = useRef<ConfettiCannon>(null);
  const { width: screenWidth } = Dimensions.get('window');

  const questions = useMemo(
    () => shuffleQuizOptions(lesson?.quiz || []),
    [lesson?.quiz, shuffleSeed]
  );
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const score = useMemo(
    () =>
      questions.reduce((total, question, index) => {
        return total + (selectedAnswers[index] === question.correctIndex ? 1 : 0);
      }, 0),
    [questions, selectedAnswers]
  );
  const passed = score >= PASS_THRESHOLD;

  useEffect(() => {
    if (!allAnswered) return;
    setResultVisible(true);
    if (passed) {
      markLessonLearned(lessonId);
      setTimeout(() => resultConfettiRef.current?.start(), 300);
    }
  }, [allAnswered]);

  const handleSelectAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((current) => {
      if (current[questionIndex] != null) return current;
      return { ...current, [questionIndex]: optionIndex };
    });
    if (
      questions[questionIndex]?.correctIndex === optionIndex &&
      selectedAnswers[questionIndex] == null
    ) {
      confettiRef.current?.start();
      Audio.Sound.createAsync(successSound).then(({ sound }) => {
        sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
        });
      });
    }
  }, [questions, selectedAnswers]);

  const handleRetry = useCallback(() => {
    setResultVisible(false);
    setSelectedAnswers({});
    setShuffleSeed((current) => current + 1);
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.navigate('Lessons');
  }, [lessonId, navigation]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: screenWidth / 2, y: -10 }}
        autoStart={false}
        fadeOut
        explosionSpeed={350}
        fallSpeed={2500}
        colors={['#22d3ee', '#22c55e', '#a78bfa', '#f59e0b', '#f472b6', '#ffffff']}
      />

      <Modal
        visible={resultVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          {passed && (
            <ConfettiCannon
              ref={resultConfettiRef}
              count={160}
              origin={{ x: screenWidth / 2, y: -10 }}
              autoStart={false}
              fadeOut
              explosionSpeed={400}
              fallSpeed={2800}
              colors={['#22d3ee', '#22c55e', '#a78bfa', '#f59e0b', '#f472b6', '#ffffff']}
            />
          )}

          <View
            style={{
              width: '100%',
              backgroundColor: COLORS.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: passed ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
              padding: 28,
              alignItems: 'center',
              gap: 16,
            }}
          >
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 999,
                backgroundColor: passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons
                name={passed ? 'emoji-events' : 'sentiment-dissatisfied'}
                size={36}
                color={passed ? COLORS.success : COLORS.danger}
              />
            </View>

            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
              {passed ? 'Lección completada' : `Has obtenido ${score}/${questions.length} preguntas`}
            </Text>

            {passed ? (
              <Text style={{ color: COLORS.muted, textAlign: 'center', lineHeight: 20 }}>
                Has acertado {score} de {questions.length} preguntas. ¡La lección ha sido marcada como aprendida!
              </Text>
            ) : (
              <Text style={{ color: COLORS.muted, textAlign: 'center', lineHeight: 20 }}>
                ¿Deseas volver a intentar el quiz?
              </Text>
            )}

            {passed ? (
              <Pressable
                onPress={handleGoBack}
                style={({ pressed }) => ({
                  width: '100%',
                  minHeight: 50,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? '#16a34a' : COLORS.success,
                })}
              >
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Volver a la lección</Text>
              </Pressable>
            ) : (
              <View style={{ width: '100%', gap: 10 }}>
                <Pressable
                  onPress={handleRetry}
                  style={({ pressed }) => ({
                    width: '100%',
                    minHeight: 50,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
                  })}
                >
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Sí, intentarlo de nuevo</Text>
                </Pressable>
                <Pressable
                  onPress={handleGoBack}
                  style={({ pressed }) => ({
                    width: '100%',
                    minHeight: 50,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? COLORS.surfaceAlt : 'transparent',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  })}
                >
                  <Text style={{ color: COLORS.muted, fontWeight: '700', fontSize: 16 }}>No, volver a la lección</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
                  Necesitas acertar al menos {PASS_THRESHOLD} para completar la lección.
                </Text>
              </View>
            </View>

            {questions.map((question, index) => (
              <QuestionCard
                key={`${lesson.lessonId}-${index}-${shuffleSeed}`}
                question={question}
                questionIndex={index}
                selectedIndex={selectedAnswers[index]}
                onSelect={handleSelectAnswer}
              />
            ))}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={handleGoBack}
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
                onPress={handleRetry}
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
