import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MicrodramaProgressSummary } from './types';

export type LocalMicrodramaProgress = {
  summaries: Record<string, MicrodramaProgressSummary>;
  updatedAt: string;
};

function storageKey(owner: string) {
  return `@luva/microdramas/progress:${owner}`;
}

export async function readMicrodramaProgress(owner: string): Promise<LocalMicrodramaProgress> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(owner));
    const parsed = raw ? JSON.parse(raw) : undefined;
    if (parsed && typeof parsed === 'object' && parsed.summaries && typeof parsed.summaries === 'object') return parsed;
  } catch {}
  return { summaries: {}, updatedAt: new Date(0).toISOString() };
}

export async function writeMicrodramaProgress(owner: string, summaries: Record<string, MicrodramaProgressSummary>) {
  await AsyncStorage.setItem(storageKey(owner), JSON.stringify({ summaries, updatedAt: new Date().toISOString() }));
}

export async function clearMicrodramaProgress(owner: string) {
  await AsyncStorage.removeItem(storageKey(owner));
}
