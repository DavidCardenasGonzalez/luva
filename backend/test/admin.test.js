const test = require('node:test');
const assert = require('node:assert/strict');
process.env.CHARACTERS_TABLE_NAME = 'test-characters';
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { CHARACTERS } = require('../dist/data/characters');
const originalDynamoSend = DynamoDBDocumentClient.prototype.send;
DynamoDBDocumentClient.prototype.send = function (command) {
  if (command.input?.TableName === process.env.CHARACTERS_TABLE_NAME) {
    const id = command.input?.Key?.characterId;
    if (id) return Promise.resolve({ Item: CHARACTERS.find(character => character.characterId === id) });
    return Promise.resolve({ Items: CHARACTERS });
  }
  return originalDynamoSend.call(this, command);
};
const { handler } = require('../dist/handlers/admin.js');

test('series administration requires email and admin role for every operation', async () => {
  for (const [httpMethod, path] of [['GET', '/v1/admin/microdramas'], ['GET', '/v1/admin/microdramas/mateo'], ['POST', '/v1/admin/microdramas'], ['PUT', '/v1/admin/microdramas/mateo'], ['POST', '/v1/admin/microdramas/mateo/delete']]) {
    assert.equal((await handler({ httpMethod, path })).statusCode, 401);
    assert.equal((await handler({ httpMethod, path, requestContext: { authorizer: { claims: { email: 'member@example.com', 'cognito:groups': 'member' } } } })).statusCode, 403);
  }
});

test('series creation and updates reject malformed admin payloads', async () => {
  const requestContext = { authorizer: { claims: { email: 'admin@example.com', 'cognito:groups': 'admin' } } };
  const created = await handler({ resource: '/v1/admin/{proxy+}', httpMethod: 'POST', path: '/v1/admin/microdramas', requestContext, body: '{}' });
  assert.equal(created.statusCode, 400);
  assert.equal(JSON.parse(created.body).code, 'INVALID_MICRODRAMA');
  const updated = await handler({ resource: '/v1/admin/{proxy+}', httpMethod: 'PUT', path: '/v1/admin/microdramas/mateo', requestContext, body: '{"expectedVersion":0}' });
  assert.equal(updated.statusCode, 400);
});

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

