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

test('POST /v1/promo-codes/validate validates PRO123', async () => {
  const res = await handler({
    httpMethod: 'POST',
    path: '/v1/promo-codes/validate',
    body: JSON.stringify({ code: 'PRO123' }),
    requestContext: { http: { method: 'POST', path: '/v1/promo-codes/validate' } },
  });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.code, 'PRO123');
  assert.equal(body.isValid, true);
  assert.equal(body.premiumDays, 30);
});

test('POST /v1/promo-codes/validate rejects unknown codes', async () => {
  const res = await handler({
    httpMethod: 'POST',
    path: '/v1/promo-codes/validate',
    body: JSON.stringify({ code: 'NOPE' }),
    requestContext: { http: { method: 'POST', path: '/v1/promo-codes/validate' } },
  });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.code, 'PRO123');
  assert.equal(body.isValid, false);
  assert.equal(body.premiumDays, 30);
});
