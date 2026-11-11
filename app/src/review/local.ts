import AsyncStorage from '@react-native-async-storage/async-storage';
import { reviewApi } from './api';
import type { ReviewItem, ReviewStatus } from './types';

type Entry = { item: ReviewItem; owner?: string; remoteId?: string; synced?: boolean };
const KEY = 'luva.review.local.v1';
let queue: Promise<unknown> = Promise.resolve();
// Serialize read/modify/write operations, including imports, so a save cannot be lost.
function transaction<T>(work: (entries: Entry[]) => Promise<T>): Promise<T> {
  const result = queue.then(async () => {
    const raw = await AsyncStorage.getItem(KEY);
    const entries: Entry[] = raw ? JSON.parse(raw) : [];
    const value = await work(entries);
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
    return value;
  });
  queue = result.catch(() => {});
  return result;
}
function identity(item: Pick<ReviewItem, 'originalText' | 'sourceLanguage' | 'targetLanguage'>) {
  return [item.originalText.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase(), item.sourceLanguage.toLowerCase(), item.targetLanguage.toLowerCase()].join('\u0000');
}
export const localReviews = {
  save: (input: Parameters<typeof reviewApi.save>[0]) => transaction(async entries => {
    const existing = entries.find(entry => !entry.owner && identity(entry.item) === identity(input));
    if (existing) return existing.item;
    const now = new Date().toISOString();
    const item: ReviewItem = { ...input, id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`, status: 'pending', createdAt: now, updatedAt: now };
    entries.push({ item });
    return item;
  }),
  list: (status?: ReviewStatus) => transaction(async entries => ({ items: entries.filter(entry => !entry.owner && (!status || entry.item.status === status)).map(entry => entry.item).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) })),
  get: (id: string, owner?: string) => transaction(async entries => {
    const entry = entries.find(entry => entry.item.id === id && entry.owner === owner);
    if (!entry) throw new Error('REVIEW_NOT_FOUND');
    return entry;
  }),
  setStatus: (id: string, status: ReviewStatus) => transaction(async entries => {
    const entry = entries.find(entry => entry.item.id === id && !entry.owner);
    if (!entry) throw new Error('REVIEW_NOT_FOUND');
    entry.item = { ...entry.item, status, updatedAt: new Date().toISOString(), completedAt: status === 'completed' ? new Date().toISOString() : undefined };
    return entry.item;
  }),
  sync: (owner: string, isCurrent: () => boolean) => transaction(async entries => {
    if (!isCurrent()) return;
    // Claim before network access; a failed import must never migrate to another account.
    for (const entry of entries) if (!entry.owner) entry.owner = owner;
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
    for (const entry of entries) {
      if (entry.owner !== owner || entry.synced) continue;
      if (!isCurrent()) throw new Error('SESSION_CHANGED');
      const { item } = await reviewApi.save(entry.item);
      if (!isCurrent()) throw new Error('SESSION_CHANGED');
      entry.remoteId = item.id;
      // Preserve completed progress without reopening an existing completed server item.
      if (entry.item.status === 'completed' && item.status !== 'completed') {
        await reviewApi.setStatus(item.id, 'completed');
      }
      entry.synced = true;
      await AsyncStorage.setItem(KEY, JSON.stringify(entries));
    }
  }),
};
