const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildVideoPublicationSettlement,
  chooseTikTokPrivacyLevel,
} = require('../dist/video-publisher.js');

test('buildVideoPublicationSettlement marks video as uploaded when enabled platforms succeed', () => {
  const settlement = buildVideoPublicationSettlement(
    {
      storyId: 'story_1',
      videoId: 'video_1',
      title: 'Video 1',
      status: 'programado',
      publishOn: '2026-04-06T10:00:00.000Z',
      instagramPublishStatus: 'pendiente',
      tiktokPublishStatus: 'pendiente',
    },
    {
      instagram: true,
      tiktok: true,
    },
    {
      instagram: {
        status: 'subido',
        publishedAt: '2026-04-06T10:07:00.000Z',
        containerId: '1789',
        mediaId: '9911',
      },
      tiktok: {
        status: 'subido',
        publishedAt: '2026-04-06T10:07:00.000Z',
        publishId: 'tik_1',
        postId: 'tik_post_1',
      },
    },
    '2026-04-06T10:07:00.000Z',
  );

  assert.equal(settlement.status, 'subido');
  assert.equal(settlement.instagramPublishStatus, 'subido');
  assert.equal(settlement.instagramMediaId, '9911');
  assert.equal(settlement.tiktokPublishStatus, 'subido');
  assert.equal(settlement.tiktokPostId, 'tik_post_1');
  assert.equal(settlement.lastPublishError, undefined);
});

test('buildVideoPublicationSettlement keeps prior success and retries the missing platform', () => {
  const settlement = buildVideoPublicationSettlement(
    {
      storyId: 'story_2',
      videoId: 'video_2',
      title: 'Video 2',
      status: 'programado',
      publishOn: '2026-04-06T10:00:00.000Z',
      instagramPublishStatus: 'subido',
      instagramPublishedAt: '2026-04-06T10:01:00.000Z',
      instagramMediaId: 'ig_123',
      instagramContainerId: 'ig_container_1',
      tiktokPublishStatus: 'pendiente',
    },
    {
      instagram: true,
      tiktok: true,
    },
    {
      tiktok: {
        status: 'error',
        error: 'access_token_invalid',
      },
    },
    '2026-04-06T10:08:00.000Z',
  );

  assert.equal(settlement.status, 'programado');
  assert.equal(settlement.instagramPublishStatus, 'subido');
  assert.equal(settlement.instagramMediaId, 'ig_123');
  assert.equal(settlement.tiktokPublishStatus, 'error');
  assert.equal(settlement.tiktokLastError, 'access_token_invalid');
  assert.match(settlement.lastPublishError, /access_token_invalid/);
});

test('chooseTikTokPrivacyLevel falls back safely when requested privacy is unavailable', () => {
  assert.equal(
    chooseTikTokPrivacyLevel(['MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'], 'PUBLIC_TO_EVERYONE'),
    'SELF_ONLY',
  );
  assert.equal(
    chooseTikTokPrivacyLevel(['FOLLOWER_OF_CREATOR'], 'SELF_ONLY'),
    'FOLLOWER_OF_CREATOR',
  );
});
