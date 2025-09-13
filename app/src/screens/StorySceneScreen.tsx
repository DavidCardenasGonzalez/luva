import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useRoute } from '@react-navigation/native';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import { api } from '../api/api';

export default function StorySceneScreen() {
  const route = useRoute<any>();
  const { storyId, sceneIndex = 0 } = route.params || {};
  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const [idx, setIdx] = useState<number>(sceneIndex);
  const [feedback, setFeedback] = useState<any>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [done, setDone] = useState<boolean>(false);

  const run = async () => {
    setFeedback(null); setTranscript('');
    const rec = await recorder.recordOnce();
    const started = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, { storyId, sceneIndex: idx });
    await uploader.put(started.uploadUrl, rec.blob, 'audio/m4a');
    const tr = await api.post<{ transcript: string }>(`/sessions/${started.sessionId}/transcribe`);
    setTranscript(tr.transcript);
    const adv = await api.post<{ sceneIndex: number; feedback: any; done: boolean }>(`/stories/${storyId}/advance`, { sessionId: started.sessionId, transcript: tr.transcript });
    setFeedback(adv.feedback);
    setDone(adv.done);
    setIdx(adv.sceneIndex);
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Story: {storyId}</Text>
      <Text>Scene: {idx}</Text>
      <Button title={done ? 'Completed 🎉' : 'Record & Advance'} onPress={run} />
      {transcript ? <Text style={{ marginTop: 8 }}>Transcript: {transcript}</Text> : null}
      {feedback ? <Text style={{ marginTop: 8 }}>Feedback: {JSON.stringify(feedback)}</Text> : null}
    </View>
  );
}

