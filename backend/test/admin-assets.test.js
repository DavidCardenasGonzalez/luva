const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildAdminAssetObjectKey,
  buildAssetPublicUrl,
  normalizeAdminAssetUploadRequest,
} = require('../dist/admin/assets.js');

test('normalizeAdminAssetUploadRequest accepts configured folder and image types', () => {
  assert.deepEqual(
    normalizeAdminAssetUploadRequest({
      folder: 'storiesProfile',
      contentType: 'IMAGE/JPEG',
      fileName: 'profile.jpg',
    }),
    {
      folder: 'storiesProfile',
      contentType: 'image/jpeg',
    },
  );

  assert.deepEqual(
    normalizeAdminAssetUploadRequest({
      folder: 'storiesProfile',
      contentType: '',
      fileName: 'cover.webp',
    }),
    {
      folder: 'storiesProfile',
      contentType: 'image/webp',
    },
  );
});

test('normalizeAdminAssetUploadRequest rejects unknown folders and unsafe image types', () => {
  assert.throws(
    () =>
      normalizeAdminAssetUploadRequest({
        folder: 'avatars',
        contentType: 'image/png',
      }),
    /INVALID_ASSET_FOLDER/,
  );

  assert.throws(
    () =>
      normalizeAdminAssetUploadRequest({
        folder: 'storiesProfile',
        contentType: 'image/svg+xml',
        fileName: 'profile.svg',
      }),
    /INVALID_ASSET_CONTENT_TYPE/,
  );
});

test('buildAdminAssetObjectKey stores files below the selected folder', () => {
  const key = buildAdminAssetObjectKey({
    folder: 'storiesProfile',
    contentType: 'image/png',
    id: 'asset-id_123',
    now: '2026-04-11T18:20:30.000Z',
  });

  assert.equal(key, 'storiesProfile/20260411182030-asset-id123.png');
});

test('buildAssetPublicUrl returns a CloudFront URL for the asset key', () => {
  assert.equal(
    buildAssetPublicUrl('storiesProfile/20260411182030-profile image.png', 'd123.cloudfront.net/'),
    'https://d123.cloudfront.net/storiesProfile/20260411182030-profile%20image.png',
  );
});
