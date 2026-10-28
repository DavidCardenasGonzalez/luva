const test = require('node:test');
const assert = require('node:assert/strict');
const { createMicrodramaProgressRepository, MicrodramaProgressConflict } = require('../dist/microdramas-progress');

test('progress writes are scoped to the user and clamp the position to episode duration', async () => {
  const prior = process.env.TABLE_NAME;
  process.env.TABLE_NAME = 'users-test';
  const writes = [];
  const client = { async send(command) {
    if (command.constructor.name === 'GetCommand') return {};
    if (command.constructor.name === 'TransactWriteCommand') { writes.push(command.input); return {}; }
    throw new Error(`Unexpected ${command.constructor.name}`);
  } };
  try {
    const repo = createMicrodramaProgressRepository(client, async () => ({ episodeId: 'ep1', seriesId: 's1', episodeNumber: 1, title: 'One', durationMs: 10000 }));
    const result = await repo.save('user@example.com', 's1', { episodeId: 'ep1', positionMs: 15000, event: 'position', expectedRevision: 0 });
    assert.equal(result.episode.positionMs, 10000);
    assert.equal(result.summary.resumePositionMs, 10000);
    const puts = writes[0].TransactItems.map(item => item.Put.Item);
    assert.ok(puts.every(item => item.pk === 'USER#user%40example.com'));
    assert.equal(puts[0].revision, 1);
  } finally {
    if (prior === undefined) delete process.env.TABLE_NAME; else process.env.TABLE_NAME = prior;
  }
});

test('progress rejects a stale expected revision before writing', async () => {
  const prior = process.env.TABLE_NAME;
  process.env.TABLE_NAME = 'users-test';
  let transactionCalled = false;
  const client = { async send(command) {
    if (command.constructor.name === 'GetCommand') return { Item: { seriesId: 's1', resumeEpisodeId: 'ep1', resumePositionMs: 1200, revision: 4, updatedAt: '2026-01-01T00:00:00.000Z' } };
    if (command.constructor.name === 'TransactWriteCommand') transactionCalled = true;
    throw new Error(`Unexpected ${command.constructor.name}`);
  } };
  try {
    const repo = createMicrodramaProgressRepository(client, async () => ({ episodeId: 'ep1', seriesId: 's1', episodeNumber: 1, title: 'One', durationMs: 10000 }));
    await assert.rejects(
      repo.save('u1', 's1', { episodeId: 'ep1', positionMs: 1500, event: 'position', expectedRevision: 3 }),
      error => error instanceof MicrodramaProgressConflict && error.current.revision === 4,
    );
    assert.equal(transactionCalled, false);
  } finally {
    if (prior === undefined) delete process.env.TABLE_NAME; else process.env.TABLE_NAME = prior;
  }
});
