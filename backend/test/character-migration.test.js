const test = require('node:test');
const assert = require('node:assert/strict');
const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CHARACTERS } = require('../dist/data/characters');
const {
  equalCharacterSnapshot,
  migrateCharacterSnapshot,
  validateCharacterSnapshot,
} = require('../dist/character-migration');

test('character snapshot preserves current stable IDs and all definitions', () => {
  assert.deepEqual(validateCharacterSnapshot(CHARACTERS), []);
  assert.equal(CHARACTERS.length, 40);
  assert.ok(CHARACTERS.some(character => character.characterId === 'Emma_Brooks'));
  for (const character of CHARACTERS) assert.ok(equalCharacterSnapshot(character, character));
});

test('character snapshot validation rejects duplicate or incomplete rows', () => {
  const definition = { characterId: 'same', aiRole: 'role' };
  assert.match(validateCharacterSnapshot([definition, definition]).join(' '), /duplicate/);
  assert.match(validateCharacterSnapshot([{ characterId: 'empty', aiRole: ' ' }]).join(' '), /aiRole/);
});

test('dry-run only reports missing characters, then apply inserts each ID once', async () => {
  const rows = new Map();
  const writes = [];
  const client = {
    async send(command) {
      if (command instanceof GetCommand) return { Item: rows.get(command.input.Key.characterId) };
      if (command instanceof PutCommand) {
        writes.push(command.input.Item.characterId);
        rows.set(command.input.Item.characterId, command.input.Item);
        return {};
      }
      throw new Error('unexpected command');
    },
  };
  const source = CHARACTERS.slice(0, 2);
  const dryRun = await migrateCharacterSnapshot(source, client, { tableName: 'Characters', apply: false });
  assert.equal(dryRun.missing.length, 2);
  assert.equal(writes.length, 0);
  const applied = await migrateCharacterSnapshot(source, client, { tableName: 'Characters', apply: true });
  assert.equal(applied.migrated, 2);
  assert.deepEqual(rows.get(source[0].characterId).aiRole, source[0].aiRole);
  const repeated = await migrateCharacterSnapshot(source, client, { tableName: 'Characters', apply: true });
  assert.equal(repeated.skipped, 2);
  assert.equal(writes.length, 2);
});

test('migration reports conflicts and never overwrites database edits', async () => {
  const source = CHARACTERS[0];
  const changed = { ...source, aiRole: `${source.aiRole} changed` };
  const client = {
    async send(command) {
      if (command instanceof GetCommand) return { Item: changed };
      throw new Error('migration must not write conflicting data');
    },
  };
  const result = await migrateCharacterSnapshot([source], client, { tableName: 'Characters', apply: true });
  assert.deepEqual(result.conflicts, [source.characterId]);
});
