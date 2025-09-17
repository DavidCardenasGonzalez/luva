// useAudioRecorder.ts (versión ajustada)
import { useRef } from 'react';
import { Audio } from 'expo-av';

export interface Recording {
  uri: string;
  durationMs: number;
  contentType: string; // 'audio/m4a'
}

async function setRecordMode() {
  // Forzar que, aun grabando, salga por altavoz
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    // iOS: altavoz en playAndRecord
    defaultToSpeaker: true,
    // Android: NO earpiece
    playThroughEarpieceAndroid: false,
    // (opcional) suaviza otras apps
    shouldDuckAndroid: true,
  });
}

async function setPlaybackMode() {
  console.log('Setting playback mode');
  const result = await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    defaultToSpeaker: true,
    playThroughEarpieceAndroid: false,
    shouldDuckAndroid: true,
  });
  console.log('Playback mode set', result);
}

export default function useAudioRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);

  return {
    isRecording: () => !!recordingRef.current,

    async start() {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Microphone permission denied');

      // 💡 Configura modo de GRABACIÓN ANTES de crear el Recording
      await setRecordMode();

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
    },

    async stop(): Promise<Recording> {
      const rec = recordingRef.current;
      if (!rec) throw new Error('Not recording');

      try {
        await rec.stopAndUnloadAsync();
      } finally {
        // Libera referencia pase lo que pase
        recordingRef.current = null;
      }

      const uri = rec.getURI()!;
      // ⚠️ En algunos Android el cambio de ruta tarda un “tick”.
      // Primero ponemos modo playback, luego esperamos un poquito.
      await setPlaybackMode();
      await new Promise((r) => setTimeout(r, 120)); // 100–200ms suele bastar

      return { uri, durationMs: 0, contentType: 'audio/m4a' };
    },

    async recordOnce(): Promise<Recording> {
      await this.start();
      await new Promise((r) => setTimeout(r, 3000));
      return this.stop();
    },

    // Útil si vas a reproducir TTS/sonidos después de otra pantalla
    async ensurePlaybackRoute() {
      await setPlaybackMode();
    },
  };
}
