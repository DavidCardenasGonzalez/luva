import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../api/api';
import CardStatusSelector from '../components/CardStatusSelector';
import { CARD_STATUS_LABELS, useCardProgress } from '../progress/CardProgressProvider';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';

type EvalRes = {
  score: number;
  result: 'correct'|'partial'|'incorrect';
  feedback: { grammar: string[]; wording: string[]; naturalness: string[]; register: string[] };
  errors?: string[];
  improvements?: string[];
  suggestions?: string[];
};

type PracticeState = 'idle'|'recording'|'uploading'|'transcribing'|'evaluating'|'done';

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#38bdf8',
  accentStrong: '#0ea5e9',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  purple: '#8b5cf6',
};

const STATE_LABELS: Record<PracticeState, string> = {
  idle: 'Listo',
  recording: 'Grabando',
  uploading: 'Subiendo',
  transcribing: 'Transcribiendo',
  evaluating: 'Evaluando',
  done: 'Listo',
};

const STATE_STYLES: Record<PracticeState, { bg: string; color: string; border: string }> = {
  idle: { bg: '#0b1224', color: COLORS.text, border: COLORS.border },
  recording: { bg: 'rgba(139, 92, 246, 0.22)', color: '#c4b5fd', border: COLORS.purple },
  uploading: { bg: 'rgba(56, 189, 248, 0.2)', color: COLORS.accent, border: COLORS.accentStrong },
  transcribing: { bg: 'rgba(56, 189, 248, 0.2)', color: COLORS.accent, border: COLORS.accentStrong },
  evaluating: { bg: 'rgba(245, 158, 11, 0.2)', color: COLORS.warning, border: COLORS.warning },
  done: { bg: 'rgba(34, 197, 94, 0.16)', color: COLORS.success, border: COLORS.success },
};

export default function PracticeScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {
    cardId,
    storyId,
    sceneIndex,
    prompt,
    label,
    examples,
    options,
    answer,
    explanation,
  } = route.params || {};
  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const { statusFor } = useCardProgress();
  const [transcript, setTranscript] = useState('');
  const [state, setState] = useState<PracticeState>('idle');
  const [feedback, setFeedback] = useState<EvalRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<'a'|'b'|'c'|null>(null);
  const [canRecord, setCanRecord] = useState<boolean>(false);
  const [userText, setUserText] = useState<string>('');

  const speakSegments = useCallback(
    async (segments: (string | undefined | null)[], scope: string, language: string = 'en-US') => {
      const filtered = segments
        .map((s) => (s || '').trim())
        .filter((s) => s.length > 0);
      if (!filtered.length) return;
      const speechText = filtered.join('. ');
      console.log(`[Practice] Reproduciendo ${scope}`, speechText);
      try {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            playThroughEarpieceAndroid: false,
            defaultToSpeaker: true,
          });
        } catch (audioErr) {
          console.warn('[Practice] No se pudo configurar audio mode para speech', audioErr);
        }
        Speech.stop();
        Speech.speak(speechText, { language, pitch: 1.05 });
      } catch (err: any) {
        console.warn('[Practice] Error al reproducir', err?.message || err);
      }
    },
    []
  );

  const speakLabel = useCallback(() => {
    if (!label) return;
    void speakSegments([label, ...(examples || [])], 'palabra');
  }, [label, examples, speakSegments]);

  // Press-and-hold: start on pressIn, stop & process on pressOut
  const run = async () => {
    if (!selected || !canRecord) {
      return;
    }
    // Mantener el feedback y transcript actual visibles para evitar saltos de layout.
    setState('recording');
    setCanRecord(false);
    try {
      await recorder.start();
    } catch (err: any) {
      console.error('[Practice] No se pudo iniciar la grabación', err?.message || err);
      setError(err?.message || 'No se pudo iniciar la grabación');
      setState('idle');
    }
  };

  const onRelease = async () => {
    try {
      if (!recorder.isRecording()) {
        console.warn('[Practice] onRelease sin grabación activa');
        setState('idle');
        return;
      }
      const rec = await recorder.stop();
      console.log('Recorded', rec);

      setState('uploading');
      const startBody: any = {};
      if (cardId) startBody.cardId = cardId;
      if (storyId) {
        startBody.storyId = storyId;
        startBody.sceneIndex = sceneIndex ?? 0;
      }
      let started;
      try {
        started = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, startBody);
      } catch (error) {
        console.error('Error starting session:', error);
        setState('idle');
        return;
      }
      try {
        // Important: content type must match the presigned URL (backend signs audio/mp4)
        await uploader.put(started.uploadUrl, { uri: rec.uri }, 'audio/mp4');
      } catch (e: any) {
        console.error('Upload failed:', e);
        setError(e?.message || 'Upload failed');
        setState('idle');
        return;
      }
      console.log('Uploaded');
      setState('transcribing');
      let finalTranscript: string;
      if (userText && userText.trim().length > 0) {
        // Si el usuario escribió texto, saltamos la transcripción
        finalTranscript = userText.trim();
        setTranscript(finalTranscript);
      } else {
        const tr = await api.post<{ transcript: string }>(`/sessions/${started.sessionId}/transcribe`);
        finalTranscript = tr.transcript;
        setTranscript(tr.transcript);
      }

      setState('evaluating');
      const ev = await api.post<EvalRes>(`/sessions/${started.sessionId}/evaluate`, {
        transcript: finalTranscript,
        label,
        example: examples?.[0],
      });
      console.log('Evaluation:', ev);
      setFeedback(ev);
      if (ev.result !== 'correct') {
        setCanRecord(true);
      } else {
        setCanRecord(false);
      }

      if (cardId) {
        // Complete card and update points/streak server-side
        const combinedResult = selected && answer && selected === answer ? ev.result : 'incorrect';
        const comp: any = await api.post(`/cards/${cardId}/complete`, {
          result: combinedResult,
          score: ev.score,
        });
        if (comp?.streak === 5) {
          // simple streak modal/alert
          console.log('Streak x5! Bonus awarded.');
        }
      }
      setState('done');
    } catch (e: any) {
      console.error('Error after release:', e);
      setError(e?.message || 'Failed to process recording');
      setState('idle');
    }
  };

  const errorsList = useMemo(() => {
    if (!feedback) return [] as string[];
    const errs = (feedback.errors && feedback.errors.length ? feedback.errors : feedback.feedback.grammar) || [];
    return Array.isArray(errs) ? errs.filter((e): e is string => typeof e === 'string' && e.trim().length > 0) : [];
  }, [feedback]);

  const improvementsList = useMemo(() => {
    if (!feedback) return [] as string[];
    const sugg = feedback.improvements && feedback.improvements.length ? feedback.improvements : feedback.suggestions || [];
    return Array.isArray(sugg) ? sugg.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : [];
  }, [feedback]);

  const speakErrors = useCallback(() => {
    if (!errorsList.length) return;
    void speakSegments(errorsList, 'feedback.errores', 'es-ES');
  }, [errorsList, speakSegments]);

  const speakImprovements = useCallback(() => {
    if (!improvementsList.length) return;
    void speakSegments(improvementsList, 'feedback.reformulaciones');
  }, [improvementsList, speakSegments]);

  const recordReady = (selected && canRecord) || state === 'recording';
  const cardStatusLabel = cardId ? CARD_STATUS_LABELS[statusFor(cardId)] : null;
  const canSubmitText = selected && userText.trim().length > 0 && canRecord;
  const practiceSubtitle = !selected
    ? 'Selecciona una opción'
    : recordReady
      ? 'Listo para grabar'
      : canRecord
        ? 'Prepara tu respuesta'
        : feedback?.result === 'correct'
          ? 'Práctica completada'
          : 'Prepara tu respuesta';
  const recordCta = !selected
    ? 'Primero elige una opción'
    : state === 'recording'
      ? 'Suelta para detener'
      : canRecord
        ? 'Mantén para grabar'
        : feedback?.result === 'correct'
          ? 'Práctica completada'
          : 'Preparando grabación';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={state !== 'recording'}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderLeftWidth: 2,
                  borderBottomWidth: 2,
                  borderColor: COLORS.text,
                  transform: [{ rotate: '45deg' }],
                }}
              />
            </Pressable>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Sesión de práctica</Text>
              <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                Repite, graba y recibe feedback inmediato.
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: COLORS.border,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <View
              style={{
                position: 'absolute',
                width: 240,
                height: 240,
                backgroundColor: 'rgba(14, 165, 233, 0.18)',
                borderRadius: 240,
                top: -90,
                right: -80,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: 180,
                height: 180,
                backgroundColor: 'rgba(139, 92, 246, 0.14)',
                borderRadius: 180,
                bottom: -80,
                left: -60,
              }}
            />
            <Text
              style={{
                color: '#22d3ee',
                fontSize: 12,
                letterSpacing: 1,
                fontWeight: '800',
                textTransform: 'uppercase',
              }}
            >
              Modo entrenamiento
            </Text>
            <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900', marginTop: 6 }}>
              {label ? label : 'Práctica guiada'}
            </Text>
                {examples?.length ? (
                <View style={{ marginTop: 12 }}>
                  {examples.map((ex: string, idx: number) => (
                  <Text
                    key={idx}
                    style={{
                    marginTop: idx === 0 ? 0 : 6,
                    color: COLORS.muted,
                    fontSize: 15,
                    lineHeight: 22,
                    }}
                  >
                    • {ex}
                  </Text>
                  ))}
                </View>
              ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: STATE_STYLES[state].border,
                  backgroundColor: STATE_STYLES[state].bg,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: STATE_STYLES[state].color,
                    marginRight: 6,
                  }}
                />
                <Text style={{ color: STATE_STYLES[state].color, fontWeight: '700' }}>
                  {STATE_LABELS[state]}
                </Text>
              </View>
              {cardStatusLabel ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: COLORS.success,
                    backgroundColor: 'rgba(34, 197, 94, 0.16)',
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: COLORS.success, fontWeight: '700' }}>Estado: {cardStatusLabel}</Text>
                </View>
              ) : null}
              {label ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Pronunciar ${label}`}
                  onPress={speakLabel}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: pressed ? '#0ea5e933' : '#0ea5e91a',
                    borderWidth: 1,
                    borderColor: COLORS.accentStrong,
                    marginBottom: 8,
                  })}
                >
                  <Text style={{ color: COLORS.accent, fontWeight: '700' }}>🔊 Escuchar</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          {options && (
            <View
              style={{
                marginTop: 12,
                padding: 16,
                borderRadius: 16,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 16 }}>
                ¿Cuál es la mejor definición?
              </Text>
              <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                Elige una opción para habilitar la práctica.
              </Text>
              {(['a','b','c'] as const).map((k) => {
                const isSelected = selected === k;
                const isCorrectChoice = isSelected && answer && k === answer;
                const isWrongChoice = isSelected && answer && k !== answer;
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      setSelected(k);
                      setCanRecord(true);
                    }}
                    style={({ pressed }) => ({
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isCorrectChoice
                        ? COLORS.success
                        : isWrongChoice
                          ? COLORS.error
                          : COLORS.border,
                      backgroundColor: isCorrectChoice
                        ? 'rgba(34, 197, 94, 0.12)'
                        : isWrongChoice
                          ? 'rgba(239, 68, 68, 0.12)'
                          : '#111827',
                      opacity: pressed ? 0.92 : 1,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Text style={{ color: COLORS.text, fontWeight: '800', marginRight: 10, marginTop: 1 }}>
                        {k.toUpperCase()}.
                      </Text>
                      <Text style={{ color: COLORS.muted, fontSize: 15, flex: 1, lineHeight: 22 }}>
                        {options[k]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              {selected && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: '#0b1528',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      color: answer && selected === answer ? COLORS.success : COLORS.error,
                      fontWeight: '800',
                    }}
                  >
                    {answer && selected === answer ? '¡Correcto!' : 'Incorrecto'}
                  </Text>
                  {explanation ? (
                    <Text style={{ marginTop: 6, color: COLORS.muted, lineHeight: 20 }}>
                      {explanation}
                    </Text>
                  ) : null}
                  <Text style={{ marginTop: 10, fontWeight: '700', color: COLORS.text }}>
                    {prompt
                      ? `Úsalo en una oración, por ejemplo: ${prompt}`
                      : '¿Puedes usarlo en una oración?'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View
            style={{
              marginTop: 12,
              padding: 16,
              borderRadius: 16,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 16 }}>Zona de práctica</Text>
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                {practiceSubtitle}
              </Text>
            </View>
            <Text style={{ color: COLORS.muted, marginTop: 6 }}>
              Escribe tu oración o mantén presionado para grabar. El audio inicia cuando eliges una opción.
            </Text>
            <TextInput
              value={userText}
              onChangeText={setUserText}
              placeholder="Escribe aquí tu respuesta..."
              multiline
              placeholderTextColor="#64748b"
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 10,
                padding: 12,
                minHeight: 70,
                backgroundColor: '#0b1528',
                color: COLORS.text,
                marginTop: 10,
              }}
            />
            {canSubmitText && (
              <Pressable
                onPress={async () => {
                  try {
                    setState('evaluating');
                    const started = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, { cardId, storyId, sceneIndex });
                    setTranscript(userText.trim());
                    const ev = await api.post<EvalRes>(`/sessions/${started.sessionId}/evaluate`, {
                      transcript: userText.trim(),
                      label,
                      example: examples?.[0],
                    });
                    setFeedback(ev);
                    if (cardId) {
                      const combinedResult = selected && answer && selected === answer ? ev.result : 'incorrect';
                      await api.post(`/cards/${cardId}/complete`, { result: combinedResult, score: ev.score });
                    }
                    setState('done');
                    if (ev.result !== 'correct') setCanRecord(true);
                  } catch (e: any) {
                    console.error('Evaluate text error:', e);
                    setError(e?.message || 'No se pudo evaluar el texto');
                    setState('idle');
                  }
                }}
                style={({ pressed }) => ({
                  marginTop: 10,
                  backgroundColor: pressed ? COLORS.accentStrong : COLORS.accent,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.accentStrong,
                })}
              >
                <Text style={{ color: '#0b1224', fontWeight: '800' }}>Evaluar texto</Text>
              </Pressable>
            )}
            <Pressable
              disabled={!recordReady}
              onPressIn={run}
              onPressOut={onRelease}
              style={({ pressed }) => ({
                marginTop: 12,
                backgroundColor: recordReady
                  ? state === 'recording'
                    ? COLORS.purple
                    : COLORS.accentStrong
                  : '#1f2937',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: recordReady ? COLORS.accentStrong : COLORS.border,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: recordReady ? 'white' : COLORS.muted, fontWeight: '800' }}>{recordCta}</Text>
            </Pressable>
            {transcript ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: '#0b1528',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Transcript
                </Text>
                <Text style={{ color: COLORS.text, marginTop: 4 }}>{transcript}</Text>
              </View>
            ) : null}
            {error ? <Text style={{ marginTop: 10, color: COLORS.error }}>Error: {error}</Text> : null}
          </View>

          {feedback && (
            <View
              style={{
                marginTop: 14,
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 6, color: COLORS.text }}>
                {feedback.result === 'correct' && '¡Excelente! Vas por muy buen camino.'}
                {feedback.result === 'partial' && 'Buen intento. Aquí tienes algunas sugerencias:'}
                {feedback.result === 'incorrect' && 'Gracias por intentarlo. Probemos con estas mejoras:'}
              </Text>
              <View
                style={{
                  height: 10,
                  backgroundColor: '#0b1528',
                  borderRadius: 999,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <View
                  style={{
                    height: 10,
                    width: `${Math.max(0, Math.min(100, feedback.score))}%`,
                    backgroundColor:
                      feedback.score >= 85 ? COLORS.success : feedback.score >= 60 ? COLORS.warning : COLORS.error,
                  }}
                />
              </View>
              <Text style={{ marginTop: 6, color: COLORS.muted }}>Puntaje: {feedback.score}/100</Text>

              {errorsList.length ? (
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '700', flex: 1, color: COLORS.text }}>Detalles a mejorar</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Escuchar detalles a mejorar"
                      onPress={speakErrors}
                      style={({ pressed }) => ({
                        padding: 6,
                        borderRadius: 999,
                        backgroundColor: pressed ? '#3f1d2e' : '#2a1b2b',
                      })}
                    >
                      <Text style={{ fontSize: 18 }}>🔊</Text>
                    </Pressable>
                  </View>
                  {errorsList.map((e, i) => (
                    <Text key={i} style={{ color: COLORS.error, marginBottom: 4 }}>
                      • {e}
                    </Text>
                  ))}
                </View>
              ) : null}

              {improvementsList.length ? (
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '700', flex: 1, color: COLORS.text }}>
                      Reformulaciones más naturales
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Escuchar reformulaciones sugeridas"
                      onPress={speakImprovements}
                      style={({ pressed }) => ({
                        padding: 6,
                        borderRadius: 999,
                        backgroundColor: pressed ? '#0b2540' : '#0b1f35',
                      })}
                    >
                      <Text style={{ fontSize: 18 }}>🔊</Text>
                    </Pressable>
                  </View>
                  {improvementsList.map((s, i) => (
                    <Text key={i} style={{ marginBottom: 4, color: COLORS.text }}>
                      • {s}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          {cardId && feedback?.result === 'correct' ? (
            <View
              style={{
                marginTop: 14,
                padding: 18,
                borderRadius: 14,
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                borderWidth: 1,
                borderColor: COLORS.success,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.success }}>✅ ¡Lograste esta card!</Text>
              <Text style={{ color: COLORS.text, marginTop: 8 }}>
                Ahora decide si quieres seguir reforzándola o marcarla como aprendida.
              </Text>
              <Text style={{ marginTop: 12, color: COLORS.text, fontWeight: '700' }}>
                Estado actual: {CARD_STATUS_LABELS[statusFor(cardId)]}
              </Text>
              <CardStatusSelector
                cardId={String(cardId)}
                title="Actualiza tu progreso"
                allowedStatuses={['learning', 'learned']}
                style={{ marginTop: 12 }}
                onStatusChange={() => {
                  navigation.navigate('Deck');
                }}
              />
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 6 }}>
                Puedes volver a cambiarlo más adelante desde el deck.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
