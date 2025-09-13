import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import { useRoute } from '@react-navigation/native';
import { api } from '../api/api';

type EvalRes = {
  score: number;
  result: 'correct'|'partial'|'incorrect';
  feedback: { grammar: string[]; wording: string[]; naturalness: string[]; register: string[] };
};

export default function PracticeScreen() {
  const route = useRoute<any>();
  const { cardId, storyId, sceneIndex, prompt } = route.params || {};
  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const [transcript, setTranscript] = useState('');
  const [state, setState] = useState<'idle'|'recording'|'uploading'|'transcribing'|'evaluating'|'done'>('idle');
  const [feedback, setFeedback] = useState<EvalRes | null>(null);

  const run = async () => {
    setFeedback(null);
    setTranscript('');
    setState('recording');
    const rec = await recorder.recordOnce();

    setState('uploading');
    const startBody: any = {};
    if (cardId) startBody.cardId = cardId;
    if (storyId) { startBody.storyId = storyId; startBody.sceneIndex = sceneIndex ?? 0; }
    const started = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, startBody);
    await uploader.put(started.uploadUrl, rec.blob, 'audio/m4a');

    setState('transcribing');
    const tr = await api.post<{ transcript: string }>(`/sessions/${started.sessionId}/transcribe`);
    setTranscript(tr.transcript);

    setState('evaluating');
    const ev = await api.post<EvalRes>(`/sessions/${started.sessionId}/evaluate`, { transcript: tr.transcript });
    setFeedback(ev);

    if (cardId) {
      // Complete card and update points/streak server-side
      const comp: any = await api.post(`/cards/${cardId}/complete`, { result: ev.result, score: ev.score });
      if (comp?.streak === 5) {
        // simple streak modal/alert
        console.log('Streak x5! Bonus awarded.');
      }
    }
    setState('done');
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Practice</Text>
      {prompt ? <Text style={{ marginTop: 8 }}>{prompt}</Text> : null}
      <Text style={{ marginTop: 8 }}>State: {state}</Text>
      <View style={{ height: 12 }} />
      <Button title="Record & Evaluate" onPress={run} />
      {transcript ? <Text style={{ marginTop: 12 }}>Transcript: {transcript}</Text> : null}
      {feedback && (
        <View style={{ marginTop: 16 }}>
          <Text>Score: {feedback.score}</Text>
          <Text>Result: {feedback.result}</Text>
          <Text>Grammar: {feedback.feedback.grammar.join('; ')}</Text>
          <Text>Wording: {feedback.feedback.wording.join('; ')}</Text>
          <Text>Naturalness: {feedback.feedback.naturalness.join('; ')}</Text>
          <Text>Register: {feedback.feedback.register.join('; ')}</Text>
        </View>
      )}
    </View>
  );
}
