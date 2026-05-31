const test = require('node:test');
const assert = require('node:assert/strict');
const { CHARACTERS } = require('../dist/data/characters.js');

test('characters data has flat character-centric shape', () => {
  assert.ok(Array.isArray(CHARACTERS));
  assert.equal(CHARACTERS.length, 52);
  assert.equal(CHARACTERS[0].characterId, 'initials:meet_mateo_first_mission');
  assert.equal(typeof CHARACTERS[0].aiRole, 'string');
  assert.ok(CHARACTERS[0].aiRole.length > 0);
  assert.equal(Object.prototype.hasOwnProperty.call(CHARACTERS[0], 'storyId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(CHARACTERS[0], 'missionId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(CHARACTERS[0], 'aiRoleFriends'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(CHARACTERS[0], 'requirements'), false);
});
