const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/review/local.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const input = { originalText: 'Hello world', translatedText: 'Hola mundo', sourceLanguage: 'en', targetLanguage: 'es', source: { type: 'feed_video' } };
function load(storage, api) {
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => name === './api' ? { reviewApi: api } : { default: storage } });
  return exports.localReviews;
}
test('guest persistence, concurrent saves, deduplication, completion and idempotent import', async () => {
  let data;
  const storage = { getItem: async () => data, setItem: async (_, value) => { data = value; } };
  let saves = 0, completions = 0;
  const api = { save: async value => { saves++; return { item: { ...value, id: 'server-id', status: 'pending' } }; }, setStatus: async () => { completions++; } };
  let local = load(storage, api);
  const [first, duplicate] = await Promise.all([local.save(input), local.save({ ...input, originalText: ' Hello   WORLD ' })]);
  assert.equal(first.id, duplicate.id);
  await local.setStatus(first.id, 'completed');
  local = load(storage, api);
  assert.equal((await local.list('completed')).items.length, 1);
  await local.sync('a@example.com', () => true);
  await local.sync('a@example.com', () => true);
  assert.equal(saves, 1);
  assert.equal(completions, 1);
  assert.equal((await local.get(first.id, 'a@example.com')).remoteId, 'server-id');
  assert.equal((await local.list()).items.length, 0);
  await assert.rejects(local.get(first.id, 'b@example.com'));
});
test('failed imports survive restart and cannot move to a different account', async () => {
  let data, fail = true, saves = 0;
  const storage = { getItem: async () => data, setItem: async (_, value) => { data = value; } };
  const api = { save: async value => { if (fail) throw Error('offline'); saves++; return { item: { ...value, id: 'remote' } }; } };
  let local = load(storage, api);
  const item = await local.save(input);
  await assert.rejects(local.sync('a', () => true));
  local = load(storage, api);
  fail = false;
  await local.sync('b', () => true);
  assert.equal(saves, 0);
  await local.sync('a', () => true);
  assert.equal(saves, 1);
  assert.equal((await local.get(item.id, 'a')).synced, true);
});
