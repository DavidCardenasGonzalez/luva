import React, { useState } from 'react';
import { View, Text, Button, Pressable, ScrollView } from 'react-native';
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

  // Press-and-hold: start on pressIn, stop & process on pressOut
  const run = async () => {
    if (!selected) {
      return;
    }
    setFeedback(null);
    setTranscript('');
    setState('recording');
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
    const tr = await api.post<{ transcript: string }>(`/sessions/${started.sessionId}/transcribe`);
    setTranscript(tr.transcript);

    setState('evaluating');
    const ev = await api.post<EvalRes>(`/sessions/${started.sessionId}/evaluate`, { transcript: tr.transcript, label, example });
    console.log('Evaluation:', ev);
    setFeedback(ev);

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
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
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
            <Pressable key={k} onPress={() => setSelected(k)} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: selected === k ? (answer && selected === answer ? '#dcfce7' : '#fee2e2') : 'white', marginBottom: 8 }}>
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
      <Pressable
        onPressIn={run}
        onPressOut={onRelease}
        style={({ pressed }) => ({
          backgroundColor: selected ? (pressed ? '#7c3aed' : '#8b5cf6') : '#9ca3af',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
        })}
        disabled={!selected}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>
          {!selected ? 'Primero elige una opción' : state === 'recording' ? 'Suelta para detener' : 'Mantén para grabar'}
        </Text>
      </Pressable>
      {transcript ? <Text style={{ marginTop: 12 }}>Transcript: {transcript}</Text> : null}
      {feedback && (
        <View style={{ marginTop: 16 }}>
          <Text>Score: {feedback.score}</Text>
          <Text>Result: {feedback.result}</Text>
          {!!feedback.errors?.length && (
            <Text style={{ color: 'red' }}>Errors: {feedback.errors.join('; ')}</Text>
          )}
          <Text>Grammar: {feedback.feedback.grammar.join('; ')}</Text>
          <Text>Wording: {feedback.feedback.wording.join('; ')}</Text>
          <Text>Naturalness: {feedback.feedback.naturalness.join('; ')}</Text>
          <Text>Register: {feedback.feedback.register.join('; ')}</Text>
          {!!feedback.improvements?.length && (
            <Text style={{ marginTop: 8 }}>Better phrasing: {feedback.improvements.join(' | ')}</Text>
          )}
        </View>
      )}
      {error ? <Text style={{ marginTop: 12, color: 'red' }}>Error: {error}</Text> : null}
    </ScrollView>
  );
}
