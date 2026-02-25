import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_STORAGE_KEY = 'luva_seen_tours_v1';

export type TourScreenId = 'home' | 'deck' | 'practice' | 'stories' | 'storyScene';

type SeenToursMap = Partial<Record<TourScreenId, true>>;

async function readSeenTours(): Promise<SeenToursMap> {
  try {
    const raw = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SeenToursMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function hasSeenTour(screen: TourScreenId): Promise<boolean> {
  const seenTours = await readSeenTours();
  return !!seenTours[screen];
}

export async function markTourAsSeen(screen: TourScreenId): Promise<void> {
  const seenTours = await readSeenTours();
  seenTours[screen] = true;
  try {
    await AsyncStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(seenTours));
  } catch {
    // ignore persistence failures
  }
}
