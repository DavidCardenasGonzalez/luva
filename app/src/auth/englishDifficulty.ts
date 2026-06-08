import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EnglishDifficulty } from './AuthProvider';

const STORAGE_KEY = '@luva/english_difficulty';
const DEFAULT_DIFFICULTY: EnglishDifficulty = 'medium';

export function normalizeEnglishDifficulty(value: unknown): EnglishDifficulty | undefined {
  const normalized = (typeof value === 'string' ? value : '').trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
    return normalized;
  }
  return undefined;
}

export async function readStoredEnglishDifficulty(): Promise<EnglishDifficulty> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return normalizeEnglishDifficulty(raw) || DEFAULT_DIFFICULTY;
  } catch {
    return DEFAULT_DIFFICULTY;
  }
}

export async function writeStoredEnglishDifficulty(value: EnglishDifficulty): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Best effort: persistence failures are non-fatal.
  }
}
