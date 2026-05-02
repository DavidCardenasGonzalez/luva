import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@luva/learned-lessons-v1';

async function getLearnedSet(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export async function getLearnedLessonIds(): Promise<Set<string>> {
  return getLearnedSet();
}

export async function isLessonLearned(lessonId: string): Promise<boolean> {
  const set = await getLearnedSet();
  return set.has(lessonId);
}

export async function markLessonLearned(lessonId: string): Promise<void> {
  try {
    const set = await getLearnedSet();
    set.add(lessonId);
    await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // continue even if persistence fails
  }
}
