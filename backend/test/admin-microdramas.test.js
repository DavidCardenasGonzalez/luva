const test = require('node:test');
const assert = require('node:assert/strict');
const { QueryCommand, ScanCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { createAdminMicrodramasRepository, normalizeAdminMicrodrama } = require('../dist/admin/microdramas');
const { createMicrodramasRepository } = require('../dist/microdramas');
process.env.MICRODRAMAS_TABLE_NAME = 'admin-series-test';

function manifest() {
  return {
    series: { seriesId: 'mateo', title: 'Mateo', synopsis: 'Una historia.', coverUrl: 'https://cdn.example/cover.webp', chatCharacterIds: ['mateo'], catalogOrder: 0, publicationStatus: 'published' },
    episodes: [1, 2].map(number => ({ episodeId: `ep-${number}`, episodeNumber: number, title: `Episodio ${number}`, durationMs: 30000, videoUrl: `https://cdn.example/${number}.mp4`, publicationStatus: 'published' })),
  };
}

function store() {
  const rows = new Map();
  let transactions = 0;
  let beforeTransaction;
  const key = item => `${item.pk}|${item.sk}`;
  const client = {
    async send(command) {
      if (command instanceof QueryCommand) return { Items: [...rows.values()].filter(row => row.pk === command.input.ExpressionAttributeValues[':pk']).map(row => structuredClone(row)) };
      if (command instanceof ScanCommand) return { Items: [...rows.values()].filter(row => row.sk === 'META').map(row => structuredClone(row)) };
      assert.ok(command instanceof TransactWriteCommand);
      beforeTransaction?.(rows);
      beforeTransaction = undefined;
      for (const operation of command.input.TransactItems) {
        const op = operation.Put || operation.Delete;
        const existing = rows.get(key(op.Item || op.Key));
        if (op.ConditionExpression && (op.ExpressionAttributeValues ? existing?.version !== op.ExpressionAttributeValues[':version'] : existing !== undefined)) {
          const error = new Error('conditional conflict');
          error.name = 'TransactionCanceledException';
          error.CancellationReasons = [{ Code: 'ConditionalCheckFailed' }];
          throw error;
        }
      }
      for (const operation of command.input.TransactItems) {
        if (operation.Put) rows.set(key(operation.Put.Item), structuredClone(operation.Put.Item));
        else rows.delete(key(operation.Delete.Key));
      }
      transactions += 1;
      return {};
    },
  };
  const characters = { listCharacters: async () => [{ characterId: 'mateo' }], getCharacterPresentations: async () => [{ characterId: 'mateo', name: 'Mateo' }] };
  return { rows, client, characters, repo: createAdminMicrodramasRepository(client, characters), get transactions() { return transactions; }, race(fn) { beforeTransaction = fn; } };
}

test('draft series can be saved without media or episodes, and are not public', async () => {
  const db = store();
  const data = manifest();
  Object.assign(data.series, { publicationStatus: 'draft', synopsis: '', coverUrl: '', chatCharacterIds: [] });
  data.episodes = [];
  const result = await db.repo.save(data, 0);
  assert.equal(result.version, 1);
  assert.deepEqual((await db.repo.get('mateo')).manifest, data);
  assert.equal((await db.repo.list()).items[0].totalEpisodeCount, 0);
  assert.equal(await createMicrodramasRepository(db.client, db.characters).getSeriesDetail('mateo'), undefined);
});

test('publishing supports future drafts and only exposes published contiguous episodes', async () => {
  const db = store();
  const data = manifest();
  Object.assign(data.episodes[1], { publicationStatus: 'draft', videoUrl: '', durationMs: 0 });
  await db.repo.save(data, 0);
  const result = await createMicrodramasRepository(db.client, db.characters).getSeriesDetail('mateo');
  assert.deepEqual(result.episodes.map(item => item.episodeId), ['ep-1']);
  assert.equal(result.series.episodeCount, 1);
  assert.equal((await db.repo.list()).items[0].totalEpisodeCount, 2);
});

test('publishing incomplete or out-of-order episodes fails before writing', async () => {
  const db = store();
  const data = manifest();
  data.episodes[0].durationMs = 0;
  await assert.rejects(db.repo.save(data, 0), error => error.statusCode === 400 && error.code === 'MICRODRAMA_NOT_READY');
  data.episodes[0].durationMs = 30000;
  data.episodes[0].publicationStatus = 'draft';
  await assert.rejects(db.repo.save(data, 0), error => error.code === 'MICRODRAMA_NOT_READY');
  assert.equal(db.transactions, 0);
});

test('updates preserve episode IDs and creation times, remove episodes atomically, and clear catalog keys when unpublished', async () => {
  const db = store();
  const data = manifest();
  const created = await db.repo.save(data, 0);
  const oldEpisode = structuredClone(db.rows.get('SERIES#mateo|EPISODE#ep-1'));
  data.episodes = [data.episodes[0]];
  data.series.publicationStatus = 'draft';
  data.episodes[0].title = 'Nuevo título';
  const updated = await db.repo.save(data, 1, 'mateo');
  assert.equal(updated.version, 2);
  assert.equal(updated.createdAt, created.createdAt);
  assert.equal(db.rows.get('SERIES#mateo|EPISODE#ep-1').createdAt, oldEpisode.createdAt);
  assert.equal(db.rows.get('SERIES#mateo|EPISODE#ep-1').episodeId, 'ep-1');
  assert.equal(db.rows.has('SERIES#mateo|EPISODE#ep-2'), false);
  assert.equal('catalogPk' in db.rows.get('SERIES#mateo|META'), false);
  assert.equal('catalogSk' in db.rows.get('SERIES#mateo|META'), false);
});

test('duplicate creation, stale versions, and races cannot overwrite another edit', async () => {
  const db = store();
  const data = manifest();
  await db.repo.save(data, 0);
  await assert.rejects(db.repo.save(data, 0), error => error.statusCode === 409);
  await assert.rejects(db.repo.save(data, 5, 'mateo'), error => error.statusCode === 409);
  db.race(rows => { rows.get('SERIES#mateo|META').version = 2; });
  data.series.title = 'Stale edit';
  await assert.rejects(db.repo.save(data, 1, 'mateo'), error => error.statusCode === 409);
  assert.equal(db.rows.get('SERIES#mateo|META').title, 'Mateo');
});

test('delete requires unpublishing and the current version', async () => {
  const db = store();
  const data = manifest();
  await db.repo.save(data, 0);
  await assert.rejects(db.repo.delete('mateo', 1), error => error.statusCode === 400);
  data.series.publicationStatus = 'draft';
  await db.repo.save(data, 1, 'mateo');
  await assert.rejects(db.repo.delete('mateo', 1), error => error.statusCode === 409);
  await db.repo.delete('mateo', 2);
  assert.equal(db.rows.size, 0);
});

test('invalid IDs, malformed payloads, duplicate episodes and unknown characters are rejected', async () => {
  for (const bad of [null, {}, { series: null }, { series: { ...manifest().series, title: 123 }, episodes: [] }]) assert.throws(() => normalizeAdminMicrodrama(bad), error => error.statusCode === 400);
  const db = store();
  const data = manifest();
  data.episodes[1].episodeId = data.episodes[0].episodeId;
  await assert.rejects(db.repo.save(data, 0), error => error.statusCode === 400);
  data.episodes[1].episodeId = 'ep-2';
  data.series.chatCharacterIds = ['missing'];
  await assert.rejects(db.repo.save(data, 0), error => error.statusCode === 400);
  assert.equal(db.transactions, 0);
});
