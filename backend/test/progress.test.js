const test = require('node:test');
const assert = require('node:assert/strict');
const {
  mergeCardProgressDocuments,
  mergeStoryProgressDocuments,
  mergeUserProgressRecords,
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

test('story merge keeps reset tombstones from reviving older mission completions', () => {
  const merged = mergeStoryProgressDocuments(
    {
      updatedAt: '2026-03-28T10:00:00.000Z',
      items: {
        story_1: {
          updatedAt: '2026-03-28T10:00:00.000Z',
          completedMissions: {
            mission_1: '2026-03-28T10:00:00.000Z',
          },
        },
      },
    },
    {
      updatedAt: '2026-03-29T08:00:00.000Z',
      items: {
        story_1: {
          updatedAt: '2026-03-29T08:00:00.000Z',
          deletedAt: '2026-03-29T08:00:00.000Z',
          completedMissions: {},
        },
      },
    }
  );

  assert.deepEqual(merged.items.story_1, {
    updatedAt: '2026-03-29T08:00:00.000Z',
    deletedAt: '2026-03-29T08:00:00.000Z',
    completedMissions: {},
  });
});

test('user progress merge updates only the provided branch', () => {
  const merged = mergeUserProgressRecords(
    {
      cards: {
        updatedAt: '2026-03-28T10:00:00.000Z',
        items: {
          card_1: { status: 'learned', updatedAt: '2026-03-28T10:00:00.000Z' },
        },
      },
      stories: {
        updatedAt: '2026-03-27T09:00:00.000Z',
        items: {
          story_1: {
            updatedAt: '2026-03-27T09:00:00.000Z',
            completedMissions: {
              mission_1: '2026-03-27T09:00:00.000Z',
            },
          },
        },
      },
    },
    {
      cards: {
        updatedAt: '2026-03-29T08:00:00.000Z',
        items: {
          card_1: { status: 'learning', updatedAt: '2026-03-29T08:00:00.000Z' },
        },
      },
    }
  );

  assert.equal(merged.cards.items.card_1.status, 'learning');
  assert.equal(
    merged.stories.items.story_1.completedMissions.mission_1,
    '2026-03-27T09:00:00.000Z'
  );
});
