const test = require('node:test');
const assert = require('node:assert/strict');
const {
  deriveLegacyStoriesDocument,
  mergeCardProgressDocuments,
  mergeCharacterProgressDocuments,
  mergeUserProgressRecords,
  normalizeUserProgressRecord,
} = require('../dist/progress.js');

test('card merge keeps the newest tombstone when a card returns to todo', () => {
  const merged = mergeCardProgressDocuments(
    {
      updatedAt: '2026-03-28T10:00:00.000Z',
      items: {
        card_1: { status: 'learning', updatedAt: '2026-03-28T10:00:00.000Z' },
      },
    },
    {
      updatedAt: '2026-03-29T08:00:00.000Z',
      items: {
        card_1: { status: 'todo', updatedAt: '2026-03-29T08:00:00.000Z' },
      },
    }
  );

  assert.deepEqual(merged.items.card_1, {
    status: 'todo',
    updatedAt: '2026-03-29T08:00:00.000Z',
  });
});

test('character merge tombstones win over older completions', () => {
  const merged = mergeCharacterProgressDocuments(
    {
      updatedAt: '2026-03-28T10:00:00.000Z',
      items: {
        'story_1:mission_1': {
          updatedAt: '2026-03-28T10:00:00.000Z',
          completedAt: '2026-03-28T10:00:00.000Z',
        },
      },
    },
    {
      updatedAt: '2026-03-29T08:00:00.000Z',
      items: {
        'story_1:mission_1': {
          updatedAt: '2026-03-29T08:00:00.000Z',
          deletedAt: '2026-03-29T08:00:00.000Z',
        },
      },
    }
  );

  assert.deepEqual(merged.items['story_1:mission_1'], {
    updatedAt: '2026-03-29T08:00:00.000Z',
    deletedAt: '2026-03-29T08:00:00.000Z',
  });
});

test('normalizeUserProgressRecord expands legacy story shape into characterId entries', () => {
  const normalized = normalizeUserProgressRecord({
    cards: { updatedAt: '2026-03-28T10:00:00.000Z', items: {} },
    stories: {
      updatedAt: '2026-03-28T10:00:00.000Z',
      items: {
        story_1: {
          updatedAt: '2026-03-28T10:00:00.000Z',
          completedMissions: {
            mission_1: '2026-03-28T10:00:00.000Z',
            mission_2: '2026-03-28T11:00:00.000Z',
          },
        },
      },
    },
  });

  assert.deepEqual(normalized.characters.items['story_1:mission_1'], {
    updatedAt: '2026-03-28T10:00:00.000Z',
    completedAt: '2026-03-28T10:00:00.000Z',
  });
  assert.deepEqual(normalized.characters.items['story_1:mission_2'], {
    updatedAt: '2026-03-28T11:00:00.000Z',
    completedAt: '2026-03-28T11:00:00.000Z',
  });
});

test('user progress merge combines legacy stories input with new characters store', () => {
  const merged = mergeUserProgressRecords(
    {
      cards: {
        updatedAt: '2026-03-28T10:00:00.000Z',
        items: {
          card_1: { status: 'learned', updatedAt: '2026-03-28T10:00:00.000Z' },
        },
      },
      characters: {
        updatedAt: '2026-03-27T09:00:00.000Z',
        items: {
          'story_1:mission_1': {
            updatedAt: '2026-03-27T09:00:00.000Z',
            completedAt: '2026-03-27T09:00:00.000Z',
          },
        },
      },
    },
    {
      stories: {
        updatedAt: '2026-03-28T10:00:00.000Z',
        items: {
          story_1: {
            updatedAt: '2026-03-28T10:00:00.000Z',
            completedMissions: {
              mission_2: '2026-03-28T10:00:00.000Z',
            },
          },
        },
      },
    }
  );

  assert.equal(merged.cards.items.card_1.status, 'learned');
  assert.equal(
    merged.characters.items['story_1:mission_1'].completedAt,
    '2026-03-27T09:00:00.000Z'
  );
  assert.equal(
    merged.characters.items['story_1:mission_2'].completedAt,
    '2026-03-28T10:00:00.000Z'
  );
});

test('deriveLegacyStoriesDocument rebuilds the legacy shape from the canonical characters doc', () => {
  const legacy = deriveLegacyStoriesDocument({
    updatedAt: '2026-03-28T10:00:00.000Z',
    items: {
      'story_1:mission_1': {
        updatedAt: '2026-03-27T09:00:00.000Z',
        completedAt: '2026-03-27T09:00:00.000Z',
      },
      'story_1:mission_2': {
        updatedAt: '2026-03-28T10:00:00.000Z',
        completedAt: '2026-03-28T10:00:00.000Z',
      },
    },
  });

  assert.deepEqual(legacy.items.story_1.completedMissions, {
    mission_1: '2026-03-27T09:00:00.000Z',
    mission_2: '2026-03-28T10:00:00.000Z',
  });
});
