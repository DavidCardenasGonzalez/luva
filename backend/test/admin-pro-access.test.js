const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildManualCodeGrantState,
  buildManualCodeRevocationState,
} = require('../dist/admin/pro-access.js');

test('buildManualCodeGrantState grants code Pro from now when the user is free', async () => {
  const result = buildManualCodeGrantState({
    premiumDays: 30,
    now: '2026-04-05T12:00:00.000Z',
  });

  assert.equal(result.effectiveFrom, '2026-04-05T12:00:00.000Z');
  assert.equal(result.expiresAt, '2026-05-05T12:00:00.000Z');
  assert.equal(result.extendedExistingGrant, false);
  assert.equal(result.source, 'code');
  assert.equal(result.isPro, true);
});

test('buildManualCodeGrantState extends an active code grant from its current expiration', async () => {
  const result = buildManualCodeGrantState({
    premiumDays: 15,
    now: '2026-04-05T12:00:00.000Z',
    currentCode: {
      isActive: true,
      updatedAt: '2026-04-01T10:00:00.000Z',
      expiresAt: '2026-04-20T12:00:00.000Z',
    },
  });

  assert.equal(result.effectiveFrom, '2026-04-20T12:00:00.000Z');
  assert.equal(result.expiresAt, '2026-05-05T12:00:00.000Z');
  assert.equal(result.previousCodeExpiresAt, '2026-04-20T12:00:00.000Z');
  assert.equal(result.extendedExistingGrant, true);
  assert.equal(result.source, 'code');
});

test('buildManualCodeGrantState keeps multiple sources when subscription is still active', async () => {
  const result = buildManualCodeGrantState({
    premiumDays: 10,
    now: '2026-04-05T12:00:00.000Z',
    currentSubscription: {
      isActive: true,
      updatedAt: '2026-04-05T08:00:00.000Z',
      expiresAt: '2026-04-25T12:00:00.000Z',
      entitlementId: 'Luva Pro',
      productId: 'luva_pro_monthly',
    },
  });

  assert.equal(result.source, 'multiple');
  assert.equal(result.isPro, true);
  assert.equal(result.expiresAt, '2026-04-15T12:00:00.000Z');
});

test('buildManualCodeRevocationState revokes a code-only membership and leaves the user free', async () => {
  const result = buildManualCodeRevocationState({
    now: '2026-04-05T12:00:00.000Z',
    currentCode: {
      isActive: true,
      updatedAt: '2026-04-01T10:00:00.000Z',
      expiresAt: '2026-04-20T12:00:00.000Z',
      redeemedCode: 'ADMIN_PORTAL',
    },
  });

  assert.ok(result);
  assert.equal(result.isPro, false);
  assert.equal(result.source, 'free');
  assert.equal(result.nextCode.isActive, false);
  assert.equal(result.nextCode.expiresAt, '2026-04-05T12:00:00.000Z');
});

test('buildManualCodeRevocationState keeps Pro when a subscription is still active', async () => {
  const result = buildManualCodeRevocationState({
    now: '2026-04-05T12:00:00.000Z',
    currentCode: {
      isActive: true,
      updatedAt: '2026-04-01T10:00:00.000Z',
      expiresAt: '2026-04-20T12:00:00.000Z',
      redeemedCode: 'ADMIN_PORTAL',
    },
    currentSubscription: {
      isActive: true,
      updatedAt: '2026-04-05T08:00:00.000Z',
      expiresAt: '2026-04-25T12:00:00.000Z',
      entitlementId: 'Luva Pro',
      productId: 'luva_pro_monthly',
    },
  });

  assert.ok(result);
  assert.equal(result.isPro, true);
  assert.equal(result.source, 'subscription');
});
