import {
  CardProgressDocument,
  CardProgressEntry,
  CardProgressState,
  CardProgressStatus,
  MIN_PROGRESS_TIMESTAMP,
  StoryMissionProgress,
  StoryProgressDocument,
  StoryProgressEntry,
  StoryProgressItem,
  StoryProgressState,
  UserProgressRecord,
} from './types';

const CARD_STATUSES: CardProgressStatus[] = ['todo', 'learning', 'learned'];

export function emptyCardProgressDocument(): CardProgressDocument {
  return {
    updatedAt: MIN_PROGRESS_TIMESTAMP,
    items: {},
  };
}

export function emptyStoryProgressDocument(): StoryProgressDocument {
  return {
    updatedAt: MIN_PROGRESS_TIMESTAMP,
    items: {},
  };
}

export function emptyUserProgressRecord(): UserProgressRecord {
  return {
    cards: emptyCardProgressDocument(),
    stories: emptyStoryProgressDocument(),
  };
}

export function normalizeUserProgressRecord(input: unknown): UserProgressRecord {
  const raw = asRecord(input);
  return {
    cards: normalizeCardProgressDocument(raw?.cards),
    stories: normalizeStoryProgressDocument(raw?.stories),
  };
}

export function mergeCardProgressDocuments(
  base: unknown,
  incoming: unknown
): CardProgressDocument {
  const left = normalizeCardProgressDocument(base);
  const right = normalizeCardProgressDocument(incoming);
  const resetAt = maxTimestamp(left.resetAt, right.resetAt);
  const cardIds = new Set([...Object.keys(left.items), ...Object.keys(right.items)]);
  const items: Record<string, CardProgressEntry> = {};
  let updatedAt = maxTimestamp(left.updatedAt, right.updatedAt, resetAt);

  for (const cardId of cardIds) {
    const next = newerCardEntry(left.items[cardId], right.items[cardId]);
    if (!next) continue;
    if (resetAt && compareTimestamps(next.updatedAt, resetAt) <= 0) continue;
    items[cardId] = next;
    updatedAt = maxTimestamp(updatedAt, next.updatedAt);
  }

  return {
    updatedAt,
    ...(resetAt ? { resetAt } : {}),
    items,
  };
}

export function mergeStoryProgressDocuments(
  base: unknown,
  incoming: unknown
): StoryProgressDocument {
  const left = normalizeStoryProgressDocument(base);
  const right = normalizeStoryProgressDocument(incoming);
  const resetAt = maxTimestamp(left.resetAt, right.resetAt);
  const storyIds = new Set([...Object.keys(left.items), ...Object.keys(right.items)]);
  const items: Record<string, StoryProgressItem> = {};
  let updatedAt = maxTimestamp(left.updatedAt, right.updatedAt, resetAt);

  for (const storyId of storyIds) {
    const merged = mergeStoryProgressItems(left.items[storyId], right.items[storyId], resetAt);
    if (!merged) continue;
    items[storyId] = merged;
    updatedAt = maxTimestamp(updatedAt, merged.updatedAt);
  }

  return {
    updatedAt,
    ...(resetAt ? { resetAt } : {}),
    items,
  };
}

export function normalizeCardProgressDocument(input: unknown): CardProgressDocument {
  const raw = asRecord(input);
  if (!raw) {
    return emptyCardProgressDocument();
  }

  const itemsRaw = asRecord(raw.items);
  const items: Record<string, CardProgressEntry> = {};
  let updatedAt = asTimestamp(raw.updatedAt) || MIN_PROGRESS_TIMESTAMP;
  const resetAt = asTimestamp(raw.resetAt);

  for (const [cardId, value] of Object.entries(itemsRaw || {})) {
    const entry = normalizeCardProgressEntry(value);
    if (!entry) continue;
    if (resetAt && compareTimestamps(entry.updatedAt, resetAt) <= 0) continue;
    items[cardId] = entry;
    updatedAt = maxTimestamp(updatedAt, entry.updatedAt);
  }

  return {
    updatedAt,
    ...(resetAt ? { resetAt } : {}),
    items,
  };
}

export function normalizeStoryProgressDocument(input: unknown): StoryProgressDocument {
  const raw = asRecord(input);
  if (!raw) {
    return emptyStoryProgressDocument();
  }

  const itemsRaw = asRecord(raw.items);
  const items: Record<string, StoryProgressItem> = {};
  let updatedAt = asTimestamp(raw.updatedAt) || MIN_PROGRESS_TIMESTAMP;
  const resetAt = asTimestamp(raw.resetAt);

  for (const [storyId, value] of Object.entries(itemsRaw || {})) {
    const item = normalizeStoryProgressItem(value, resetAt);
    if (!item) continue;
    items[storyId] = item;
    updatedAt = maxTimestamp(updatedAt, item.updatedAt);
  }

  return {
    updatedAt,
    ...(resetAt ? { resetAt } : {}),
    items,
  };
}

export function parseStoredCardProgressDocument(input: unknown): CardProgressDocument {
  const next = normalizeCardProgressDocument(input);
  if (Object.keys(next.items).length || next.resetAt || next.updatedAt !== MIN_PROGRESS_TIMESTAMP) {
    return next;
  }

  const raw = asRecord(input);
  if (!raw) {
    return next;
  }

  const migratedAt = new Date().toISOString();
  const items: Record<string, CardProgressEntry> = {};
  for (const [cardId, value] of Object.entries(raw)) {
    const status = asCardStatus(value);
    if (!status) continue;
    items[cardId] = {
      status,
      updatedAt: migratedAt,
    };
  }

  if (!Object.keys(items).length) {
    return next;
  }

  return {
    updatedAt: migratedAt,
    items,
  };
}

export function parseStoredStoryProgressDocument(input: unknown): StoryProgressDocument {
  const next = normalizeStoryProgressDocument(input);
  if (Object.keys(next.items).length || next.resetAt || next.updatedAt !== MIN_PROGRESS_TIMESTAMP) {
    return next;
  }

  const raw = asRecord(input);
  if (!raw) {
    return next;
  }

  const items: Record<string, StoryProgressItem> = {};
  let updatedAt = MIN_PROGRESS_TIMESTAMP;
  for (const [storyId, value] of Object.entries(raw)) {
    const legacyEntry = normalizeLegacyStoryProgressEntry(value);
    if (!legacyEntry) continue;
    const storyItem: StoryProgressItem = {
      updatedAt: maxTimestamp(
        legacyEntry.storyCompletedAt,
        ...Object.values(legacyEntry.completedMissions)
      ),
      ...(legacyEntry.storyCompletedAt ? { storyCompletedAt: legacyEntry.storyCompletedAt } : {}),
      completedMissions: { ...legacyEntry.completedMissions },
    };
    items[storyId] = storyItem;
    updatedAt = maxTimestamp(updatedAt, storyItem.updatedAt);
  }

  if (!Object.keys(items).length) {
    return next;
  }

  return {
    updatedAt,
    items,
  };
}

export function buildCardProgressState(document: CardProgressDocument): CardProgressState {
  const state: CardProgressState = {};
  for (const [cardId, entry] of Object.entries(document.items)) {
    state[cardId] = entry.status;
  }
  return state;
}

export function buildStoryProgressState(document: StoryProgressDocument): StoryProgressState {
  const state: StoryProgressState = {};
  for (const [storyId, item] of Object.entries(document.items)) {
    const completedMissions = filterCompletedMissions(item.completedMissions, document.resetAt, item.deletedAt);
    const storyCompletedAt = filterTimestamp(item.storyCompletedAt, document.resetAt, item.deletedAt);
    if (!storyCompletedAt && !Object.keys(completedMissions).length) {
      continue;
    }
    state[storyId] = {
      completedMissions,
      storyCompleted: Boolean(storyCompletedAt),
      ...(storyCompletedAt ? { storyCompletedAt } : {}),
    };
  }
  return state;
}

export function areCardProgressDocumentsEqual(
  left: CardProgressDocument,
  right: CardProgressDocument
): boolean {
  if (left.updatedAt !== right.updatedAt || left.resetAt !== right.resetAt) {
    return false;
  }
  const leftKeys = Object.keys(left.items);
  const rightKeys = Object.keys(right.items);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    const leftEntry = left.items[key];
    const rightEntry = right.items[key];
    if (!rightEntry) return false;
    if (leftEntry.status !== rightEntry.status || leftEntry.updatedAt !== rightEntry.updatedAt) {
      return false;
    }
  }
  return true;
}

export function areStoryProgressDocumentsEqual(
  left: StoryProgressDocument,
  right: StoryProgressDocument
): boolean {
  if (left.updatedAt !== right.updatedAt || left.resetAt !== right.resetAt) {
    return false;
  }
  const leftKeys = Object.keys(left.items);
  const rightKeys = Object.keys(right.items);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    const leftItem = left.items[key];
    const rightItem = right.items[key];
    if (!rightItem) return false;
    if (
      leftItem.updatedAt !== rightItem.updatedAt ||
      leftItem.deletedAt !== rightItem.deletedAt ||
      leftItem.storyCompletedAt !== rightItem.storyCompletedAt
    ) {
      return false;
    }
    const leftMissionIds = Object.keys(leftItem.completedMissions);
    const rightMissionIds = Object.keys(rightItem.completedMissions);
    if (leftMissionIds.length !== rightMissionIds.length) {
      return false;
    }
    for (const missionId of leftMissionIds) {
      if (leftItem.completedMissions[missionId] !== rightItem.completedMissions[missionId]) {
        return false;
      }
    }
  }
  return true;
}

export function statusForCard(
  document: CardProgressDocument,
  cardId?: string | number | null
): CardProgressStatus {
  if (cardId === undefined || cardId === null) return 'todo';
  const key = String(cardId);
  return document.items[key]?.status ?? 'todo';
}

function normalizeCardProgressEntry(input: unknown): CardProgressEntry | undefined {
  const raw = asRecord(input);
  if (!raw) return undefined;
  const status = asCardStatus(raw.status);
  const updatedAt = asTimestamp(raw.updatedAt);
  if (!status || !updatedAt) return undefined;
  return { status, updatedAt };
}

function newerCardEntry(
  left?: CardProgressEntry,
  right?: CardProgressEntry
): CardProgressEntry | undefined {
  if (!left) return right;
  if (!right) return left;
  return compareTimestamps(left.updatedAt, right.updatedAt) >= 0 ? left : right;
}

function normalizeLegacyStoryProgressEntry(input: unknown): StoryProgressEntry | undefined {
  const raw = asRecord(input);
  if (!raw) return undefined;
  const completedMissions = filterCompletedMissions(asRecord(raw.completedMissions));
  const storyCompletedAt = asTimestamp(raw.storyCompletedAt);
  const storyCompleted =
    raw.storyCompleted === true || (storyCompletedAt ? true : false);

  if (!storyCompleted && !Object.keys(completedMissions).length) {
    return undefined;
  }

  return {
    completedMissions,
    storyCompleted,
    ...(storyCompletedAt ? { storyCompletedAt } : {}),
  };
}

function normalizeStoryProgressItem(
  input: unknown,
  resetAt?: string
): StoryProgressItem | undefined {
  const raw = asRecord(input);
  if (!raw) return undefined;

  const completedMissions = filterCompletedMissions(asRecord(raw.completedMissions), resetAt, asTimestamp(raw.deletedAt));
  const deletedAt = asTimestamp(raw.deletedAt);
  const storyCompletedAt = filterTimestamp(asTimestamp(raw.storyCompletedAt), resetAt, deletedAt);
  const updatedAt = maxTimestamp(
    asTimestamp(raw.updatedAt),
    deletedAt,
    storyCompletedAt,
    ...Object.values(completedMissions)
  );

  if (!deletedAt && !storyCompletedAt && !Object.keys(completedMissions).length) {
    return undefined;
  }

  return {
    updatedAt,
    ...(deletedAt ? { deletedAt } : {}),
    ...(storyCompletedAt ? { storyCompletedAt } : {}),
    completedMissions,
  };
}

function mergeStoryProgressItems(
  base: StoryProgressItem | undefined,
  incoming: StoryProgressItem | undefined,
  resetAt?: string
): StoryProgressItem | undefined {
  const left = normalizeStoryProgressItem(base, resetAt);
  const right = normalizeStoryProgressItem(incoming, resetAt);
  if (!left) return right;
  if (!right) return left;

  const deletedAt = maxTimestamp(left.deletedAt, right.deletedAt);
  const storyCompletedAt = filterTimestamp(
    maxTimestamp(left.storyCompletedAt, right.storyCompletedAt),
    resetAt,
    deletedAt
  );
  const missionIds = new Set([
    ...Object.keys(left.completedMissions),
    ...Object.keys(right.completedMissions),
  ]);
  const completedMissions: StoryMissionProgress = {};
  let updatedAt = maxTimestamp(left.updatedAt, right.updatedAt, deletedAt, storyCompletedAt);

  for (const missionId of missionIds) {
    const completedAt = filterTimestamp(
      maxTimestamp(left.completedMissions[missionId], right.completedMissions[missionId]),
      resetAt,
      deletedAt
    );
    if (!completedAt) continue;
    completedMissions[missionId] = completedAt;
    updatedAt = maxTimestamp(updatedAt, completedAt);
  }

  if (!deletedAt && !storyCompletedAt && !Object.keys(completedMissions).length) {
    return undefined;
  }

  return {
    updatedAt,
    ...(deletedAt ? { deletedAt } : {}),
    ...(storyCompletedAt ? { storyCompletedAt } : {}),
    completedMissions,
  };
}

function filterCompletedMissions(
  input?: Record<string, unknown>,
  resetAt?: string,
  deletedAt?: string
): StoryMissionProgress {
  const completedMissions: StoryMissionProgress = {};
  for (const [missionId, value] of Object.entries(input || {})) {
    const completedAt = filterTimestamp(asTimestamp(value), resetAt, deletedAt);
    if (!completedAt) continue;
    completedMissions[missionId] = completedAt;
  }
  return completedMissions;
}

function filterTimestamp(
  value?: string,
  resetAt?: string,
  deletedAt?: string
): string | undefined {
  if (!value) return undefined;
  if (resetAt && compareTimestamps(value, resetAt) <= 0) return undefined;
  if (deletedAt && compareTimestamps(value, deletedAt) <= 0) return undefined;
  return value;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function asTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function asCardStatus(value: unknown): CardProgressStatus | undefined {
  return typeof value === 'string' && CARD_STATUSES.includes(value as CardProgressStatus)
    ? (value as CardProgressStatus)
    : undefined;
}

function maxTimestamp(...values: Array<string | undefined>): string {
  let next = MIN_PROGRESS_TIMESTAMP;
  for (const value of values) {
    if (!value) continue;
    if (compareTimestamps(value, next) > 0) {
      next = value;
    }
  }
  return next;
}

function compareTimestamps(left?: string, right?: string): number {
  return (left || MIN_PROGRESS_TIMESTAMP).localeCompare(right || MIN_PROGRESS_TIMESTAMP);
}
