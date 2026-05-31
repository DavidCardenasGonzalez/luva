const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildCharacterId,
  buildCharacterPostRecord,
  buildCharacterPostsResponse,
  findStoryCharacter,
  listStoryCharacters,
  toCharacterPost,
} = require('../dist/character-posts.js');

const characters = [
  {
    characterId: 'speed_dating:date_1',
    aiRole: 'Role',
    caracterName: 'Alex',
    avatarImageUrl: 'https://assets.example.com/storiesProfile/alex.png',
  },
];

const character = listStoryCharacters(characters).characters[0];

test('listStoryCharacters maps characters to summary rows', () => {
  const response = listStoryCharacters(characters);

  assert.equal(response.characters.length, 1);
  assert.deepEqual(response.characters[0], {
    characterId: 'speed_dating:date_1',
    characterName: 'Alex',
    avatarImageUrl: 'https://assets.example.com/storiesProfile/alex.png',
  });
  assert.equal(findStoryCharacter(characters, 'speed_dating:date_1').characterName, 'Alex');
});

test('buildCharacterPostRecord normalizes a character post', () => {
  const record = buildCharacterPostRecord(
    character,
    {
      caption: '  First post from Alex  ',
      context: '  Alex is posting from the gallery opening.  ',
      imageUrl: 'https://assets.example.com/avatarPosts/post.png',
      order: '2',
    },
    {
      postId: 'post-1',
      now: '2026-04-25T10:20:30.000Z',
    },
  );

  assert.deepEqual(record, {
    characterId: 'speed_dating:date_1',
    postId: 'post-1',
    characterName: 'Alex',
    avatarImageUrl: 'https://assets.example.com/storiesProfile/alex.png',
    caption: 'First post from Alex',
    context: 'Alex is posting from the gallery opening.',
    imageUrl: 'https://assets.example.com/avatarPosts/post.png',
    order: 2,
    likeCount: 0,
    playCount: 0,
    watched3sCount: 0,
    conversationCount: 0,
    createdAt: '2026-04-25T10:20:30.000Z',
    updatedAt: '2026-04-25T10:20:30.000Z',
  });
});

test('buildCharacterPostRecord normalizes a video character post with thumbnail', () => {
  const record = buildCharacterPostRecord(
    character,
    {
      caption: '  New reel from Alex  ',
      context: '  Alex recorded a vertical update.  ',
      imageUrl: 'https://assets.example.com/avatarPosts/post-thumb.webp',
      thumbnailUrl: 'https://assets.example.com/avatarPosts/post-thumb.webp',
      videoUrl: 'https://assets.example.com/avatarPosts/post-mobile.mp4',
      order: '3',
    },
    {
      postId: 'post-video-1',
      now: '2026-04-25T10:25:30.000Z',
    },
  );

  assert.equal(record.imageUrl, 'https://assets.example.com/avatarPosts/post-thumb.webp');
  assert.equal(record.thumbnailUrl, 'https://assets.example.com/avatarPosts/post-thumb.webp');
  assert.equal(record.videoUrl, 'https://assets.example.com/avatarPosts/post-mobile.mp4');
  assert.equal(record.order, 3);
});

test('buildCharacterPostRecord requires caption, image URL and order', () => {
  assert.throws(
    () =>
      buildCharacterPostRecord(
        character,
        { caption: '', imageUrl: 'https://assets.example.com/avatarPosts/post.png', order: 1 },
        { postId: 'post-1' },
      ),
    /INVALID_CHARACTER_POST_CAPTION/,
  );

  assert.throws(
    () =>
      buildCharacterPostRecord(
        character,
        { caption: 'Post', imageUrl: 'assets/post.png', order: 1 },
        { postId: 'post-1' },
      ),
    /INVALID_CHARACTER_POST_IMAGE_URL/,
  );

  assert.throws(
    () =>
      buildCharacterPostRecord(
        character,
        { caption: 'Post', imageUrl: 'https://assets.example.com/avatarPosts/post.png', order: 0 },
        { postId: 'post-1' },
      ),
    /INVALID_CHARACTER_POST_ORDER/,
  );
});

test('toCharacterPost validates stored records', () => {
  assert.deepEqual(
    toCharacterPost({
      characterId: 'speed_dating:date_1',
      postId: 'post-1',
      characterName: 'Alex',
      caption: 'Hola',
      context: 'Alex is celebrating a tiny win.',
      imageUrl: 'https://assets.example.com/avatarPosts/post.png',
      order: 1,
      createdAt: '2026-04-25T10:20:30.000Z',
      updatedAt: '2026-04-25T10:20:30.000Z',
    }),
    {
      characterId: 'speed_dating:date_1',
      postId: 'post-1',
      characterName: 'Alex',
      caption: 'Hola',
      context: 'Alex is celebrating a tiny win.',
      imageUrl: 'https://assets.example.com/avatarPosts/post.png',
      order: 1,
      likeCount: 0,
      playCount: 0,
      watched3sCount: 0,
      conversationCount: 0,
      createdAt: '2026-04-25T10:20:30.000Z',
      updatedAt: '2026-04-25T10:20:30.000Z',
    },
  );

  // Legacy records with extra fields still parse (extra fields are ignored on output).
  const legacyParsed = toCharacterPost({
    characterId: 'speed_dating:date_1',
    postId: 'post-video-1',
    storyId: 'speed_dating',
    missionId: 'date_1',
    sceneIndex: 0,
    storyTitle: 'Speed Dating',
    missionTitle: 'La cita uno',
    characterName: 'Alex',
    caption: 'Video',
    imageUrl: 'https://assets.example.com/avatarPosts/post-thumb.webp',
    thumbnailUrl: 'https://assets.example.com/avatarPosts/post-thumb.webp',
    videoUrl: 'https://assets.example.com/avatarPosts/post-mobile.mp4',
    order: 2,
    createdAt: '2026-04-25T10:20:30.000Z',
    updatedAt: '2026-04-25T10:20:30.000Z',
  });
  assert.equal(legacyParsed.videoUrl, 'https://assets.example.com/avatarPosts/post-mobile.mp4');
  assert.equal(legacyParsed.characterName, 'Alex');
  assert.equal(Object.prototype.hasOwnProperty.call(legacyParsed, 'storyId'), false);

  // Records missing characterName fall back to missionTitle (legacy data) or default.
  const fallbackParsed = toCharacterPost({
    characterId: 'speed_dating:date_1',
    postId: 'post-2',
    missionTitle: 'La cita uno',
    caption: 'Sin metadata',
    imageUrl: 'https://assets.example.com/avatarPosts/post.png',
    order: 1,
  });
  assert.equal(fallbackParsed.characterName, 'La cita uno');
});

test('buildCharacterPostsResponse sorts posts by configured order', () => {
  const response = buildCharacterPostsResponse(character, [
    {
      characterId: 'speed_dating:date_1',
      postId: 'post-3',
      characterName: 'Alex',
      caption: 'Tercero',
      imageUrl: 'https://assets.example.com/avatarPosts/post-3.png',
      order: 3,
      createdAt: '2026-04-25T10:20:33.000Z',
      updatedAt: '2026-04-25T10:20:33.000Z',
    },
    {
      characterId: 'speed_dating:date_1',
      postId: 'post-1',
      characterName: 'Alex',
      caption: 'Primero',
      imageUrl: 'https://assets.example.com/avatarPosts/post-1.png',
      order: 1,
      createdAt: '2026-04-25T10:20:31.000Z',
      updatedAt: '2026-04-25T10:20:31.000Z',
    },
  ]);

  assert.equal(buildCharacterId('speed_dating', 'date_1'), 'speed_dating:date_1');
  assert.deepEqual(
    response.posts.map((post) => post.postId),
    ['post-1', 'post-3'],
  );
});
