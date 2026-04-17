const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildAdminVideoPublicationUpdate,
  buildAdminVideoPublicationState,
  buildAdminVideosResponse,
} = require('../dist/admin/videos.js');

test('buildAdminVideosResponse normalizes status and summarizes scheduled days', () => {
  const response = buildAdminVideosResponse([
    {
      storyId: 'story_pending',
      videoId: 'video_1',
      title: 'Pendiente',
      uploadedAt: '2026-04-05T10:00:00.000Z',
    },
    {
      storyId: 'story_scheduled',
      videoId: 'video_2',
      title: 'Programado',
      status: 'programado',
      publishOn: '2026-04-12T15:30:00.000Z',
      uploadedAt: '2026-04-05T11:00:00.000Z',
    },
    {
      storyId: 'story_discarded',
      videoId: 'video_3',
      title: 'Descartado',
      status: 'descartado',
      publishOn: '2026-04-12T18:00:00.000Z',
      uploadedAt: '2026-04-05T09:00:00.000Z',
    },
  ]);

  assert.equal(response.videos.length, 3);
  assert.equal(response.videos[0].status, 'por_programar');
  assert.equal(response.stats.pendingToSchedule, 1);
  assert.equal(response.stats.scheduledVideos, 1);
  assert.equal(response.stats.discardedVideos, 1);
  assert.deepEqual(response.stats.scheduledByDay, [{ date: '2026-04-12', count: 1 }]);
});

test('buildAdminVideoPublicationState assigns publishOn and clears it when returning to pending', () => {
  const scheduled = buildAdminVideoPublicationState(
    {
      storyId: 'story_1',
      videoId: 'video_1',
      title: 'Video 1',
      status: 'por_programar',
      uploadedAt: '2026-04-05T10:00:00.000Z',
      updatedAt: '2026-04-05T10:00:00.000Z',
    },
    {
      status: 'programado',
      publishOn: '2026-04-14T16:45:00.000Z',
    },
    {
      now: '2026-04-06T08:30:00.000Z',
    },
  );

  assert.equal(scheduled.status, 'programado');
  assert.equal(scheduled.publishOn, '2026-04-14T16:45:00.000Z');
  assert.equal(scheduled.updatedAt, '2026-04-06T08:30:00.000Z');

  const pendingAgain = buildAdminVideoPublicationState(
    scheduled,
    {
      status: 'por_programar',
    },
    {
      now: '2026-04-06T09:00:00.000Z',
    },
  );

  assert.equal(pendingAgain.status, 'por_programar');
  assert.equal(pendingAgain.publishOn, undefined);
  assert.equal(pendingAgain.updatedAt, '2026-04-06T09:00:00.000Z');
});

test('buildAdminVideoPublicationState rejects invalid dates for publishOn', () => {
  assert.throws(
    () =>
      buildAdminVideoPublicationState(
        {
          storyId: 'story_2',
          videoId: 'video_2',
          title: 'Video 2',
          status: 'por_programar',
          uploadedAt: '2026-04-05T10:00:00.000Z',
          updatedAt: '2026-04-05T10:00:00.000Z',
        },
        {
          status: 'programado',
          publishOn: '14-04-2026 10:00',
        },
      ),
    /INVALID_PUBLISH_ON/,
  );
});

test('buildAdminVideoPublicationUpdate removes stored publishOn when the raw item still has null', () => {
  const nextVideo = buildAdminVideoPublicationState(
    {
      storyId: 'story_3',
      videoId: 'video_3',
      title: 'Video 3',
      status: 'por_programar',
      uploadedAt: '2026-04-05T10:00:00.000Z',
      updatedAt: '2026-04-05T10:00:00.000Z',
    },
    {
      status: 'descartado',
    },
    {
      now: '2026-04-06T10:00:00.000Z',
    },
  );

  const update = buildAdminVideoPublicationUpdate(
    {
      storyId: 'story_3',
      videoId: 'video_3',
      status: 'por_programar',
      publishOn: null,
    },
    nextVideo,
  );

  assert.match(update.updateExpression, /REMOVE publishOn/);
  assert.equal(update.expressionAttributeValues[':status'], 'descartado');
  assert.equal(update.expressionAttributeValues[':updatedAt'], '2026-04-06T10:00:00.000Z');
  assert.equal(Object.hasOwn(update.expressionAttributeValues, ':publishOn'), false);
});
