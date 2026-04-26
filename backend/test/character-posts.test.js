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

const story = {
  storyId: 'speed_dating',
  title: 'Speed Dating',
  summary: 'Citas rapidas',
  missions: [
    {
      missionId: 'date_1',
      title: 'La cita uno',
      aiRole: 'Role',
      caracterName: 'Alex',
      avatarImageUrl: 'https://assets.example.com/storiesProfile/alex.png',
      sceneSummary: 'Una escena',
      requirements: [],
    },
  ],
};

const character = listStoryCharacters([story]).characters[0];

test('listStoryCharacters flattens stories and missions into character rows', () => {
  const response = listStoryCharacters([story]);

  assert.equal(response.characters.length, 1);
  assert.deepEqual(response.characters[0], {
    characterId: 'speed_dating:date_1',
    storyId: 'speed_dating',
    missionId: 'date_1',
    sceneIndex: 0,
    storyTitle: 'Speed Dating',
    missionTitle: 'La cita uno',
    characterName: 'Alex',
    avatarImageUrl: 'https://assets.example.com/storiesProfile/alex.png',
    sceneSummary: 'Una escena',
  });
  assert.equal(findStoryCharacter([story], 'speed_dating:date_1').characterName, 'Alex');
});

test('buildCharacterPostRecord normalizes a character post', () => {
  const record = buildCharacterPostRecord(
    character,
    {
      caption: '  First post from Alex  ',
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
    storyId: 'speed_dating',
    missionId: 'date_1',
    sceneIndex: 0,
    storyTitle: 'Speed Dating',
    missionTitle: 'La cita uno',
    characterName: 'Alex',
    avatarImageUrl: 'https://assets.example.com/storiesProfile/alex.png',
    caption: 'First post from Alex',
    imageUrl: 'https://assets.example.com/avatarPosts/post.png',
    order: 2,
    createdAt: '2026-04-25T10:20:30.000Z',
    updatedAt: '2026-04-25T10:20:30.000Z',
  });
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
  assert.equal(
    toCharacterPost({
      characterId: 'speed_dating:date_1',
      postId: 'post-1',
      storyId: 'speed_dating',
      missionId: 'date_1',
      sceneIndex: 0,
      storyTitle: 'Speed Dating',
      missionTitle: 'La cita uno',
      characterName: 'Alex',
      caption: 'Hola',
      imageUrl: 'https://assets.example.com/avatarPosts/post.png',
      order: 1,
      createdAt: '2026-04-25T10:20:30.000Z',
      updatedAt: '2026-04-25T10:20:30.000Z',
    }).postId,
    'post-1',
  );

  assert.equal(
    toCharacterPost({
      characterId: 'speed_dating:date_1',
      postId: 'post-2',
      caption: 'Sin metadata',
      imageUrl: 'https://assets.example.com/avatarPosts/post.png',
      order: 1,
    }),
    undefined,
  );
});

test('buildCharacterPostsResponse sorts posts by configured order', () => {
  const response = buildCharacterPostsResponse(character, [
    {
      characterId: 'speed_dating:date_1',
      postId: 'post-3',
      storyId: 'speed_dating',
      missionId: 'date_1',
      sceneIndex: 0,
      storyTitle: 'Speed Dating',
      missionTitle: 'La cita uno',
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
      storyId: 'speed_dating',
      missionId: 'date_1',
      sceneIndex: 0,
      storyTitle: 'Speed Dating',
      missionTitle: 'La cita uno',
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
