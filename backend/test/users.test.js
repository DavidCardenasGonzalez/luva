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

test('POST /v1/users/me/devices requires Cognito email claim', async () => {
  const res = await handler({
    httpMethod: 'POST',
    path: '/v1/users/me/devices',
    requestContext: {
      http: { method: 'POST', path: '/v1/users/me/devices' },
      authorizer: { claims: {} },
    },
  });

  assert.equal(res.statusCode, 401);
  const body = JSON.parse(res.body);
  assert.equal(body.code, 'UNAUTHORIZED');
});

test('POST /v1/users/me/devices validates push token payload', async () => {
  const res = await handler({
    httpMethod: 'POST',
    path: '/v1/users/me/devices',
    body: JSON.stringify({
      deviceId: 'luva-test-device',
      expoPushToken: 'not-a-token',
    }),
    requestContext: {
      http: { method: 'POST', path: '/v1/users/me/devices' },
      authorizer: {
        claims: {
          email: 'Test@Example.com',
          sub: 'user-sub',
        },
      },
    },
  });

  assert.equal(res.statusCode, 400);
  const body = JSON.parse(res.body);
  assert.equal(body.code, 'INVALID_DEVICE');
});
