export const MIN_PROGRESS_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export type CardProgressStatus = "todo" | "learning" | "learned";

export type CardProgressEntry = {
  status: CardProgressStatus;
  updatedAt: string;
};

export type CardProgressDocument = {
  updatedAt: string;
  resetAt?: string;
  items: Record<string, CardProgressEntry>;
};

export type StoryProgressItem = {
  updatedAt: string;
  deletedAt?: string;
  storyCompletedAt?: string;
  completedMissions: Record<string, string>;
};

export type StoryProgressDocument = {
  updatedAt: string;
  resetAt?: string;
  items: Record<string, StoryProgressItem>;
};

export type UserProgressRecord = {
  cards: CardProgressDocument;
  stories: StoryProgressDocument;
};

const CARD_STATUSES: CardProgressStatus[] = ["todo", "learning", "learned"];

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

export function mergeUserProgressRecords(base: unknown, incoming: unknown): UserProgressRecord {
  const baseRecord = normalizeUserProgressRecord(base);
  const rawIncoming = asRecord(incoming);
  if (!rawIncoming) {
    return baseRecord;
  }

  return {
    cards: hasOwn(rawIncoming, "cards")
      ? mergeCardProgressDocuments(baseRecord.cards, rawIncoming.cards)
      : baseRecord.cards,
    stories: hasOwn(rawIncoming, "stories")
      ? mergeStoryProgressDocuments(baseRecord.stories, rawIncoming.stories)
      : baseRecord.stories,
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

function normalizeStoryProgressItem(
  input: unknown,
  resetAt?: string
): StoryProgressItem | undefined {
  const raw = asRecord(input);
  if (!raw) return undefined;

  const completedRaw = asRecord(raw.completedMissions);
  const completedMissions: Record<string, string> = {};
  const deletedAt = asTimestamp(raw.deletedAt);
  const storyCompletedAt = filterTimestamp(
    asTimestamp(raw.storyCompletedAt),
    resetAt,
    deletedAt
  );

  let updatedAt = maxTimestamp(
    asTimestamp(raw.updatedAt),
    deletedAt,
    storyCompletedAt
  );

  for (const [missionId, value] of Object.entries(completedRaw || {})) {
    const completedAt = filterTimestamp(asTimestamp(value), resetAt, deletedAt);
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
  const completedMissions: Record<string, string> = {};
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
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function asTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function asCardStatus(value: unknown): CardProgressStatus | undefined {
  return typeof value === "string" && CARD_STATUSES.includes(value as CardProgressStatus)
    ? (value as CardProgressStatus)
    : undefined;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
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
