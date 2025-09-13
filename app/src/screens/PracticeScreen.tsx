import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import useSession from '../shared/useSession';

export default function PracticeScreen() {
  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const { startSession, transcribe, evaluate } = useSession();
  const [feedback, setFeedback] = useState<any>(null);

  const onPractice = async () => {
    const { sessionId, uploadUrl } = await startSession();
    const audio = await recorder.recordOnce();
    await uploader.put(uploadUrl, audio.blob, 'audio/mp4');
    const { transcript } = await transcribe(sessionId);
    const evalRes = await evaluate(sessionId, transcript);
    setFeedback(evalRes);
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Practice</Text>
      <Text>Tap record and speak your answer.</Text>
      <View style={{ height: 12 }} />
      <Button title="Record & Evaluate" onPress={onPractice} />
      {feedback && (
        <View style={{ marginTop: 16 }}>
          <Text>Score: {feedback.score}</Text>
          <Text>Result: {feedback.result}</Text>
        </View>
      )}
    </View>
  );
}

