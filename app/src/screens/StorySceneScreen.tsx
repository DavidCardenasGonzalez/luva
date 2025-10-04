import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import { api } from '../api/api';
import {
  StoryRequirementState,
  useStoryDetail,
} from '../hooks/useStories';

type StoryMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type StoryAdvancePayload = {
  sceneIndex: number;
  missionCompleted: boolean;
  storyCompleted: boolean;
  requirements: StoryRequirementState[];
  aiReply: string;
  correctness: number;
  result: 'correct' | 'partial' | 'incorrect';
  errors: string[];
  reformulations: string[];
};

export default function StorySceneScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const storyId: string | undefined = route.params?.storyId;
  const initialSceneIndex: number = route.params?.sceneIndex ?? 0;
  const { story, loading, error } = useStoryDetail(storyId);
  const [sceneIndex, setSceneIndex] = useState<number>(initialSceneIndex);

  useEffect(() => {
    setSceneIndex(initialSceneIndex);
  }, [initialSceneIndex, storyId]);

  const mission = story?.missions?.[sceneIndex];

  const storyDefinitionPayload = useMemo(() => {
    if (!story) return undefined;
    return {
      storyId: story.storyId,
      title: story.title,
      summary: story.summary,
      level: story.level,
      missions: story.missions.map((missionDef) => ({
        missionId: missionDef.missionId,
        title: missionDef.title,
        sceneSummary: missionDef.sceneSummary,
        aiRole: missionDef.aiRole,
        requirements: missionDef.requirements.map((req) => ({
          requirementId: req.requirementId,
          text: req.text,
        })),
      })),
    };
  }, [story]);

  const missionDefinitionPayload = useMemo(() => {
    if (!mission) return undefined;
    return {
      missionId: mission.missionId,
      title: mission.title,
      sceneSummary: mission.sceneSummary,
      aiRole: mission.aiRole,
      requirements: mission.requirements.map((req) => ({
        requirementId: req.requirementId,
        text: req.text,
      })),
    };
  }, [mission]);

  const [requirements, setRequirements] = useState<StoryRequirementState[]>([]);
  const [messages, setMessages] = useState<StoryMessage[]>([]);
  const [analysis, setAnalysis] = useState<
    { correctness: number; result: 'correct' | 'partial' | 'incorrect'; errors: string[]; reformulations: string[] } | null
  >(null);
  const [missionCompleted, setMissionCompleted] = useState<boolean>(false);
  const [storyCompleted, setStoryCompleted] = useState<boolean>(false);
  const [pendingNext, setPendingNext] = useState<number | null>(null);
  const [flowState, setFlowState] = useState<'idle' | 'recording' | 'uploading' | 'transcribing' | 'evaluating'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userText, setUserText] = useState<string>('');

  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!mission) return;
    setRequirements(mission.requirements.map((req) => ({ ...req, met: req.met ?? false })));
    setMessages([]);
    setAnalysis(null);
    setMissionCompleted(false);
    setStoryCompleted(false);
    setPendingNext(null);
    setUserText('');
    setErrorMessage(null);
    setFlowState('idle');
  }, [mission?.missionId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const statusLabel = useMemo(() => {
    switch (flowState) {
      case 'recording':
        return 'Grabando...';
      case 'uploading':
        return 'Subiendo audio...';
      case 'transcribing':
        return 'Transcribiendo...';
      case 'evaluating':
        return 'Analizando tu respuesta...';
      default:
        return '';
    }
  }, [flowState]);

  const appendMessage = useCallback((msg: StoryMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleAdvance = useCallback(
    async (transcript: string, sessionId: string) => {
      const trimmed = transcript.trim();
      setErrorMessage(null);
      if (!trimmed) {
        setErrorMessage('La transcripción llegó vacía. Intenta de nuevo.');
        setFlowState('idle');
        return;
      }
      setFlowState('evaluating');
      const historyPayload = [...messages, { id: `pending-${Date.now()}`, role: 'user', text: trimmed }].map(
        ({ role, text }) => ({ role, content: text })
      );
      appendMessage({ id: `user-${Date.now()}`, role: 'user', text: trimmed });
      try {
        const payload = await api.post<StoryAdvancePayload>(`/stories/${storyId}/advance`, {
          sessionId,
          sceneIndex,
          transcript: trimmed,
          history: historyPayload,
        });
        setRequirements(payload.requirements.map((req) => ({ ...req })));
        appendMessage({ id: `ai-${Date.now()}`, role: 'assistant', text: payload.aiReply });
        setAnalysis({
          correctness: payload.correctness,
          result: payload.result,
          errors: payload.errors || [],
          reformulations: payload.reformulations || [],
        });
        setMissionCompleted(payload.missionCompleted);
        setStoryCompleted(payload.storyCompleted);
        if (payload.missionCompleted && payload.sceneIndex !== sceneIndex) {
          setPendingNext(payload.sceneIndex);
        } else {
          setPendingNext(null);
        }
      } catch (err: any) {
        console.error('Story advance error', err);
        setErrorMessage(err?.message || 'No pudimos analizar tu respuesta.');
      } finally {
        setFlowState('idle');
      }
    },
    [appendMessage, messages, missionDefinitionPayload, sceneIndex, storyDefinitionPayload, storyId]
  );

  const handleRecordPressIn = useCallback(async () => {
    try {
      setErrorMessage(null);
      setFlowState('recording');
      await recorder.start();
    } catch (err: any) {
      console.error('Record start error', err);
      setErrorMessage(err?.message || 'No pudimos iniciar la grabación.');
      setFlowState('idle');
    }
  }, [recorder]);

  const handleRecordRelease = useCallback(async () => {
    try {
      if (!recorder.isRecording()) {
        setFlowState('idle');
        return;
      }
      const recording = await recorder.stop();
      setFlowState('uploading');
      const session = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, {
        storyId,
        sceneIndex,
      });
      await uploader.put(session.uploadUrl, { uri: recording.uri }, 'audio/mp4');
      setFlowState('transcribing');
      const transcription = await api.post<{ transcript: string }>(
        `/sessions/${session.sessionId}/transcribe`
      );
      await handleAdvance(transcription.transcript || '', session.sessionId);
    } catch (err: any) {
      console.error('Story recording error', err);
      setErrorMessage(err?.message || 'No pudimos procesar tu audio.');
      setFlowState('idle');
    }
  }, [handleAdvance, recorder, sceneIndex, storyId, uploader]);

  const handleSendText = useCallback(async () => {
    const trimmed = userText.trim();
    if (!trimmed) return;
    try {
      setFlowState('evaluating');
      setErrorMessage(null);
      const session = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, {
        storyId,
        sceneIndex,
      });
      await handleAdvance(trimmed, session.sessionId);
      setUserText('');
    } catch (err: any) {
      console.error('Story text send error', err);
      setErrorMessage(err?.message || 'No pudimos analizar tu texto.');
      setFlowState('idle');
    }
  }, [handleAdvance, sceneIndex, storyId, userText]);

  if (!storyId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text>No se recibió un identificador de historia.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ textAlign: 'center', marginBottom: 12 }}>{error}</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: pressed ? '#dbeafe' : '#bfdbfe',
          })}
        >
          <Text style={{ color: '#1d4ed8', fontWeight: '600' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text>No encontramos esta misión.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>{story?.title}</Text>
        <Text style={{ marginTop: 4, color: '#475569' }}>Misión {sceneIndex + 1} de {story?.missions.length}</Text>

        <View style={{ marginTop: 16, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>{mission.title}</Text>
          {mission.sceneSummary ? (
            <Text style={{ marginTop: 6, color: '#475569' }}>{mission.sceneSummary}</Text>
          ) : null}
        </View>

        <View style={{ marginTop: 16, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Requisitos</Text>
          {requirements.map((req) => (
            <View key={req.requirementId} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>{req.met ? '✅' : '⬜'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: req.met ? '600' : '500', color: req.met ? '#15803d' : '#1f2937' }}>
                  {req.text}
                </Text>
                {req.feedback ? (
                  <Text style={{ marginTop: 4, fontSize: 12, color: '#475569' }}>{req.feedback}</Text>
                ) : null}
              </View>
            </View>
          ))}
          {!requirements.length ? (
            <Text style={{ color: '#475569' }}>Esta misión no tiene requisitos explícitos.</Text>
          ) : null}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Conversación</Text>
          {messages.length === 0 ? (
            <View style={{ padding: 16, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ color: '#475569' }}>
                Empieza la conversación grabando tu pregunta o escribiendo un mensaje.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.role === 'user' ? '#4f46e5' : 'white',
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    maxWidth: '80%',
                    borderWidth: msg.role === 'user' ? 0 : 1,
                    borderColor: '#e2e8f0',
                  }}
                >
                  <Text style={{ color: msg.role === 'user' ? 'white' : '#0f172a' }}>{msg.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {analysis ? (
          <View style={{ marginTop: 16, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={{ fontWeight: '700', color: '#1e293b' }}>
              Correctness: {analysis.correctness}% ({analysis.result === 'correct' ? 'Correcto' : analysis.result === 'partial' ? 'Parcial' : 'Reintenta'})
            </Text>
            {analysis.errors.length ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: '600', color: '#dc2626', marginBottom: 4 }}>Errores detectados</Text>
                {analysis.errors.map((errText, idx) => (
                  <Text key={idx} style={{ color: '#dc2626', marginBottom: 2 }}>• {errText}</Text>
                ))}
              </View>
            ) : null}
            {analysis.reformulations.length ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: '600', color: '#2563eb', marginBottom: 4 }}>Reformulaciones sugeridas</Text>
                {analysis.reformulations.map((line, idx) => (
                  <Text key={idx} style={{ color: '#1f2937', marginBottom: 2 }}>• {line}</Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {missionCompleted ? (
          <View style={{ marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
            <Text style={{ fontWeight: '700', color: '#15803d' }}>¡Misión completada!</Text>
            {storyCompleted ? (
              <Text style={{ marginTop: 6, color: '#166534' }}>
                Terminaste toda la historia. Puedes regresar al listado cuando quieras.
              </Text>
            ) : (
              <Text style={{ marginTop: 6, color: '#166534' }}>
                Avanza para seguir con la siguiente misión.
              </Text>
            )}
            {!storyCompleted && pendingNext !== null ? (
              <Pressable
                onPress={() => {
                  setSceneIndex(pendingNext);
                }}
                style={({ pressed }) => ({
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#22c55e' : '#16a34a',
                })}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Ir a la siguiente misión</Text>
              </Pressable>
            ) : null}
            {storyCompleted ? (
              <Pressable
                onPress={() => navigation.navigate('Stories')}
                style={({ pressed }) => ({
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#cbd5f5' : '#e0e7ff',
                })}
              >
                <Text style={{ color: '#312e81', fontWeight: '700' }}>Volver a historias</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={{ marginTop: 24, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontWeight: '600', color: '#1e293b', marginBottom: 8 }}>Escribe tu mensaje (opcional)</Text>
          <TextInput
            value={userText}
            onChangeText={setUserText}
            placeholder="Escribe aquí tu intervención..."
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#cbd5f5',
              borderRadius: 10,
              padding: 12,
              minHeight: 60,
              backgroundColor: '#f8fafc',
              textAlignVertical: 'top',
            }}
          />
          <Pressable
            disabled={flowState !== 'idle' || !userText.trim().length}
            onPress={handleSendText}
            style={({ pressed }) => ({
              marginTop: 12,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor:
                flowState !== 'idle' || !userText.trim().length
                  ? '#cbd5f5'
                  : pressed
                  ? '#2563eb'
                  : '#3b82f6',
            })}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Enviar texto</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 16, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontWeight: '600', color: '#1e293b', marginBottom: 8 }}>Grabar mensaje</Text>
          <Pressable
            onPressIn={flowState === 'idle' ? handleRecordPressIn : undefined}
            onPressOut={handleRecordRelease}
            disabled={flowState !== 'idle' && flowState !== 'recording'}
            style={({ pressed }) => ({
              paddingVertical: 14,
              borderRadius: 999,
              alignItems: 'center',
              backgroundColor:
                flowState === 'recording'
                  ? '#dc2626'
                  : pressed
                  ? '#7c3aed'
                  : flowState === 'idle'
                  ? '#8b5cf6'
                  : '#cbd5f5',
            })}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {flowState === 'recording' ? 'Suelta para finalizar' : 'Mantén presionado para grabar'}
            </Text>
          </Pressable>
          {statusLabel ? (
            <Text style={{ marginTop: 8, color: '#475569' }}>{statusLabel}</Text>
          ) : null}
        </View>

        {errorMessage ? (
          <Text style={{ marginTop: 12, color: '#dc2626' }}>{errorMessage}</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}






