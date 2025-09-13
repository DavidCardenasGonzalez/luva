import { useRef } from 'react';

export interface Recording {
  blob: Blob;
  durationMs: number;
}

export default function useAudioRecorder() {
  const isRecording = useRef(false);

  return {
    isRecording: () => isRecording.current,
    async start() {
      // TODO: implement with expo-av or native module
      isRecording.current = true;
    },
    async stop(): Promise<Recording> {
      isRecording.current = false;
      // Placeholder 1-second silent wav (empty Blob)
      return { blob: new Blob(), durationMs: 1000 };
    },
    async recordOnce(): Promise<Recording> {
      await this.start();
      return this.stop();
    },
  };
}

