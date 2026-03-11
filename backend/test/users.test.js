const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../dist/handlers/users.js');

test('GET /v1/users/me requires Cognito email claim', async () => {
  const res = await handler({
    httpMethod: 'GET',
    path: '/v1/users/me',
    requestContext: {
      http: { method: 'GET', path: '/v1/users/me' },
      authorizer: { claims: {} },
    },
  });

  assert.equal(res.statusCode, 401);
  const body = JSON.parse(res.body);
  assert.equal(body.code, 'UNAUTHORIZED');
});
