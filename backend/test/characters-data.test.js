const test = require('node:test');
const assert = require('node:assert/strict');
const { storiesFromCharacters } = require('../dist/data/character-stories.js');
const { CHARACTERS } = require('../dist/data/characters.js');

test('characters data is flat and can be adapted to legacy stories', () => {
  assert.ok(Array.isArray(CHARACTERS));
  assert.equal(CHARACTERS.length, 52);
  assert.equal(CHARACTERS[0].characterId, 'initials:meet_mateo_first_mission');
  assert.equal(CHARACTERS[0].storyId, 'initials');
  assert.equal(CHARACTERS[0].missionId, 'meet_mateo_first_mission');
  assert.equal(Object.prototype.hasOwnProperty.call(CHARACTERS[0], 'missions'), false);

  const stories = storiesFromCharacters(CHARACTERS);
  assert.equal(stories.length, 11);
  assert.equal(stories[0].storyId, 'initials');
  assert.equal(stories[0].missions.length, 2);
  assert.equal(stories[0].missions[0].missionId, 'meet_mateo_first_mission');
});
