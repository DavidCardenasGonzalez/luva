import React, { useState } from 'react';
import { View, Text, Button, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import { useRoute } from '@react-navigation/native';
import { api } from '../api/api';

type EvalRes = {
  score: number;
  result: 'correct'|'partial'|'incorrect';
  feedback: { grammar: string[]; wording: string[]; naturalness: string[]; register: string[] };
  errors?: string[];
  improvements?: string[];
  suggestions?: string[];
};

export default function PracticeScreen() {
  const route = useRoute<any>();
  const { cardId, storyId, sceneIndex, prompt, label, example, options, answer, explanation } = route.params || {};
  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const [transcript, setTranscript] = useState('');
  const [state, setState] = useState<'idle'|'recording'|'uploading'|'transcribing'|'evaluating'|'done'>('idle');
  const [feedback, setFeedback] = useState<EvalRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<'a'|'b'|'c'|null>(null);
  const [canRecord, setCanRecord] = useState<boolean>(false);
  const [userText, setUserText] = useState<string>('');

  // Press-and-hold: start on pressIn, stop & process on pressOut
  const run = async () => {
    if (!selected) {
      return;
    }
    // Mantener el feedback y transcript actual visibles para evitar saltos de layout.
    setState('recording');
    setCanRecord(false);
    await recorder.start();
  };

  const onRelease = async () => {
    try {
      const rec = await recorder.stop();
      console.log('Recorded', rec);

    setState('uploading');
    const startBody: any = {};
    if (cardId) startBody.cardId = cardId;
    if (storyId) { startBody.storyId = storyId; startBody.sceneIndex = sceneIndex ?? 0; }
    let started;
    try {
      started = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, startBody);
    } catch (error) {
      console.error('Error starting session:', error);
      setState('idle');
      return;
    }
    console.log('Uploading to', started.uploadUrl);
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
    const ev = await api.post<EvalRes>(`/sessions/${started.sessionId}/evaluate`, { transcript: finalTranscript, label, example });
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
      const comp: any = await api.post(`/cards/${cardId}/complete`, { result: combinedResult, score: ev.score });
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={state !== 'recording'}
      >
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Práctica</Text>
      {label ? <Text style={{ marginTop: 8, fontWeight: '600' }}>{label}</Text> : null}
      {example ? <Text style={{ marginTop: 6, color: '#555' }}>{example}</Text> : null}
      {prompt ? <Text style={{ marginTop: 8 }}>{prompt}</Text> : null}
      {options && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ marginBottom: 8 }}>¿Cuál es la mejor definición?</Text>
          {(['a','b','c'] as const).map((k) => (
            <Pressable key={k} onPress={() => { setSelected(k); setCanRecord(true); }} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: selected === k ? (answer && selected === answer ? '#dcfce7' : '#fee2e2') : 'white', marginBottom: 8 }}>
              <Text>{k.toUpperCase()}. {options[k]}</Text>
            </Pressable>
          ))}
          {selected && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: answer && selected === answer ? '#16a34a' : '#dc2626', fontWeight: '600' }}>{answer && selected === answer ? '¡Correcto!' : 'Incorrecto'}</Text>
              {explanation ? <Text style={{ marginTop: 4, color: '#555' }}>{explanation}</Text> : null}
              <Text style={{ marginTop: 8, fontWeight: '600' }}>¿Puedes usarlo en una oración?</Text>
            </View>
          )}
        </View>
      )}
      <Text style={{ marginTop: 8 }}>State: {state}</Text>
      <View style={{ height: 12 }} />
      
      
      {transcript ? <Text style={{ marginTop: 12 }}>Transcript: {transcript}</Text> : null}
      {feedback && (
        <View style={{ marginTop: 16, backgroundColor: 'white', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 6 }}>
            {feedback.result === 'correct' && '¡Excelente! Vas por muy buen camino.'}
            {feedback.result === 'partial' && 'Buen intento. Aquí tienes algunas sugerencias:'}
            {feedback.result === 'incorrect' && 'Gracias por intentarlo. Probemos con estas mejoras:'}
          </Text>
          <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
            <View style={{ height: 8, width: `${Math.max(0, Math.min(100, feedback.score))}%`, backgroundColor: feedback.score >= 85 ? '#22c55e' : feedback.score >= 60 ? '#f59e0b' : '#ef4444' }} />
          </View>
          <Text style={{ marginTop: 6, color: '#6b7280' }}>Puntaje: {feedback.score}/100</Text>

          {(() => {
            const errs = (feedback.errors && feedback.errors.length ? feedback.errors : feedback.feedback.grammar) || [];
            if (!errs.length) return null;
            return (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: '600', marginBottom: 6 }}>Detalles a mejorar</Text>
                {errs.map((e, i) => (
                  <Text key={i} style={{ color: '#dc2626', marginBottom: 4 }}>• {e}</Text>
                ))}
              </View>
            );
          })()}

          {(() => {
            const sugg = (feedback.improvements && feedback.improvements.length ? feedback.improvements : (feedback.suggestions || []));
            if (!sugg.length) return null;
            return (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: '600', marginBottom: 6 }}>Reformulaciones más naturales</Text>
                {sugg.map((s, i) => (
                  <Text key={i} style={{ marginBottom: 4 }}>• {s}</Text>
                ))}
              </View>
            );
          })()}
        </View>
      )}
      {(state === 'recording' || (canRecord && (!feedback || feedback.result !== 'correct'))) && (
        <View style={{ marginTop: 16 }}>
          {feedback && feedback.result !== 'correct' ? (
            <Text style={{ marginBottom: 8 }}>¿Quieres volver a intentarlo? Cuando estés listo, escribe o mantén presionado para grabar de nuevo.</Text>
          ) : null}

          <Text style={{ marginBottom: 6 }}>O escribe tu oración (opcional)</Text>
          <TextInput
            value={userText}
            onChangeText={setUserText}
            placeholder="Escribe aquí tu respuesta..."
            multiline
            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, minHeight: 60, backgroundColor: 'white' }}
          />
          <View style={{ height: 8 }} />
          {selected && userText.trim().length > 0 && (
            <Pressable
              onPress={async () => {
                try {
                  setState('evaluating');
                  const started = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, { cardId, storyId, sceneIndex });
                  setTranscript(userText.trim());
                  const ev = await api.post<EvalRes>(`/sessions/${started.sessionId}/evaluate`, { transcript: userText.trim(), label, example });
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
                backgroundColor: pressed ? '#0ea5e9' : '#38bdf8',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              })}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Evaluar texto</Text>
            </Pressable>
          )}
          <View style={{ height: 8 }} />
          <Pressable
            onPressIn={run}
            onPressOut={onRelease}
            style={({ pressed }) => ({
              backgroundColor: selected ? (pressed ? '#7c3aed' : '#8b5cf6') : '#9ca3af',
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {!selected ? 'Primero elige una opción' : state === 'recording' ? 'Suelta para detener' : 'Mantén para grabar'}
            </Text>
          </Pressable>
        </View>
      )}
      {error ? <Text style={{ marginTop: 12, color: 'red' }}>Error: {error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
