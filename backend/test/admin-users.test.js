const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAdminUsersResponse } = require('../dist/admin/users.js');

test('buildAdminUsersResponse filters and summarizes admin users', async () => {
  const response = buildAdminUsersResponse([
    {
      email: 'ana@example.com',
      displayName: 'Ana',
      emailVerified: true,
      lastAuthProvider: 'google',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-05T09:00:00.000Z',
      lastLoginAt: '2026-04-05T09:00:00.000Z',
      isPro: true,
      proAccess: { isActive: true, source: 'subscription', updatedAt: '2026-04-05T08:00:00.000Z' },
      appProgress: {
        cards: {
          updatedAt: '2026-04-05T07:00:00.000Z',
          items: {
            card_1: { status: 'learning', updatedAt: '2026-04-05T07:00:00.000Z' },
            card_2: { status: 'learned', updatedAt: '2026-04-05T07:00:00.000Z' },
          },
        },
        stories: {
          updatedAt: '2026-04-05T06:00:00.000Z',
          items: {
            story_1: {
              updatedAt: '2026-04-05T06:00:00.000Z',
              completedMissions: { mission_1: '2026-04-05T06:00:00.000Z' },
              storyCompletedAt: '2026-04-05T06:00:00.000Z',
            },
          },
        },
      },
    },
    {
      email: 'bruno@example.com',
      givenName: 'Bruno',
      familyName: 'Diaz',
      emailVerified: false,
      lastAuthProvider: 'email',
      createdAt: '2026-04-02T10:00:00.000Z',
      updatedAt: '2026-04-04T09:00:00.000Z',
      lastLoginAt: '2026-04-04T09:00:00.000Z',
      isPro: false,
      appProgress: {
        cards: { updatedAt: '1970-01-01T00:00:00.000Z', items: {} },
        stories: { updatedAt: '1970-01-01T00:00:00.000Z', items: {} },
      },
    },
  ], { search: 'ana' });

  assert.equal(response.users.length, 1);
  assert.equal(response.users[0].email, 'ana@example.com');
  assert.equal(response.users[0].progress.cardsTotal, 2);
  assert.equal(response.users[0].progress.cardsLearned, 1);
  assert.equal(response.users[0].progress.storiesCompleted, 1);
  assert.equal(response.stats.totalUsers, 1);
  assert.equal(response.stats.proUsers, 1);
  assert.equal(response.stats.providers.google, 1);
});

test('buildAdminUsersResponse marks user as Pro when proAccess is active even if stored isPro is false', async () => {
  const response = buildAdminUsersResponse([
    {
      email: 'david@example.com',
      displayName: 'David',
      emailVerified: true,
      lastAuthProvider: 'google',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-05T09:00:00.000Z',
      lastLoginAt: '2026-04-05T09:00:00.000Z',
      isPro: false,
      proAccess: {
        isActive: true,
        source: 'subscription',
        updatedAt: '2026-04-05T08:00:00.000Z',
        subscription: {
          isActive: true,
          updatedAt: '2026-04-05T08:00:00.000Z',
          expiresAt: '2099-04-06T00:00:00.000Z',
          productId: 'luva_pro_monthly',
        },
      },
      appProgress: {
        cards: { updatedAt: '1970-01-01T00:00:00.000Z', items: {} },
        stories: { updatedAt: '1970-01-01T00:00:00.000Z', items: {} },
      },
    },
  ]);

  assert.equal(response.users.length, 1);
  assert.equal(response.users[0].isPro, true);
  assert.equal(response.users[0].proAccess.isActive, true);
  assert.equal(response.users[0].proAccess.source, 'subscription');
  assert.equal(response.stats.proUsers, 1);
});
