import { api } from '../api/api';

export type VideoPostMetricEvent = 'play' | 'watched3s' | 'conversation';

export const RECORD_DEV_VIDEO_POST_METRICS = false;

export function shouldRecordVideoPostMetrics(): boolean {
  return !__DEV__ || RECORD_DEV_VIDEO_POST_METRICS;
}

const sentMetrics = new Set<string>();

function metricKey(characterId: string, postId: string, event: VideoPostMetricEvent): string {
  return `${characterId}:${postId}:${event}`;
}

export function recordVideoPostMetric(
  characterId: string,
  postId: string,
  event: VideoPostMetricEvent,
): void {
  if (!characterId || !postId) return;
  const key = metricKey(characterId, postId, event);
  if (sentMetrics.has(key)) return;
  sentMetrics.add(key);

  if (!shouldRecordVideoPostMetrics()) return;

  void api
    .post(
      `/feed/character-videos/${encodeURIComponent(characterId)}/${encodeURIComponent(postId)}/metric`,
      { event },
    )
    .catch(() => {
      sentMetrics.delete(key);
    });
}
