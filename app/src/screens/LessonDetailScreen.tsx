import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  combineLessonSubtitles,
  fetchSrtCaptions,
  findActiveSubtitle,
  getNearbySubtitles,
  LessonSubtitleCue,
  sendLessonHelp,
  useLessonDetail,
} from '../hooks/useLessons';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonDetail'>;

type LessonMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  surfaceAlt: '#111827',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  action: '#2563eb',
  danger: '#f87171',
};

function formatVideoTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function CaptionPanel({
  cue,
  subtitleMode,
}: {
  cue?: LessonSubtitleCue;
  subtitleMode: 'en' | 'en_es';
}) {
  if (!cue?.english && !cue?.spanish) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        marginTop: -6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        gap: 6,
      }}
    >
      {cue.english ? (
        <Text
          style={{
            color: 'white',
            fontSize: 17,
            fontWeight: '900',
            lineHeight: 22,
            textAlign: 'center',
            backgroundColor: 'rgba(2, 6, 23, 0.78)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {cue.english}
        </Text>
      ) : null}
      {subtitleMode === 'en_es' && cue.spanish ? (
        <Text
          style={{
            color: '#dbeafe',
            fontSize: 14,
            fontWeight: '800',
            lineHeight: 19,
            textAlign: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {cue.spanish}
        </Text>
      ) : null}
    </View>
  );
}

export default function LessonDetailScreen({ navigation, route }: Props) {
  const { lessonId } = route.params;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const videoRef = useRef<Video | null>(null);
  const { lesson, loading, error } = useLessonDetail(lessonId);

  const [positionSeconds, setPositionSeconds] = useState(0);
  const [subtitleMode, setSubtitleMode] = useState<'en' | 'en_es'>('en');
  const [cues, setCues] = useState<LessonSubtitleCue[]>([]);
  const [subtitlesLoading, setSubtitlesLoading] = useState(false);
  const [subtitlesError, setSubtitlesError] = useState<string | undefined>();

  const [messages, setMessages] = useState<LessonMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpError, setHelpError] = useState<string | undefined>();

  useEffect(() => {
    if (!lesson?.translatedSubtitlesUrl && subtitleMode === 'en_es') {
      setSubtitleMode('en');
    }
  }, [lesson?.translatedSubtitlesUrl, subtitleMode]);

  useEffect(() => {
    let cancelled = false;

    if (!lesson) {
      setCues([]);
      setSubtitlesLoading(false);
      setSubtitlesError(undefined);
      return;
    }

    setSubtitlesLoading(Boolean(lesson.subtitlesUrl));
    setSubtitlesError(undefined);

    (async () => {
      try {
        const english = await fetchSrtCaptions(lesson.subtitlesUrl);
        let spanish: Awaited<ReturnType<typeof fetchSrtCaptions>> = [];

        if (lesson.translatedSubtitlesUrl) {
          try {
            spanish = await fetchSrtCaptions(lesson.translatedSubtitlesUrl);
          } catch {
            if (!cancelled) {
              setSubtitlesError('No pudimos cargar los subtítulos en español.');
            }
          }
        }

        if (!cancelled) {
          setCues(combineLessonSubtitles(english, spanish));
        }
      } catch (err: any) {
        if (!cancelled) {
          setCues([]);
          setSubtitlesError(err?.message || 'No pudimos cargar subtítulos.');
        }
      } finally {
        if (!cancelled) setSubtitlesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lesson]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  const activeCue = useMemo(
    () => findActiveSubtitle(cues, positionSeconds),
    [cues, positionSeconds]
  );

  const handlePlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionSeconds(status.positionMillis / 1000);
  }, []);

  const handleGoToTest = useCallback(() => {
    navigation.navigate('LessonTest', { lessonId });
  }, [lessonId, navigation]);

  const handleSendQuestion = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || !lesson || helpLoading) return;

    const currentCue = findActiveSubtitle(cues, positionSeconds);
    const nearbySubtitles = getNearbySubtitles(cues, positionSeconds);
    const userMessage: LessonMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setQuestion('');
    setHelpError(undefined);
    setHelpLoading(true);
    setMessages((current) => [...current, userMessage]);

    try {
      const answer = await sendLessonHelp(lesson.lessonId, {
        question: trimmed,
        currentTimeSeconds: positionSeconds,
        subtitleMode,
        currentCaptionEnglish: currentCue?.english,
        currentCaptionSpanish: currentCue?.spanish,
        subtitles: nearbySubtitles,
      });
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: answer,
        },
      ]);
    } catch (err: any) {
      setHelpError(err?.message || 'No pudimos preguntarle a Luvi.');
    } finally {
      setHelpLoading(false);
    }
  }, [cues, helpLoading, lesson, positionSeconds, question, subtitleMode]);

  const quizCount = lesson?.quiz?.length || 0;
  const sendDisabled = helpLoading || !question.trim() || !lesson;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 20, gap: 16 }}
          style={{ flex: 1 }}
        >
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
                Lección
              </Text>
              <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '900' }} numberOfLines={1}>
                {lesson?.title || 'Cargando...'}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.accent} />
              <Text style={{ color: COLORS.muted, marginTop: 10 }}>Cargando lección...</Text>
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
          ) : (
            <>
              <View
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  backgroundColor: '#020617',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  aspectRatio: 1,
                }}
              >
                <Video
                  ref={videoRef}
                  source={{ uri: lesson.videoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  progressUpdateIntervalMillis={250}
                  onPlaybackStatusUpdate={handlePlaybackStatus}
                />
              </View>

              <CaptionPanel cue={activeCue} subtitleMode={subtitleMode} />

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    padding: 4,
                    borderRadius: 999,
                    backgroundColor: COLORS.surface,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  {(['en', 'en_es'] as const).map((mode) => {
                    const selected = subtitleMode === mode;
                    const disabled = mode === 'en_es' && !lesson.translatedSubtitlesUrl;
                    return (
                      <Pressable
                        key={mode}
                        disabled={disabled}
                        onPress={() => setSubtitleMode(mode)}
                        accessibilityRole="button"
                        accessibilityLabel={mode === 'en' ? 'Subtítulos en inglés' : 'Subtítulos en inglés y español'}
                        style={({ pressed }) => ({
                          flex: 1,
                          minHeight: 40,
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected ? COLORS.accent : pressed ? COLORS.surfaceAlt : 'transparent',
                          opacity: disabled ? 0.45 : 1,
                        })}
                      >
                        <Text style={{ color: selected ? '#06202a' : COLORS.text, fontWeight: '900', fontSize: 12 }}>
                          {mode === 'en' ? 'EN' : 'EN + ES'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={handleGoToTest}
                  disabled={quizCount === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Ir al test"
                  style={({ pressed }) => ({
                    minHeight: 48,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: quizCount === 0 ? COLORS.surface : pressed ? '#1d4ed8' : COLORS.action,
                    borderWidth: quizCount === 0 ? 1 : 0,
                    borderColor: COLORS.border,
                    opacity: quizCount === 0 ? 0.65 : 1,
                  })}
                >
                  <MaterialIcons name="quiz" size={18} color="white" />
                  <Text style={{ color: 'white', fontWeight: '900' }}>Test</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="schedule" size={16} color={COLORS.muted} />
                <Text style={{ color: COLORS.muted, fontVariant: ['tabular-nums'] }}>
                  {formatVideoTime(positionSeconds)}
                </Text>
                {subtitlesLoading ? (
                  <>
                    <ActivityIndicator color={COLORS.accent} size="small" />
                    <Text style={{ color: COLORS.muted }}>Cargando subtítulos...</Text>
                  </>
                ) : subtitlesError ? (
                  <Text style={{ color: COLORS.danger, flex: 1 }} numberOfLines={2}>
                    {subtitlesError}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: 'rgba(34, 211, 238, 0.14)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="psychology" size={21} color={COLORS.accent} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: '900' }}>Luvi help</Text>
                    <Text style={{ color: COLORS.muted, marginTop: 2 }} numberOfLines={1}>
                      Contexto: subtítulos y segundo actual
                    </Text>
                  </View>
                </View>

                {messages.length === 0 ? (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: '#07111f',
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text style={{ color: '#cbd5e1', lineHeight: 20 }}>
                      Escribe una duda sobre la frase actual, vocabulario o gramática del video.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    {messages.map((message) => {
                      const isUser = message.role === 'user';
                      return (
                        <View
                          key={message.id}
                          style={{
                            alignSelf: isUser ? 'flex-end' : 'flex-start',
                            maxWidth: '88%',
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 16,
                            backgroundColor: isUser ? COLORS.action : '#07111f',
                            borderWidth: isUser ? 0 : 1,
                            borderColor: COLORS.border,
                          }}
                        >
                          <Text style={{ color: isUser ? 'white' : COLORS.text, lineHeight: 20 }}>
                            {message.text}
                          </Text>
                        </View>
                      );
                    })}
                    {helpLoading ? (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 16,
                          backgroundColor: '#07111f',
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <ActivityIndicator color={COLORS.accent} size="small" />
                        <Text style={{ color: COLORS.muted }}>Luvi está pensando...</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {helpError ? (
                  <Text style={{ color: COLORS.danger, lineHeight: 20 }}>{helpError}</Text>
                ) : null}
              </View>
            </>
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 10),
            backgroundColor: '#f8fafc',
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: 'white',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#dbeafe',
              paddingLeft: 14,
              paddingRight: 6,
              paddingVertical: 6,
            }}
          >
            <TextInput
              value={question}
              onChangeText={(text) => {
                setQuestion(text);
                if (helpError) setHelpError(undefined);
              }}
              placeholder="Pregúntale a Luvi..."
              placeholderTextColor="#94a3b8"
              multiline
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSendQuestion}
              editable={!helpLoading && Boolean(lesson)}
              style={{
                flex: 1,
                maxHeight: 120,
                color: '#0f172a',
                paddingTop: 8,
                paddingBottom: 8,
                paddingRight: 8,
              }}
            />
            <Pressable
              onPress={handleSendQuestion}
              disabled={sendDisabled}
              accessibilityRole="button"
              accessibilityLabel="Enviar pregunta"
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: sendDisabled ? '#e2e8f0' : pressed ? '#1d4ed8' : COLORS.action,
              })}
            >
              {helpLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <MaterialIcons name="send" size={20} color={sendDisabled ? '#94a3b8' : 'white'} />
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
