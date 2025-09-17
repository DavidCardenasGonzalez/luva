import { useRef } from 'react';
import { Audio } from 'expo-av';

export interface Recording {
  uri: string;
  durationMs: number;
  contentType: string; // 'audio/m4a'
}

export default function useAudioRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);

  return {
    isRecording: () => !!recordingRef.current,
    async start() {
      const { status } = await Audio.requestPermissionsAsync();
      if (!status || status !== 'granted') throw new Error('Microphone permission denied');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
    },
    async stop(): Promise<Recording> {
      const rec = recordingRef.current;
      if (!rec) throw new Error('Not recording');
      await rec.stopAndUnloadAsync();
      recordingRef.current = null;
      const uri = rec.getURI()!;
      // duration isn't always available; attempt stat for size/time if needed
      return { uri, durationMs: 0, contentType: 'audio/m4a' };
    },
    async recordOnce(): Promise<Recording> {
      await this.start();
      // Simple 3-second capture; in UI you can add a toggle to stop
      await new Promise((r) => setTimeout(r, 3000));
      return this.stop();
    },
  };
}
