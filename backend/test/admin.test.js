const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../dist/handlers/admin.js');

test('GET /v1/admin/overview requires Cognito email claim', async () => {
  const res = await handler({
    httpMethod: 'GET',
    path: '/v1/admin/overview',
    requestContext: {
      http: { method: 'GET', path: '/v1/admin/overview' },
      authorizer: { claims: { 'cognito:groups': 'admin' } },
    },
  });

  assert.equal(res.statusCode, 401);
  const body = JSON.parse(res.body);
  assert.equal(body.code, 'UNAUTHORIZED');
});

test('GET /v1/admin/overview rejects authenticated users without admin role', async () => {
  const res = await handler({
    httpMethod: 'GET',
    path: '/v1/admin/overview',
    requestContext: {
      http: { method: 'GET', path: '/v1/admin/overview' },
      authorizer: {
        claims: {
          email: 'user@example.com',
          'cognito:groups': 'member',
        },
      },
    },
  });

  assert.equal(res.statusCode, 403);
  const body = JSON.parse(res.body);
  assert.equal(body.code, 'FORBIDDEN');
});

test('GET /v1/admin/overview returns admin overview for admin users', async () => {
  const res = await handler({
    httpMethod: 'GET',
    path: '/v1/admin/overview',
    requestContext: {
      http: { method: 'GET', path: '/v1/admin/overview' },
      authorizer: {
        claims: {
          email: 'admin@example.com',
          name: 'Admin Luva',
          'cognito:groups': 'admin,ops',
          identities: JSON.stringify([{ providerName: 'Google' }]),
        },
      },
    },
  });

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.admin.email, 'admin@example.com');
  assert.equal(body.admin.displayName, 'Admin Luva');
  assert.equal(body.permissions.isAdmin, true);
  assert.deepEqual(body.permissions.matchedRoles, ['admin']);
  assert.equal(body.portal.routePrefix, '/v1/admin');
});

