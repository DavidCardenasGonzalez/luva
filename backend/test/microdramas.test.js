const test = require('node:test');
const assert = require('node:assert/strict');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { validateMicrodramaManifest, toMicrodramaDynamoItems } = require('../dist/microdramas-data');
const { createMicrodramasRepository, normalizeSeriesSearch } = require('../dist/microdramas');

function definition() {
  return {
    series: {
      seriesId: 'mateo-emma', title: 'Ángel en Nueva York', synopsis: 'Una fotógrafa conoce a un vecino.',
      coverUrl: 'https://cdn.example/cover.jpg', chatCharacterIds: ['mateo', 'emma'],
      catalogOrder: 1, publicationStatus: 'published',
    },
    episodes: [1, 2].map(number => ({
      episodeId: `ep-${number}`, episodeNumber: number, title: `Capítulo ${number}`,
      durationMs: 90000, videoUrl: `https://cdn.example/${number}.mp4`,
      subtitlesUrl: `https://cdn.example/${number}.srt`, publicationStatus: 'published',
    })),
  };
}

function characterRepo() {
  let calls = 0;
  return {
    get calls() { return calls; },
    async getCharacterPresentations(ids) {
      calls += 1;
      return [...new Set(ids)].map(id => ({ characterId: id, name: id, avatarUrl: `https://cdn.example/${id}.jpg`, aiRole: 'SECRET' }));
    },
  };
}

test('published microdrama manifests validate references and episode sequence', () => {
  const manifest = definition();
  const chars = [{ characterId: 'mateo' }, { characterId: 'emma' }];
  assert.deepEqual(validateMicrodramaManifest(manifest, chars), []);
  manifest.episodes[1].episodeNumber = 3;
  assert.ok(validateMicrodramaManifest(manifest, chars).some(message => message.includes('contiguous')));
  manifest.episodes[1].episodeNumber = 2;
  manifest.series.chatCharacterIds = ['unknown'];
  assert.ok(validateMicrodramaManifest(manifest, chars).some(message => message.includes('Unknown chat character')));
});

test('series items denormalize only their public presentation and omit unlisted private fields', () => {
  const manifest = definition();
  const items = toMicrodramaDynamoItems(manifest);
  assert.equal(items[0].searchTitle, 'angel en nueva york');
  assert.equal(items[0].episodeCount, 2);
  assert.equal(items[0].firstEpisodeId, 'ep-1');
  assert.equal(items[1].accessPolicy, 'free');
  assert.equal(items[1].subtitlesLanguage, 'en');
});

test('episodes without subtitles remain valid and omit the subtitle URL', () => {
  const manifest = definition();
  delete manifest.episodes[0].subtitlesUrl;
  assert.deepEqual(validateMicrodramaManifest(manifest, [{ characterId: 'mateo' }, { characterId: 'emma' }]), []);
  const items = toMicrodramaDynamoItems(manifest);
  assert.equal('subtitlesUrl' in items[1], false);
  assert.equal(items[2].subtitlesUrl, 'https://cdn.example/2.srt');
});

test('catalog embeds unique character presentations in one batch and returns a safe DTO', async () => {
  process.env.MICRODRAMAS_TABLE_NAME = 'microdramas-test';
  const manifest = definition();
  const record = {
    pk: 'SERIES#mateo-emma', sk: 'META', seriesId: 'mateo-emma', title: manifest.series.title,
    searchTitle: 'angel en nueva york', synopsis: manifest.series.synopsis, coverUrl: manifest.series.coverUrl,
    publicationStatus: 'published', chatCharacterIds: ['mateo', 'emma', 'mateo'], episodeCount: 2,
    firstEpisodeId: 'ep-1', catalogOrder: 1, version: 1, aiRole: 'NEVER LEAK',
  };
  let queryCount = 0;
  const chars = characterRepo();
  const repo = createMicrodramasRepository({
    async send(command) {
      assert.ok(command instanceof QueryCommand);
      queryCount += 1;
      return { Items: [record] };
    },
  }, chars);
  const result = await repo.listSeries();
  assert.equal(queryCount, 1);
  assert.equal(chars.calls, 1);
  assert.deepEqual(result.items[0].chatCharacters.map(item => item.characterId), ['mateo', 'emma', 'mateo']);
  assert.equal(JSON.stringify(result).includes('NEVER LEAK'), false);
  assert.equal(result.items[0].chatCharacters[0].aiRole, undefined);
});

test('catalog search normalizes accents and discovery cursor preserves its seed', async () => {
  process.env.MICRODRAMAS_TABLE_NAME = 'microdramas-test';
  const records = Array.from({ length: 21 }, (_, i) => ({
    pk: `SERIES#s-${i}`, sk: 'META', seriesId: `s-${i}`, title: `Ángel ${i}`,
    searchTitle: `angel ${i}`, synopsis: 'synopsis', coverUrl: 'https://cdn.example/c.jpg',
    publicationStatus: 'published', chatCharacterIds: ['mateo'], episodeCount: 1,
    firstEpisodeId: 'ep-1', catalogOrder: i, version: 1,
  }));
  const repo = createMicrodramasRepository({ async send() { return { Items: records }; } }, characterRepo());
  assert.equal(normalizeSeriesSearch(' ÁNGEL '), 'angel');
  const first = await repo.listSeries({ q: 'angel', seed: 'session', discovery: true, limit: 20 });
  assert.equal(first.items.length, 20);
  const second = await repo.listSeries({ q: 'angel', seed: 'session', discovery: true, cursor: first.nextCursor, limit: 20 });
  assert.equal(second.items.length, 1);
  await assert.rejects(() => repo.listSeries({ q: 'angel', seed: 'other', discovery: true, cursor: first.nextCursor }), /INVALID_MICRODRAMA_CURSOR/);
});

test('series detail loads published episodes in episode order and one character batch', async () => {
  process.env.MICRODRAMAS_TABLE_NAME = 'microdramas-test';
  const manifest = definition();
  const items = toMicrodramaDynamoItems(manifest);
  const reversed = [items[0], ...items.slice(1).reverse()].map(item => ({
    ...item, ...(item.sk === 'META' ? { publicationStatus: 'published', version: 1 } : { publicationStatus: 'published' }),
  }));
  const chars = characterRepo();
  const repo = createMicrodramasRepository({ async send() { return { Items: reversed }; } }, chars);
  const detail = await repo.getSeriesDetail('mateo-emma');
  assert.deepEqual(detail.episodes.map(episode => episode.episodeNumber), [1, 2]);
  assert.equal(detail.series.chatCharacters.length, 2);
  assert.equal(chars.calls, 1);
});
