import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';

export interface Recording {
  uri: string;
  durationMs: number;
  contentType: string;
}

const PERMISSION_DENIED_ERROR = 'Activa el permiso de microfono para grabar.';
const BACKGROUND_RECORDING_ERROR =
  'Vuelve a Luva para grabar. No se puede iniciar audio en segundo plano.';
const START_CANCELED_ERROR = 'La grabacion se cancelo al salir de la app.';

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? '');
}

function isBackgroundAudioError(error: unknown): boolean {
  const message = readErrorMessage(error).toLowerCase();
  return (
    message.includes('currently in the background') ||
    message.includes('audio session could not be activated') ||
    message.includes('in the background')
  );
}

async function setRecordMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    defaultToSpeaker: true,
    playThroughEarpieceAndroid: false,
    shouldDuckAndroid: true,
  });
}

async function setPlaybackMode(ignoreBackgroundErrors = false) {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      defaultToSpeaker: true,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    if (ignoreBackgroundErrors && isBackgroundAudioError(error)) {
      return;
    }
    throw error;
  }
}

async function waitForAppToBeActive(timeoutMs = 1200): Promise<boolean> {
  if (AppState.currentState === 'active') {
    return true;
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = (value: boolean) => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timeoutId);
      sub.remove();
      resolve(value);
    };

    const timeoutId = setTimeout(() => finish(false), timeoutMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        finish(true);
      }
    });
  });
}

export default function useAudioRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isStartingRef = useRef(false);
  const lifecycleTokenRef = useRef(0);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    const current = await Audio.getPermissionsAsync();
    if (current.granted) {
      return true;
    }
    if (!current.canAskAgain) {
      return false;
    }
    const requested = await Audio.requestPermissionsAsync();
    return requested.granted;
  }, []);

  const isRecording = useCallback(() => !!recordingRef.current, []);
  const isStarting = useCallback(() => isStartingRef.current, []);

  const cancel = useCallback(async () => {
    lifecycleTokenRef.current += 1;
    isStartingRef.current = false;
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (rec) {
      try {
        await rec.stopAndUnloadAsync();
      } catch {
        // ignore cleanup errors on forced cancel
      }
    }
    await setPlaybackMode(true);
  }, []);

  const start = useCallback(async () => {
    if (recordingRef.current || isStartingRef.current) {
      throw new Error('Recorder is busy');
    }
    const token = lifecycleTokenRef.current;
    isStartingRef.current = true;
    try {
      const granted = await ensurePermission();
      if (!granted) {
        throw new Error(PERMISSION_DENIED_ERROR);
      }
      if (token !== lifecycleTokenRef.current) {
        throw new Error(START_CANCELED_ERROR);
      }
      const activeBeforeRecordMode = await waitForAppToBeActive();
      if (!activeBeforeRecordMode || appStateRef.current !== 'active') {
        throw new Error(BACKGROUND_RECORDING_ERROR);
      }

      try {
        await setRecordMode();
      } catch (error) {
        if (isBackgroundAudioError(error)) {
          throw new Error(BACKGROUND_RECORDING_ERROR);
        }
        throw error;
      }

      if (token !== lifecycleTokenRef.current) {
        throw new Error(START_CANCELED_ERROR);
      }
      const activeBeforeStart = await waitForAppToBeActive();
      if (!activeBeforeStart || appStateRef.current !== 'active') {
        throw new Error(BACKGROUND_RECORDING_ERROR);
      }

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      if (token !== lifecycleTokenRef.current) {
        try {
          await rec.stopAndUnloadAsync();
        } catch {
          // ignore cleanup errors if start was canceled mid-flight
        }
        throw new Error(START_CANCELED_ERROR);
      }
      await rec.startAsync();
      recordingRef.current = rec;
    } catch (error) {
      await setPlaybackMode(true);
      throw error;
    } finally {
      isStartingRef.current = false;
    }
  }, [ensurePermission]);

  const stop = useCallback(async (): Promise<Recording> => {
    const rec = recordingRef.current;
    if (!rec) {
      throw new Error('Not recording');
    }
    recordingRef.current = null;
    lifecycleTokenRef.current += 1;

    let durationMs = 0;
    try {
      const status = await rec.getStatusAsync();
      durationMs = typeof status.durationMillis === 'number' ? status.durationMillis : 0;
    } catch {
      durationMs = 0;
    }

    try {
      try {
        await rec.stopAndUnloadAsync();
      } catch (error) {
        const maybeUri = rec.getURI();
        if (!maybeUri) {
          throw error;
        }
      }
    } finally {
      await setPlaybackMode(true);
    }

    const uri = rec.getURI();
    if (!uri) {
      throw new Error('No se pudo obtener el audio grabado.');
    }

    return { uri, durationMs, contentType: 'audio/m4a' };
  }, []);

  const recordOnce = useCallback(async (): Promise<Recording> => {
    await start();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return stop();
  }, [start, stop]);

  const ensurePlaybackRoute = useCallback(async () => {
    await setPlaybackMode(true);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      if (nextState !== 'background') {
        return;
      }
      if (!recordingRef.current && !isStartingRef.current) {
        return;
      }
      void cancel().catch(() => {
        // ignore background cleanup errors
      });
    });

    return () => {
      sub.remove();
      void cancel().catch(() => {
        // ignore unmount cleanup errors
      });
    };
  }, [cancel]);

  return useMemo(
    () => ({
      isRecording,
      isStarting,
      ensurePermission,
      start,
      stop,
      cancel,
      recordOnce,
      ensurePlaybackRoute,
    }),
    [cancel, ensurePermission, ensurePlaybackRoute, isRecording, isStarting, recordOnce, start, stop]
  );
}
