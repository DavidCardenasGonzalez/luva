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

export type CharacterProgressItem = {
  updatedAt: string;
  deletedAt?: string;
  completedAt?: string;
};

export type CharacterProgressDocument = {
  updatedAt: string;
  resetAt?: string;
  items: Record<string, CharacterProgressItem>;
};

export type UserProgressRecord = {
  cards: CardProgressDocument;
  characters: CharacterProgressDocument;
};

const CARD_STATUSES: CardProgressStatus[] = ["todo", "learning", "learned"];

export function emptyCardProgressDocument(): CardProgressDocument {
  return {
    updatedAt: MIN_PROGRESS_TIMESTAMP,
    items: {},
  };
}

export function emptyCharacterProgressDocument(): CharacterProgressDocument {
  return {
    updatedAt: MIN_PROGRESS_TIMESTAMP,
    items: {},
  };
}

export function emptyUserProgressRecord(): UserProgressRecord {
  return {
    cards: emptyCardProgressDocument(),
    characters: emptyCharacterProgressDocument(),
  };
}

export function normalizeUserProgressRecord(input: unknown): UserProgressRecord {
  const raw = asRecord(input);
  // Accept both new (`characters`) and legacy (`stories`) input keys.
  const charactersSource = raw && (raw.characters ?? raw.stories);
  return {
    cards: normalizeCardProgressDocument(raw?.cards),
    characters: normalizeCharacterProgressDocument(charactersSource),
  };
}

export function mergeUserProgressRecords(base: unknown, incoming: unknown): UserProgressRecord {
  const baseRecord = normalizeUserProgressRecord(base);
  const rawIncoming = asRecord(incoming);
  if (!rawIncoming) {
    return baseRecord;
  }

  const hasCharactersInput = hasOwn(rawIncoming, "characters") || hasOwn(rawIncoming, "stories");
  return {
    cards: hasOwn(rawIncoming, "cards")
      ? mergeCardProgressDocuments(baseRecord.cards, rawIncoming.cards)
      : baseRecord.cards,
    characters: hasCharactersInput
      ? mergeCharacterProgressDocuments(
          baseRecord.characters,
          rawIncoming.characters ?? rawIncoming.stories
        )
      : baseRecord.characters,
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

export function normalizeCharacterProgressDocument(input: unknown): CharacterProgressDocument {
  const raw = asRecord(input);
  if (!raw) {
    return emptyCharacterProgressDocument();
  }

  const itemsRaw = asRecord(raw.items);
  const items: Record<string, CharacterProgressItem> = {};
  let updatedAt = asTimestamp(raw.updatedAt) || MIN_PROGRESS_TIMESTAMP;
  const resetAt = asTimestamp(raw.resetAt);

  for (const [key, value] of Object.entries(itemsRaw || {})) {
    // Each item may be a new-shape CharacterProgressItem (key = characterId)
    // or a legacy story progress item (key = storyId, value.completedMissions = { missionId: ts }).
    const expanded = expandToCharacterEntries(key, value, resetAt);
    for (const [characterId, entry] of expanded) {
      const prior = items[characterId];
      const next = mergeCharacterEntries(prior, entry, resetAt);
      if (!next) continue;
      items[characterId] = next;
      updatedAt = maxTimestamp(updatedAt, next.updatedAt);
    }
  }

  return {
    updatedAt,
    ...(resetAt ? { resetAt } : {}),
    items,
  };
}

export function mergeCharacterProgressDocuments(
  base: unknown,
  incoming: unknown
): CharacterProgressDocument {
  const left = normalizeCharacterProgressDocument(base);
  const right = normalizeCharacterProgressDocument(incoming);
  const resetAt = maxTimestamp(left.resetAt, right.resetAt);
  const characterIds = new Set([...Object.keys(left.items), ...Object.keys(right.items)]);
  const items: Record<string, CharacterProgressItem> = {};
  let updatedAt = maxTimestamp(left.updatedAt, right.updatedAt, resetAt);

  for (const characterId of characterIds) {
    const merged = mergeCharacterEntries(left.items[characterId], right.items[characterId], resetAt);
    if (!merged) continue;
    items[characterId] = merged;
    updatedAt = maxTimestamp(updatedAt, merged.updatedAt);
  }

  return {
    updatedAt,
    ...(resetAt ? { resetAt } : {}),
    items,
  };
}

/**
 * Build the legacy `stories` shape from the canonical character progress so
 * older mobile clients (pre-character migration) can keep reading progress.
 * Each character entry contributes a `storyId.completedMissions[missionId]`
 * pair, derived by splitting the characterId on the first colon.
 */
export function deriveLegacyStoriesDocument(
  doc: CharacterProgressDocument
): {
  updatedAt: string;
  resetAt?: string;
  items: Record<
    string,
    {
      updatedAt: string;
      deletedAt?: string;
      storyCompletedAt?: string;
      completedMissions: Record<string, string>;
    }
  >;
} {
  const items: Record<
    string,
    {
      updatedAt: string;
      deletedAt?: string;
      storyCompletedAt?: string;
      completedMissions: Record<string, string>;
    }
  > = {};

  for (const [characterId, entry] of Object.entries(doc.items)) {
    const { storyId, missionId } = splitCharacterId(characterId);
    if (!items[storyId]) {
      items[storyId] = {
        updatedAt: entry.updatedAt,
        completedMissions: {},
      };
    }
    const story = items[storyId];
    story.updatedAt = maxTimestamp(story.updatedAt, entry.updatedAt);
    if (entry.completedAt) {
      story.completedMissions[missionId] = entry.completedAt;
    }
    if (entry.deletedAt) {
      story.deletedAt = maxTimestamp(story.deletedAt, entry.deletedAt);
    }
  }

  return {
    updatedAt: doc.updatedAt,
    ...(doc.resetAt ? { resetAt: doc.resetAt } : {}),
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

function expandToCharacterEntries(
  key: string,
  value: unknown,
  resetAt?: string
): Array<[string, CharacterProgressItem]> {
  const raw = asRecord(value);
  if (!raw) return [];

  const deletedAt = asTimestamp(raw.deletedAt);
  const directCompletedAt = filterTimestamp(asTimestamp(raw.completedAt), resetAt, deletedAt);
  const baseUpdatedAt = asTimestamp(raw.updatedAt);
  const completedMissions = asRecord(raw.completedMissions);
  const storyCompletedAt = filterTimestamp(asTimestamp(raw.storyCompletedAt), resetAt, deletedAt);

  // New shape: key is a characterId (or any opaque id) and the value already
  // carries `completedAt`. No completedMissions sub-map and no legacy fields.
  if (!completedMissions && !storyCompletedAt) {
    const updatedAt = maxTimestamp(baseUpdatedAt, directCompletedAt, deletedAt);
    if (!directCompletedAt && !deletedAt && updatedAt === MIN_PROGRESS_TIMESTAMP) {
      return [];
    }
    const entry: CharacterProgressItem = {
      updatedAt,
      ...(deletedAt ? { deletedAt } : {}),
      ...(directCompletedAt ? { completedAt: directCompletedAt } : {}),
    };
    return [[key, entry]];
  }

  // Legacy story shape: explode completedMissions into individual characterId entries.
  const out: Array<[string, CharacterProgressItem]> = [];
  for (const [missionId, missionValue] of Object.entries(completedMissions || {})) {
    const completedAt = filterTimestamp(asTimestamp(missionValue), resetAt, deletedAt);
    if (!completedAt && !deletedAt) continue;
    const characterId = `${key}:${missionId}`;
    const updatedAt = maxTimestamp(baseUpdatedAt, completedAt, deletedAt);
    out.push([
      characterId,
      {
        updatedAt,
        ...(deletedAt ? { deletedAt } : {}),
        ...(completedAt ? { completedAt } : {}),
      },
    ]);
  }
  return out;
}

function mergeCharacterEntries(
  left: CharacterProgressItem | undefined,
  right: CharacterProgressItem | undefined,
  resetAt?: string
): CharacterProgressItem | undefined {
  if (!left) return right ? filterCharacterEntry(right, resetAt) : undefined;
  if (!right) return filterCharacterEntry(left, resetAt);

  const deletedAt = maxTimestamp(left.deletedAt, right.deletedAt) || undefined;
  const completedAt = filterTimestamp(
    maxTimestamp(left.completedAt, right.completedAt),
    resetAt,
    deletedAt
  );
  const updatedAt = maxTimestamp(
    left.updatedAt,
    right.updatedAt,
    deletedAt,
    completedAt
  );

  if (!deletedAt && !completedAt) {
    return undefined;
  }

  return {
    updatedAt,
    ...(deletedAt ? { deletedAt } : {}),
    ...(completedAt ? { completedAt } : {}),
  };
}

function filterCharacterEntry(
  entry: CharacterProgressItem,
  resetAt?: string
): CharacterProgressItem | undefined {
  const deletedAt = entry.deletedAt;
  const completedAt = filterTimestamp(entry.completedAt, resetAt, deletedAt);
  if (!deletedAt && !completedAt) return undefined;
  return {
    updatedAt: entry.updatedAt,
    ...(deletedAt ? { deletedAt } : {}),
    ...(completedAt ? { completedAt } : {}),
  };
}

function splitCharacterId(characterId: string): { storyId: string; missionId: string } {
  const colon = characterId.indexOf(":");
  if (colon < 0) {
    return { storyId: characterId, missionId: characterId };
  }
  return {
    storyId: characterId.slice(0, colon),
    missionId: characterId.slice(colon + 1),
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
