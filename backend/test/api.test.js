// Builds in npm test now; uses CommonJS
const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../dist/handlers/api.js');

test('GET /v1/cards returns items', async () => {
  const res = await handler({
    httpMethod: 'GET',
    path: '/v1/cards',
    requestContext: { http: { method: 'GET', path: '/v1/cards' } },
  });
  console.log(res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.ok(Array.isArray(body.items));
  assert.ok(body.items.length >= 1);
});
