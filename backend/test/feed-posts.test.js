const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildFeedPostRecord,
  buildFeedPostsResponse,
  toFeedPost,
} = require('../dist/feed-posts.js');

test('buildFeedPostRecord normalizes a normal post', () => {
  const record = buildFeedPostRecord(
    {
      text: '  Nuevo tip para el feed  ',
      order: '1',
      postType: 'normal',
      imageUrl: 'https://assets.example.com/feedPostImages/post.png',
    },
    {
      postId: 'post-1',
      now: '2026-04-13T10:20:30.000Z',
    },
  );

  assert.deepEqual(record, {
    postId: 'post-1',
    feedPk: 'FEED#DEFAULT',
    text: 'Nuevo tip para el feed',
    order: 1,
    postType: 'normal',
    imageUrl: 'https://assets.example.com/feedPostImages/post.png',
    createdAt: '2026-04-13T10:20:30.000Z',
    updatedAt: '2026-04-13T10:20:30.000Z',
  });
});

test('buildFeedPostRecord requires type-specific targets', () => {
  assert.equal(
    buildFeedPostRecord(
      {
        text: 'Practica este item.',
        order: 2,
        postType: 'practice_guide',
        practiceId: '42',
      },
      { postId: 'post-2', now: '2026-04-13T10:20:30.000Z' },
    ).practiceId,
    '42',
  );

  assert.equal(
    buildFeedPostRecord(
      {
        text: 'Empieza esta mision.',
        order: 3,
        postType: 'mission_guide',
        missionId: 'mission-123',
      },
      { postId: 'post-3', now: '2026-04-13T10:20:30.000Z' },
    ).missionId,
    'mission-123',
  );

  assert.equal(
    buildFeedPostRecord(
      {
        text: 'Reclama monedas.',
        order: 4,
        postType: 'extra',
        coinAmount: '7',
      },
      { postId: 'post-4', now: '2026-04-13T10:20:30.000Z' },
    ).coinAmount,
    7,
  );

  assert.throws(
    () =>
      buildFeedPostRecord(
        {
          text: 'Falta target.',
          order: 5,
          postType: 'practice_guide',
        },
        { postId: 'post-5' },
      ),
    /INVALID_FEED_POST_TARGET/,
  );
});

test('buildFeedPostRecord rejects invalid order, type and URL', () => {
  assert.throws(
    () => buildFeedPostRecord({ text: 'x', order: 0, postType: 'normal' }, { postId: 'post-1' }),
    /INVALID_FEED_POST_ORDER/,
  );
  assert.throws(
    () => buildFeedPostRecord({ text: 'x', order: 1, postType: 'unknown' }, { postId: 'post-1' }),
    /INVALID_FEED_POST_TYPE/,
  );
  assert.throws(
    () =>
      buildFeedPostRecord(
        { text: 'x', order: 1, postType: 'normal', imageUrl: 'assets/post.png' },
        { postId: 'post-1' },
      ),
    /INVALID_FEED_POST_URL/,
  );
});

test('toFeedPost strips storage fields and validates stored records', () => {
  assert.deepEqual(
    toFeedPost({
      postId: 'post-1',
      feedPk: 'FEED#DEFAULT',
      text: 'Hola',
      order: 1,
      postType: 'extra',
      coinAmount: 3,
      createdAt: '2026-04-13T10:20:30.000Z',
      updatedAt: '2026-04-13T11:20:30.000Z',
    }),
    {
      postId: 'post-1',
      text: 'Hola',
      order: 1,
      postType: 'extra',
      coinAmount: 3,
      createdAt: '2026-04-13T10:20:30.000Z',
      updatedAt: '2026-04-13T11:20:30.000Z',
    },
  );

  assert.equal(
    toFeedPost({
      postId: 'post-2',
      text: 'Sin target',
      order: 2,
      postType: 'mission_guide',
    }),
    undefined,
  );
});

test('buildFeedPostsResponse sorts posts by configured order', () => {
  const response = buildFeedPostsResponse([
    {
      postId: 'post-3',
      text: 'Tercero',
      order: 3,
      postType: 'normal',
      createdAt: '2026-04-13T10:20:33.000Z',
      updatedAt: '2026-04-13T10:20:33.000Z',
    },
    {
      postId: 'post-1',
      text: 'Primero',
      order: 1,
      postType: 'normal',
      createdAt: '2026-04-13T10:20:31.000Z',
      updatedAt: '2026-04-13T10:20:31.000Z',
    },
  ]);

  assert.deepEqual(
    response.posts.map((post) => post.postId),
    ['post-1', 'post-3'],
  );
});
